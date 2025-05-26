package redis_tool

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/spf13/viper"
	"gorm.io/gorm"

	"github.com/vmihailenco/msgpack/v5"
)

// 使用分布式锁防止缓存击穿
func GetOrCache(key string, model interface{}, callback func() (interface{}, error), cacheTime time.Duration, enableRandomTime bool) error {
	// 1. 尝试从缓存获取数据
	value, err := dbtool.Redis().Get(key).Result()
	if err == nil {
		// 缓存命中，直接返回
		if err := msgpack.Unmarshal([]byte(value), model); err != nil {
			return err
		}
		return nil
	}

	// 2. 缓存未命中，使用分布式锁防止缓存击穿
	lockKey := fmt.Sprintf("lock:%s", key)
	// 尝试获取锁，过期时间10秒，防止死锁
	acquired, err := dbtool.Redis().SetNX(lockKey, "1", 10*time.Second).Result()
	if err != nil {
		return err
	}

	if acquired {
		// 获取到锁，执行回调函数重建缓存
		defer dbtool.Redis().Del(lockKey) // 确保锁被释放

		// 双重检查，避免多个进程同时重建
		value, err := dbtool.Redis().Get(key).Result()
		if err == nil {
			// 另一个进程已经重建了缓存
			if err := msgpack.Unmarshal([]byte(value), model); err != nil {
				return err
			}
			return nil
		}

		// 执行回调获取数据
		result, err := callback()
		if err != nil {
			return err
		}

		// 设置随机过期时间，避免同时大量过期
		expireTime := cacheTime

		if enableRandomTime {
			expireTime += time.Duration(rand.Intn(500)) * time.Millisecond
		}

		// 序列化并存入Redis
		b, err := msgpack.Marshal(&result)
		if err != nil {
			panic(err)
		}

		if err := dbtool.Redis().Set(key, b, expireTime).Err(); err != nil {
			return err
		}

		// 为调用者提供返回数据
		// 因为model是指针，直接将result赋值给它
		resultBytes, _ := msgpack.Marshal(result)
		return msgpack.Unmarshal(resultBytes, model)
	} else {
		// 未获取到锁，说明有其他请求正在重建缓存
		// 短暂等待后重试几次
		for i := 0; i < 3; i++ {
			time.Sleep(20 * time.Millisecond)
			value, err := dbtool.Redis().Get(key).Result()
			if err == nil {
				// 缓存已被重建
				return msgpack.Unmarshal([]byte(value), model)
			}
		}

		// 最后一次尝试调用回调
		result, err := callback()
		if err != nil {
			return err
		}

		// 为调用者提供返回数据
		resultBytes, _ := msgpack.Marshal(result)
		return msgpack.Unmarshal(resultBytes, model)
	}
}

func DeleteCache(key string) error {
	return dbtool.Redis().Del(key).Err()
}

// 这里设置 redis 的缓存时间
var userListCacheTime = viper.GetDuration("redis-cache-time.user-list")
var fileListCacheTime = viper.GetDuration("redis-cache-time.upload-list")
var solvedChallengesForGameCacheTime = viper.GetDuration("redis-cache-time.solved-challenges-for-game")
var gameInfoCacheTime = viper.GetDuration("redis-cache-time.game-info")
var allTeamsForGameCacheTime = viper.GetDuration("redis-cache-time.all-teams-for-game")

func CachedMemberSearchTeamMap(gameID int64) (map[string]models.Team, error) {
	var memberBelongSearchMap map[string]models.Team = make(map[string]models.Team)

	if err := GetOrCache(fmt.Sprintf("all_teams_for_game_%d", gameID), &memberBelongSearchMap, func() (interface{}, error) {
		var allTeams []models.Team
		if err := dbtool.DB().Find(&allTeams).Where("game_id = ?", gameID).Error; err != nil {
			return nil, err
		}

		for _, team := range allTeams {
			for _, teamMember := range team.TeamMembers {
				memberBelongSearchMap[teamMember] = team
			}
		}

		return memberBelongSearchMap, nil
	}, allTeamsForGameCacheTime, true); err != nil {
		return nil, err
	}

	return memberBelongSearchMap, nil
}

func CachedMemberMap() (map[string]models.User, error) {
	var allUserMap map[string]models.User = make(map[string]models.User)

	if err := GetOrCache("user_list", &allUserMap, func() (interface{}, error) {
		var allUsers []models.User

		if err := dbtool.DB().Find(&allUsers).Error; err != nil {
			return nil, err
		}

		for _, user := range allUsers {
			allUserMap[user.UserID] = user
		}

		return allUserMap, nil
	}, userListCacheTime, true); err != nil {
		return nil, err
	}

	return allUserMap, nil
}

func CachedFileMap() (map[string]models.Upload, error) {
	var filesMap map[string]models.Upload = make(map[string]models.Upload)

	if err := GetOrCache("file_list", &filesMap, func() (interface{}, error) {
		var files []models.Upload
		dbtool.DB().Find(&files)

		for _, file := range files {
			filesMap[file.FileID] = file
		}

		return filesMap, nil
	}, fileListCacheTime, true); err != nil {
		return nil, err
	}

	return filesMap, nil
}

func CachedSolvedChallengesForGame(gameID int64) (map[int64][]models.Solve, error) {
	var solveMap map[int64][]models.Solve

	if err := GetOrCache(fmt.Sprintf("solved_challenges_for_game_%d", gameID), &solveMap, func() (interface{}, error) {
		var totalSolves []models.Solve

		if err := dbtool.DB().Where("game_id = ? AND solve_status = ?", gameID, models.SolveCorrect).Preload("Challenge").Find(&totalSolves).Error; err != nil {
			return nil, err
		}

		for _, solve := range totalSolves {
			lastSolves, ok := solveMap[solve.TeamID]
			if !ok {
				lastSolves = make([]models.Solve, 0)
			}

			lastSolves = append(lastSolves, solve)
			solveMap[solve.TeamID] = lastSolves
		}

		return solveMap, nil
	}, solvedChallengesForGameCacheTime, true); err != nil {
		return nil, err
	}

	return solveMap, nil
}

func CachedGameInfo(gameID int64) (*models.Game, error) {
	var game models.Game

	if err := GetOrCache(fmt.Sprintf("game_info_%d", gameID), &game, func() (interface{}, error) {
		if err := dbtool.DB().Where("game_id = ?", gameID).First(&game).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return nil, errors.New("game not found")
			} else {
				return nil, err
			}
		}

		return game, nil
	}, gameInfoCacheTime, true); err != nil {
		return nil, err
	}

	return &game, nil
}
