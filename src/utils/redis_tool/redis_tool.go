package redis_tool

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/webmodels"
	"errors"
	"fmt"
	"math/rand"
	"sort"
	"time"

	"github.com/dgraph-io/ristretto/v2"
	"github.com/spf13/viper"
	"golang.org/x/sync/singleflight"
	"gorm.io/gorm"
)

var cachePool *ristretto.Cache[string, interface{}]

// 全局singleflight组，用于防止缓存击穿
var sfGroup singleflight.Group

func InitCachePool() {
	cache, err := ristretto.NewCache(&ristretto.Config[string, interface{}]{
		NumCounters: 1e7,     // number of keys to track frequency of (10M).
		MaxCost:     1 << 30, // maximum cost of cache (1GB).
		BufferItems: 64,      // number of keys per Get buffer.
	})
	if err != nil {
		panic(err)
	}
	cachePool = cache
	defer cache.Close()
}

// 使用singleflight防止缓存击穿
func GetOrCacheSingleFlight(key string, callback func() (interface{}, error), cacheTime time.Duration, enableRandomTime bool) (interface{}, error) {
	// 1. 尝试从缓存获取数据
	value, found := cachePool.Get(key)
	if found {
		return value, nil
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
		cachePool.SetWithTTL(key, data, 1, expireTime)

		return data, nil
	})

	if err != nil {
		return nil, err
	}

	// 将结果反序列化到model中
	return result, nil
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
var challengesForGameCacheTime = viper.GetDuration("redis-cache-time.challenges-for-game")

func CachedMemberSearchTeamMap(gameID int64) (map[string]models.Team, error) {
	var memberBelongSearchMap map[string]models.Team = make(map[string]models.Team)

	obj, err := GetOrCacheSingleFlight(fmt.Sprintf("all_teams_for_game_%d", gameID), func() (interface{}, error) {
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
	}, allTeamsForGameCacheTime, true)

	if err != nil {
		return nil, err
	}

	memberBelongSearchMap = obj.(map[string]models.Team)

	return memberBelongSearchMap, nil
}

func CachedMemberMap() (map[string]models.User, error) {
	var allUserMap map[string]models.User = make(map[string]models.User)

	obj, err := GetOrCacheSingleFlight("user_list", func() (interface{}, error) {
		var allUsers []models.User

		if err := dbtool.DB().Find(&allUsers).Error; err != nil {
			return nil, err
		}

		for _, user := range allUsers {
			allUserMap[user.UserID] = user
		}

		return allUserMap, nil
	}, userListCacheTime, true)

	if err != nil {
		return nil, err
	}

	allUserMap = obj.(map[string]models.User)

	return allUserMap, nil
}

func CachedFileMap() (map[string]models.Upload, error) {
	var filesMap map[string]models.Upload = make(map[string]models.Upload)

	obj, err := GetOrCacheSingleFlight("file_list", func() (interface{}, error) {
		var files []models.Upload
		dbtool.DB().Find(&files)

		for _, file := range files {
			filesMap[file.FileID] = file
		}

		return filesMap, nil
	}, fileListCacheTime, true)

	if err != nil {
		return nil, err
	}

	filesMap = obj.(map[string]models.Upload)

	return filesMap, nil
}

func CachedSolvedChallengesForGame(gameID int64) (map[int64][]models.Solve, error) {
	var solveMap map[int64][]models.Solve = make(map[int64][]models.Solve)

	obj, err := GetOrCacheSingleFlight(fmt.Sprintf("solved_challenges_for_game_%d", gameID), func() (interface{}, error) {
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
	}, solvedChallengesForGameCacheTime, true)

	if err != nil {
		return nil, err
	}

	solveMap = obj.(map[int64][]models.Solve)

	return solveMap, nil
}

func CachedGameInfo(gameID int64) (*models.Game, error) {
	var game models.Game

	obj, err := GetOrCacheSingleFlight(fmt.Sprintf("game_info_%d", gameID), func() (interface{}, error) {
		if err := dbtool.DB().Where("game_id = ?", gameID).First(&game).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return nil, errors.New("game not found")
			} else {
				return nil, err
			}
		}

		return game, nil
	}, gameInfoCacheTime, true)

	if err != nil {
		return nil, err
	}

	game = obj.(models.Game)

	return &game, nil
}

func CachedGameScoreBoard(gameID int64) (*webmodels.CachedGameScoreBoardData, error) {
	var cachedData webmodels.CachedGameScoreBoardData

	obj, err := GetOrCacheSingleFlight(fmt.Sprintf("game_scoreboard_%d", gameID), func() (interface{}, error) {
		var finalScoreBoardMap map[int64]webmodels.TeamScoreItem = make(map[int64]webmodels.TeamScoreItem)
		var timeLines []webmodels.TimeLineItem = make([]webmodels.TimeLineItem, 0)

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
		teamDataMap := make(map[int64]webmodels.TeamScoreItem)

		// 初始化队伍数据
		for _, team := range teams {
			teamDataMap[team.TeamID] = webmodels.TeamScoreItem{
				TeamID:           team.TeamID,
				TeamName:         team.TeamName,
				TeamAvatar:       team.TeamAvatar,
				TeamSlogan:       team.TeamSlogan,
				TeamDescription:  team.TeamDescription,
				GroupID:          team.GroupID,
				Score:            0,
				Penalty:          0,
				SolvedChallenges: make([]webmodels.TeamSolveItem, 0),
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
				teamData.SolvedChallenges = append(teamData.SolvedChallenges, webmodels.TeamSolveItem{
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
		teamRankings := make([]webmodels.TeamScoreItem, 0, len(teamDataMap))
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

			// 比较队伍 ID。。。
			return teamI.TeamID < teamJ.TeamID
		})

		processedTeamRankings := make([]webmodels.TeamScoreItem, 0, len(teamDataMap))

		// 设置排名
		for i, teamData := range teamRankings {
			teamData.Rank = int64(i + 1)
			tmp := webmodels.TeamScoreItem{
				TeamID:           teamData.TeamID,
				TeamName:         teamData.TeamName,
				TeamAvatar:       teamData.TeamAvatar,
				TeamSlogan:       teamData.TeamSlogan,
				TeamDescription:  teamData.TeamDescription,
				Rank:             teamData.Rank,
				Score:            teamData.Score,
				Penalty:          teamData.Penalty,
				SolvedChallenges: teamData.SolvedChallenges,
				GroupID:          teamData.GroupID,
			}
			finalScoreBoardMap[teamData.TeamID] = tmp
			processedTeamRankings = append(processedTeamRankings, tmp)
		}

		cachedData.TeamRankings = processedTeamRankings

		// 获取 TOP10
		idx := 0
		top10Teams := make([]webmodels.TeamScoreItem, 0, min(10, len(teamRankings)))
		for _, teamData := range teamRankings {
			top10Teams = append(top10Teams, webmodels.TeamScoreItem{
				TeamID:           teamData.TeamID,
				TeamName:         teamData.TeamName,
				TeamAvatar:       teamData.TeamAvatar,
				TeamSlogan:       teamData.TeamSlogan,
				TeamDescription:  teamData.TeamDescription,
				Rank:             teamData.Rank,
				Score:            teamData.Score,
				Penalty:          teamData.Penalty,
				SolvedChallenges: teamData.SolvedChallenges,
				GroupID:          teamData.GroupID,
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
			timeLines = make([]webmodels.TimeLineItem, 0)
			cachedData.AllTimeLines = make([]webmodels.TimeLineItem, 0)
		} else {
			sort.Slice(scoreboardRecords, func(i, j int) bool {
				return scoreboardRecords[i].RecordTime.Before(scoreboardRecords[j].RecordTime)
			})

			// 构建 TOP10 的时间线
			timeLineMap := make(map[int64]webmodels.TimeLineItem)
			prevScoreMap := make(map[int64]float64)

			for _, team := range top10Teams {
				timeLineMap[team.TeamID] = webmodels.TimeLineItem{
					TeamID:   team.TeamID,
					TeamName: team.TeamName,
					Scores:   make([]webmodels.TimeLineScoreItem, 0),
				}
			}

			// 构建所有队伍的时间线
			allTimeLineMap := make(map[int64]webmodels.TimeLineItem)
			allPrevScoreMap := make(map[int64]float64)

			// 初始化所有队伍的时间线
			for _, team := range teams {
				if teamData, ok := teamDataMap[team.TeamID]; ok {
					allTimeLineMap[team.TeamID] = webmodels.TimeLineItem{
						TeamID:   team.TeamID,
						TeamName: teamData.TeamName,
						Scores:   make([]webmodels.TimeLineScoreItem, 0),
					}
				}
			}

			// 统计时间线数据
			for _, item := range scoreboardRecords {
				recordTime := item.RecordTime
				for teamID, scoreValue := range item.Data {
					// 为 TOP10 构建时间线
					if timeline, ok := timeLineMap[teamID]; ok {
						lastScore, valid := prevScoreMap[teamID]
						if !valid || lastScore != scoreValue.Score {
							timeline.Scores = append(timeline.Scores, webmodels.TimeLineScoreItem{
								RecordTime: recordTime.UnixMilli(),
								Score:      scoreValue.Score,
							})
							timeLineMap[teamID] = timeline
							prevScoreMap[teamID] = scoreValue.Score
						}
					}

					// 为所有队伍构建时间线
					if allTimeline, ok := allTimeLineMap[teamID]; ok {
						lastScore, valid := allPrevScoreMap[teamID]
						if !valid || lastScore != scoreValue.Score {
							allTimeline.Scores = append(allTimeline.Scores, webmodels.TimeLineScoreItem{
								RecordTime: recordTime.UnixMilli(),
								Score:      scoreValue.Score,
							})
							allTimeLineMap[teamID] = allTimeline
							allPrevScoreMap[teamID] = scoreValue.Score
						}
					}
				}
			}

			// 转换 TOP10 时间线数据
			timeLines = make([]webmodels.TimeLineItem, 0, len(timeLineMap))
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

			// 转换所有队伍的时间线数据
			allTimeLines := make([]webmodels.TimeLineItem, 0, len(allTimeLineMap))
			for _, item := range allTimeLineMap {
				allTimeLines = append(allTimeLines, item)
			}

			// 按照最终排名排序所有队伍的时间线
			sort.Slice(allTimeLines, func(i, j int) bool {
				// 找到对应队伍的排名
				rankI, rankJ := 999999, 999999
				teamI, ok := finalScoreBoardMap[allTimeLines[i].TeamID]
				if ok {
					rankI = int(teamI.Rank)
				}
				teamJ, ok := finalScoreBoardMap[allTimeLines[j].TeamID]
				if ok {
					rankJ = int(teamJ.Rank)
				}
				return rankI < rankJ
			})

			// 将所有队伍的时间线数据存储到结构体中
			cachedData.AllTimeLines = allTimeLines
		}

		cachedData.FinalScoreBoardMap = finalScoreBoardMap
		cachedData.Top10TimeLines = timeLines
		cachedData.Top10Teams = top10Teams

		return cachedData, nil
	}, gameScoreBoardCacheTime, true)

	if err != nil {
		return nil, err
	}

	cachedData = obj.(webmodels.CachedGameScoreBoardData)

	return &cachedData, nil
}

func CachedGameGroups(gameID int64) (map[int64]models.GameGroup, error) {
	var gameGroupsMap map[int64]models.GameGroup = make(map[int64]models.GameGroup)

	game, err := CachedGameInfo(gameID)
	if err != nil {
		return nil, err
	}

	obj, err := GetOrCacheSingleFlight(fmt.Sprintf("game_groups_for_game_%d", game.GameID), func() (interface{}, error) {
		// 查找分组
		var tmpGameMap map[int64]models.GameGroup = make(map[int64]models.GameGroup)
		var tmpGameGroups []models.GameGroup
		if err := dbtool.DB().Where("game_id = ?", game.GameID).Find(&tmpGameGroups).Error; err != nil {
			return nil, errors.New("failed to load game groups")
		}

		for _, group := range tmpGameGroups {
			tmpGameMap[group.GroupID] = group
		}

		return tmpGameMap, nil
	}, challengesForGameCacheTime, true)

	if err != nil {
		return nil, err
	}

	gameGroupsMap = obj.(map[int64]models.GameGroup)

	return gameGroupsMap, nil
}

func CachedGameSimpleChallenges(gameID int64) ([]webmodels.UserSimpleGameChallenge, error) {

	var simpleGameChallenges []webmodels.UserSimpleGameChallenge = make([]webmodels.UserSimpleGameChallenge, 0)

	game, err := CachedGameInfo(gameID)
	if err != nil {
		return nil, err
	}

	obj, err := GetOrCacheSingleFlight(fmt.Sprintf("challenges_for_game_%d", game.GameID), func() (interface{}, error) {
		// 查找队伍
		var tmpSimpleGameChallenges []webmodels.UserSimpleGameChallenge = make([]webmodels.UserSimpleGameChallenge, 0)
		var gameChallenges []models.GameChallenge

		// 使用 Preload 进行关联查询
		if err := dbtool.DB().Preload("Challenge").Where("game_id = ?", game.GameID).Find(&gameChallenges).Error; err != nil {
			return nil, errors.New("failed to load game challenges")
		}

		sort.Slice(gameChallenges, func(i, j int) bool {
			return gameChallenges[i].Challenge.Name < gameChallenges[j].Challenge.Name
		})

		// 游戏阶段判断
		gameStages := game.Stages
		var curStage = ""

		if gameStages != nil {
			for _, stage := range *gameStages {
				if stage.StartTime.Before(time.Now()) && stage.EndTime.After(time.Now()) {
					curStage = stage.StageName
					break
				}
			}
		}

		for _, gc := range gameChallenges {

			if gc.BelongStage != nil && *gc.BelongStage != curStage {
				continue
			}

			if !gc.Visible {
				continue
			}

			tmpSimpleGameChallenges = append(tmpSimpleGameChallenges, webmodels.UserSimpleGameChallenge{
				ChallengeID:   *gc.Challenge.ChallengeID,
				ChallengeName: gc.Challenge.Name,
				TotalScore:    gc.TotalScore,
				CurScore:      gc.CurScore,
				SolveCount:    gc.SolveCount,
				Category:      gc.Challenge.Category,
			})
		}

		return tmpSimpleGameChallenges, nil
	}, challengesForGameCacheTime, true)

	// Cache challenge list to redis
	if err != nil {
		return nil, err
	}

	simpleGameChallenges = obj.([]webmodels.UserSimpleGameChallenge)

	return simpleGameChallenges, nil
}

// CachedGameGroupsWithTeamCount 缓存带队伍数量的分组信息
func CachedGameGroupsWithTeamCount(gameID int64) ([]webmodels.GameGroupSimple, error) {
	var gameGroupsWithTeamCount []webmodels.GameGroupSimple

	obj, err := GetOrCacheSingleFlight(fmt.Sprintf("game_groups_with_team_count_%d", gameID), func() (interface{}, error) {
		// 获取分组信息
		gameGroupMap, err := CachedGameGroups(gameID)
		if err != nil {
			return nil, err
		}

		// 获取排行榜数据
		scoreBoard, err := CachedGameScoreBoard(gameID)
		if err != nil {
			return nil, err
		}

		var result []webmodels.GameGroupSimple = make([]webmodels.GameGroupSimple, 0, len(gameGroupMap))
		for _, group := range gameGroupMap {
			// 统计每个分组的队伍数量
			teamCount := int64(0)
			for _, team := range scoreBoard.TeamRankings {
				if team.GroupID != nil && *team.GroupID == group.GroupID {
					teamCount++
				}
			}

			result = append(result, webmodels.GameGroupSimple{
				GroupID:   group.GroupID,
				GroupName: group.GroupName,
				TeamCount: teamCount,
			})
		}

		// 按 GroupID 排序
		sort.Slice(result, func(i, j int) bool {
			return result[i].GroupID < result[j].GroupID
		})

		return result, nil
	}, allTeamsForGameCacheTime, true)

	if err != nil {
		return nil, err
	}

	gameGroupsWithTeamCount = obj.([]webmodels.GameGroupSimple)

	return gameGroupsWithTeamCount, nil
}

// CachedFilteredGameScoreBoardData 缓存过滤后的排行榜数据
type CachedFilteredGameScoreBoardData struct {
	FilteredTeamRankings []webmodels.TeamScoreItem
	FilteredTimeLines    []webmodels.TimeLineItem
	TotalCount           int64
}

// CachedFilteredGameScoreBoard 缓存按分组过滤的排行榜数据
func CachedFilteredGameScoreBoard(gameID int64, groupID *int64) (*CachedFilteredGameScoreBoardData, error) {
	var cachedFilteredData CachedFilteredGameScoreBoardData

	// 构建缓存键
	var cacheKey string
	if groupID != nil {
		cacheKey = fmt.Sprintf("filtered_game_scoreboard_%d_group_%d", gameID, *groupID)
	} else {
		cacheKey = fmt.Sprintf("filtered_game_scoreboard_%d_all", gameID)
	}

	obj, err := GetOrCacheSingleFlight(cacheKey, func() (interface{}, error) {
		// 获取完整的排行榜数据
		scoreBoard, err := CachedGameScoreBoard(gameID)
		if err != nil {
			return nil, err
		}

		if groupID == nil {
			// 没有分组过滤，直接返回全部数据
			cachedFilteredData.FilteredTeamRankings = scoreBoard.TeamRankings
			cachedFilteredData.FilteredTimeLines = scoreBoard.AllTimeLines
			cachedFilteredData.TotalCount = int64(len(scoreBoard.TeamRankings))
		} else {
			// 按分组过滤
			filteredTeamRankings := make([]webmodels.TeamScoreItem, 0)
			filteredTimeLines := make([]webmodels.TimeLineItem, 0)

			// 创建时间线映射以便快速查找
			timeLineMap := make(map[int64]webmodels.TimeLineItem)
			for _, timeline := range scoreBoard.AllTimeLines {
				timeLineMap[timeline.TeamID] = timeline
			}

			// 过滤队伍排名数据
			for _, team := range scoreBoard.TeamRankings {
				if team.GroupID != nil && *team.GroupID == *groupID {
					filteredTeamRankings = append(filteredTeamRankings, team)
					// 添加对应的时间线数据
					if timeline, exists := timeLineMap[team.TeamID]; exists {
						filteredTimeLines = append(filteredTimeLines, timeline)
					}
				}
			}

			// 重新计算分组内的排名
			for i := range filteredTeamRankings {
				filteredTeamRankings[i].Rank = int64(i + 1)
			}

			cachedFilteredData.FilteredTeamRankings = filteredTeamRankings
			cachedFilteredData.FilteredTimeLines = filteredTimeLines
			cachedFilteredData.TotalCount = int64(len(filteredTeamRankings))
		}

		return cachedFilteredData, nil
	}, gameScoreBoardCacheTime, true)

	if err != nil {
		return nil, err
	}

	cachedFilteredData = obj.(CachedFilteredGameScoreBoardData)

	return &cachedFilteredData, nil
}
