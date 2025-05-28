package redis_tool

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"errors"
	"fmt"
	"math/rand"
	"sort"
	"time"

	"github.com/spf13/viper"
	"golang.org/x/sync/singleflight"
	"gorm.io/gorm"

	"github.com/vmihailenco/msgpack/v5"
)

// 全局singleflight组，用于防止缓存击穿
var sfGroup singleflight.Group

// 使用singleflight防止缓存击穿
func GetOrCacheSingleFlight(key string, model interface{}, callback func() (interface{}, error), cacheTime time.Duration, enableRandomTime bool) error {
	// 1. 尝试从缓存获取数据
	value, err := dbtool.Redis().Get(key).Result()
	if err == nil {
		// 缓存命中，直接返回
		if err := msgpack.Unmarshal([]byte(value), model); err != nil {
			return err
		}
		return nil
	}

	// 2. 缓存未命中，使用singleflight防止缓存击穿
	// singleflight确保同一个key只有一个goroutine执行回调函数
	result, err, _ := sfGroup.Do(key, func() (interface{}, error) {
		// 双重检查，避免在等待期间其他goroutine已经设置了缓存
		value, err := dbtool.Redis().Get(key).Result()
		if err == nil {
			// 缓存已存在，直接返回序列化的字节数据
			return []byte(value), nil
		}

		// 执行回调获取数据
		data, err := callback()
		if err != nil {
			return nil, err
		}

		// 设置随机过期时间，避免同时大量过期
		expireTime := cacheTime
		if enableRandomTime {
			expireTime += time.Duration(rand.Intn(500)) * time.Millisecond
		}

		// 序列化并存入Redis
		b, err := msgpack.Marshal(data)
		if err != nil {
			return nil, err
		}

		if err := dbtool.Redis().Set(key, b, expireTime).Err(); err != nil {
			return nil, err
		}

		// 返回序列化的字节数据，避免并发问题
		return b, nil
	})

	if err != nil {
		return err
	}

	// 将结果反序列化到model中
	if bytes, ok := result.([]byte); ok {
		return msgpack.Unmarshal(bytes, model)
	}

	return errors.New("unexpected result type from singleflight")
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
var gameScoreBoardCacheTime = viper.GetDuration("redis-cache-time.game-scoreboard")

func CachedMemberSearchTeamMap(gameID int64) (map[string]models.Team, error) {
	var memberBelongSearchMap map[string]models.Team = make(map[string]models.Team)

	if err := GetOrCacheSingleFlight(fmt.Sprintf("all_teams_for_game_%d", gameID), &memberBelongSearchMap, func() (interface{}, error) {
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

	if err := GetOrCacheSingleFlight("user_list", &allUserMap, func() (interface{}, error) {
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

	if err := GetOrCacheSingleFlight("file_list", &filesMap, func() (interface{}, error) {
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
	var solveMap map[int64][]models.Solve = make(map[int64][]models.Solve)

	if err := GetOrCacheSingleFlight(fmt.Sprintf("solved_challenges_for_game_%d", gameID), &solveMap, func() (interface{}, error) {
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

	if err := GetOrCacheSingleFlight(fmt.Sprintf("game_info_%d", gameID), &game, func() (interface{}, error) {
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

type TimeLineScoreItem struct {
	RecordTime int64   `json:"record_time"`
	Score      float64 `json:"score"`
}

type TimeLineItem struct {
	TeamID   int64               `json:"team_id"`
	TeamName string              `json:"team_name"`
	Scores   []TimeLineScoreItem `json:"scores"`
}

type TeamSolveItem struct {
	ChallengeID int64     `json:"challenge_id"`
	Score       float64   `json:"score"`
	Solver      string    `json:"solver"`
	Rank        int64     `json:"rank"`
	SolveTime   time.Time `json:"solve_time"`
}

type TeamScoreItem struct {
	TeamID           int64           `json:"team_id"`
	TeamName         string          `json:"team_name"`
	TeamAvatar       *string         `json:"team_avatar"`
	TeamSlogan       *string         `json:"team_slogan"`
	TeamDescription  *string         `json:"team_description"`
	Rank             int64           `json:"rank"`
	Score            float64         `json:"score"`
	Penalty          int64           `json:"penalty"` // 罚时（秒）
	SolvedChallenges []TeamSolveItem `json:"solved_challenges"`
	LastSolveTime    int64           `json:"last_solve_time"`
}

type CachedGameScoreBoardData struct {
	FinalScoreBoardMap map[int64]TeamScoreItem
	Top10TimeLines     []TimeLineItem
	Top10Teams         []TeamScoreItem
}

func CachedGameScoreBoard(gameID int64) (*CachedGameScoreBoardData, error) {
	var cachedData CachedGameScoreBoardData

	if err := GetOrCacheSingleFlight(fmt.Sprintf("game_scoreboard_%d", gameID), &cachedData, func() (interface{}, error) {
		var finalScoreBoardMap map[int64]TeamScoreItem = make(map[int64]TeamScoreItem)
		var timeLines []TimeLineItem = make([]TimeLineItem, 0)

		// 获取所有队伍
		var teams []models.Team
		if err := dbtool.DB().Where("game_id = ? AND team_status = ?", gameID, models.ParticipateApproved).Find(&teams).Error; err != nil {
			return nil, errors.New("failed to load teams")
		}

		// 获取所有解题记录
		var solves []models.Solve
		if err := dbtool.DB().Where("game_id = ?", gameID).
			Preload("GameChallenge").
			Preload("Solver").
			Order("solve_time ASC").
			Find(&solves).Error; err != nil {
			return nil, errors.New("failed to load solves")
		}

		// 计算每道题的首杀时间
		firstSolveTime := make(map[int64]time.Time) // challengeID -> 首杀时间
		for _, solve := range solves {
			if _, exists := firstSolveTime[solve.ChallengeID]; !exists {
				firstSolveTime[solve.ChallengeID] = solve.SolveTime
			}
		}

		// 计算每个队伍的总分和罚时
		teamDataMap := make(map[int64]*TeamScoreItem)

		// 初始化队伍数据
		for _, team := range teams {
			teamDataMap[team.TeamID] = &TeamScoreItem{
				TeamID:           team.TeamID,
				TeamName:         team.TeamName,
				TeamAvatar:       team.TeamAvatar,
				TeamSlogan:       team.TeamSlogan,
				TeamDescription:  team.TeamDescription,
				Score:            0,
				Penalty:          0,
				SolvedChallenges: make([]TeamSolveItem, 0),
				LastSolveTime:    0,
			}
		}

		// 计算每个队伍的分数和罚时
		for _, solve := range solves {
			if teamData, exists := teamDataMap[solve.TeamID]; exists {
				// 计算罚时（解题时间 - 首杀时间，单位：秒）
				penalty := int64(0)
				if firstTime, ok := firstSolveTime[solve.ChallengeID]; ok {
					penalty = int64(solve.SolveTime.Sub(firstTime).Seconds())
				}

				teamData.Score += solve.GameChallenge.CurScore
				teamData.Penalty += penalty
				teamData.SolvedChallenges = append(teamData.SolvedChallenges, TeamSolveItem{
					ChallengeID: solve.ChallengeID,
					Score:       solve.GameChallenge.CurScore,
					Solver:      solve.Solver.Username,
					Rank:        int64(solve.Rank),
					SolveTime:   solve.SolveTime,
				})

				if teamData.LastSolveTime < solve.SolveTime.UnixMilli() {
					teamData.LastSolveTime = solve.SolveTime.UnixMilli()
				}
			}
		}

		// 转换为切片并排序
		teamRankings := make([]*TeamScoreItem, 0, len(teamDataMap))
		for _, teamData := range teamDataMap {
			teamRankings = append(teamRankings, teamData)
		}

		// 使用 sort.Slice 进行多条件排序：
		// 1. 总分降序（分数高的排前面）
		// 2. 总分相同时，罚时升序（罚时少的排前面）
		// 3. 罚时相同时，最后解题时间降序（解题时间晚的排前面）
		// 4. 最后比较队伍名称（升序，字典序小的排前面）... 这个应该不会出现
		sort.Slice(teamRankings, func(i, j int) bool {
			teamI, teamJ := teamRankings[i], teamRankings[j]

			// 先比较总分（降序）
			if teamI.Score != teamJ.Score {
				return teamI.Score > teamJ.Score
			}

			// 总分相同时比较罚时（升序，罚时少的排前面）
			if teamI.Penalty != teamJ.Penalty {
				return teamI.Penalty < teamJ.Penalty
			}

			// 罚时相同时比较最后解题时间（降序，解题时间晚的排前面）
			if teamI.LastSolveTime != teamJ.LastSolveTime {
				return teamI.LastSolveTime > teamJ.LastSolveTime
			}

			// 最后比较队伍名称（升序，字典序小的排前面）... 这个应该不会出现
			return teamI.TeamName < teamJ.TeamName
		})

		// 设置排名
		for i, teamData := range teamRankings {
			teamData.Rank = int64(i + 1)
			finalScoreBoardMap[teamData.TeamID] = TeamScoreItem{
				TeamID:           teamData.TeamID,
				TeamName:         teamData.TeamName,
				TeamAvatar:       teamData.TeamAvatar,
				TeamSlogan:       teamData.TeamSlogan,
				TeamDescription:  teamData.TeamDescription,
				Rank:             teamData.Rank,
				Score:            teamData.Score,
				Penalty:          teamData.Penalty,
				SolvedChallenges: teamData.SolvedChallenges,
			}
		}

		// 获取 TOP10
		idx := 0
		top10Teams := make([]TeamScoreItem, 0, min(10, len(teamRankings)))
		for _, teamData := range teamRankings {
			top10Teams = append(top10Teams, TeamScoreItem{
				TeamID:           teamData.TeamID,
				TeamName:         teamData.TeamName,
				TeamAvatar:       teamData.TeamAvatar,
				TeamSlogan:       teamData.TeamSlogan,
				TeamDescription:  teamData.TeamDescription,
				Rank:             teamData.Rank,
				Score:            teamData.Score,
				Penalty:          teamData.Penalty,
				SolvedChallenges: teamData.SolvedChallenges,
			})
			idx += 1
			if idx == 10 {
				break
			}
		}

		// 构建时间线数据（基于原有的 scoreboard 数据）
		var scoreboardItems []models.ScoreBoard
		if err := dbtool.DB().Where("game_id = ?", gameID).Find(&scoreboardItems).Error; err != nil {
			return nil, errors.New("failed to load scoreboards")
		}

		var scoreboardRecords []models.ScoreBoardDataWithTime
		for _, item := range scoreboardItems {
			scoreboardRecords = append(scoreboardRecords, item.Data...)
		}

		// 如果没有历史记录，创建空的时间线
		if len(scoreboardRecords) == 0 {
			timeLines = make([]TimeLineItem, 0)
		} else {
			sort.Slice(scoreboardRecords, func(i, j int) bool {
				return scoreboardRecords[i].RecordTime.Before(scoreboardRecords[j].RecordTime)
			})

			// 构建 TOP10 的时间线
			timeLineMap := make(map[int64]TimeLineItem)
			prevScoreMap := make(map[int64]float64)

			for _, team := range top10Teams {
				timeLineMap[team.TeamID] = TimeLineItem{
					TeamID:   team.TeamID,
					TeamName: team.TeamName,
					Scores:   make([]TimeLineScoreItem, 0),
				}
			}

			// 统计时间线数据
			for _, item := range scoreboardRecords {
				recordTime := item.RecordTime
				for teamID, scoreValue := range item.Data {
					if timeline, ok := timeLineMap[teamID]; ok {
						lastScore, valid := prevScoreMap[teamID]
						if !valid || lastScore != scoreValue.Score {
							timeline.Scores = append(timeline.Scores, TimeLineScoreItem{
								RecordTime: recordTime.UnixMilli(),
								Score:      scoreValue.Score,
							})
							timeLineMap[teamID] = timeline
							prevScoreMap[teamID] = scoreValue.Score
						}
					}
				}
			}

			// 转换时间线数据
			timeLines = make([]TimeLineItem, 0, len(timeLineMap))
			for _, item := range timeLineMap {
				timeLines = append(timeLines, item)
			}

			// 按照最终排名排序时间线
			sort.Slice(timeLines, func(i, j int) bool {
				// 找到对应队伍的排名
				rankI, rankJ := 999999, 999999
				teamI, ok := finalScoreBoardMap[timeLines[i].TeamID]
				if ok {
					rankI = int(teamI.Rank)
				}
				teamJ, ok := finalScoreBoardMap[timeLines[j].TeamID]
				if ok {
					rankJ = int(teamJ.Rank)
				}
				return rankI < rankJ
			})
		}

		cachedData.FinalScoreBoardMap = finalScoreBoardMap
		cachedData.Top10TimeLines = timeLines
		cachedData.Top10Teams = top10Teams

		return cachedData, nil
	}, gameScoreBoardCacheTime, true); err != nil {
		return nil, err
	}

	return &cachedData, nil
}
