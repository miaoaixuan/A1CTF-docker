package jobs

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/ristretto_tool"
	"a1ctf/src/utils/zaphelper"
	"math"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm/clause"
)

func updateActiveGameScores(game_ids []int64) {
	if len(game_ids) > 0 {

		// 更新每道题的解题人数
		if err := dbtool.DB().Exec(`
			UPDATE game_challenges gc
			SET solve_count = (
				SELECT COUNT(*) 
				FROM solves s 
				WHERE s.game_id = gc.game_id AND s.challenge_id = gc.challenge_id AND s.solve_status = '"SolveCorrect"'::jsonb
			)
			WHERE gc.game_id IN ?;
		`, game_ids).Error; err != nil {
			println("Failed to update solve count")
			return
		}

		// 更新每道题的分数
		if err := dbtool.DB().Exec(`
			UPDATE game_challenges gc
			SET cur_score = CASE
				WHEN gc.solve_count = 0 THEN gc.total_score
				ELSE FLOOR(
					gc.total_score * (
						(gc.minimal_score / gc.total_score) +
						(1 - (gc.minimal_score / gc.total_score)) *
						EXP((1 - gc.solve_count) / gc.difficulty)
					)
				)
			END
			WHERE gc.game_id IN ?;
		`, game_ids).Error; err != nil {
			println("Failed to update cur_score")
			return
		}

		// 更新每支队伍的分数（包含分数修正）
		if err := dbtool.DB().Exec(`
			UPDATE teams t
			SET team_score = COALESCE(team_scores.total_score, 0) + COALESCE(adjustments.adjustment_total, 0)
			FROM (
				SELECT 
					s.team_id,
					SUM(gc.cur_score) as total_score
				FROM solves s
				LEFT JOIN game_challenges gc ON s.ingame_id = gc.ingame_id
				WHERE s.game_id IN ? 
					AND s.solve_status = '"SolveCorrect"'::jsonb
					AND gc.visible = true
				GROUP BY s.team_id
			) team_scores
			LEFT JOIN (
				SELECT 
					sa.team_id,
					SUM(sa.score_change) as adjustment_total
				FROM score_adjustments sa
				WHERE sa.game_id IN ?
				GROUP BY sa.team_id
			) adjustments ON team_scores.team_id = adjustments.team_id
			WHERE t.team_id = team_scores.team_id
				AND t.game_id IN ?;
		`, game_ids, game_ids, game_ids).Error; err != nil {
			println("Failed to update team_score")
			return
		}
	}
}

func UpdateActivateGameScore() {
	var active_games []models.Game
	query := dbtool.DB().Where("start_time <= ? AND end_time >= ?", time.Now().UTC(), time.Now().UTC())

	if err := query.Find(&active_games).Error; err != nil {
		println("Failed to load active games")
		return
	}

	var game_ids []int64
	for _, game := range active_games {
		game_ids = append(game_ids, game.GameID)
	}

	// 更新比赛分数
	updateActiveGameScores(game_ids)
}

func UpdateActiveGameScoreBoard() {
	var active_games []models.Game
	query := dbtool.DB()
	// .Where("start_time <= ? AND end_time >= ?", time.Now().UTC(), time.Now().UTC())

	if err := query.Find(&active_games).Error; err != nil {
		println("Failed to load active games")
		return
	}

	for _, game := range active_games {
		gameID := game.GameID

		// 先获取时间，统一的
		curTime := time.Now().UTC()

		// 先获取比赛下的所有队伍
		var teamsParticipated []models.Team = make([]models.Team, 0)
		var participatedTeamIDs []int64
		if err := dbtool.DB().Where("game_id = ?", gameID).Find(&teamsParticipated).Error; err != nil {
			zaphelper.Logger.Error("Failed to load teams for game ", zap.Error(err), zap.Int64("game_id", gameID))
			return
		}

		for _, team := range teamsParticipated {
			participatedTeamIDs = append(participatedTeamIDs, team.TeamID)
		}

		// 获取上述队伍的积分榜
		var teamGameScoreborad []models.ScoreBoard = make([]models.ScoreBoard, 0)
		var teamGameScoreboardMap map[int64]models.ScoreBoard = make(map[int64]models.ScoreBoard)
		if err := dbtool.DB().Where("game_id = ? AND team_id IN ?", gameID, participatedTeamIDs).Preload("Team").Find(&teamGameScoreborad).Error; err != nil {
			zaphelper.Logger.Error("Failed to load team scoreboard for game ", zap.Error(err), zap.Int64("game_id", gameID))
			return
		}

		for _, scoreboard := range teamGameScoreborad {
			teamGameScoreboardMap[scoreboard.TeamID] = scoreboard
		}

		// 获取当前比赛的正确解题记录
		var solves []models.Solve
		if err := dbtool.DB().Where("game_id = ? AND solve_status = ?", gameID, models.SolveCorrect).Preload("GameChallenge").Preload("Game").Preload("Team").Find(&solves).Error; err != nil {
			zaphelper.Logger.Error("Failed to load solves for game ", zap.Error(err), zap.Int64("game_id", gameID))
			return
		}

		// 计算每个队伍的解题信息
		var teamMap = make(map[int64]models.ScoreBoardData)

		// 这里先根据现有的 Scoreboard 表项初始化一次 teamMap，防止后期后台操作导致队伍 0 solves 0 score-adjustments 后不更新 0 分
		for _, teamScore := range teamGameScoreborad {
			solvedList := make([]string, 0)
			scoreBoardData := models.ScoreBoardData{
				TeamName:             teamScore.Team.TeamName,
				SolvedChallenges:     solvedList,
				NewSolvedChallengeID: nil,
				Score:                0,
				RecordTime:           curTime,
			}
			teamMap[teamScore.TeamID] = scoreBoardData
		}

		for _, solve := range solves {
			if !solve.GameChallenge.Visible {
				// 如果题目现在不可见，就跳过
				continue
			}

			challengeScore := solve.GameChallenge.CurScore

			// 这里计算分数了，处理一下三血
			if solve.GameChallenge.BloodRewardEnabled && solve.Rank <= 3 {

				var rankRewardEnabled bool = false

				rewardScore := 0.0
				switch solve.Rank {
				case 3:
					rewardScore = float64(solve.Game.ThirdBloodReward) * solve.GameChallenge.CurScore / 100
					if solve.Game.ThirdBloodReward != 0 {
						rankRewardEnabled = true
					}
				case 2:
					rewardScore = float64(solve.Game.SecondBloodReward) * solve.GameChallenge.CurScore / 100
					if solve.Game.SecondBloodReward != 0 {
						rankRewardEnabled = true
					}
				case 1:
					rewardScore = float64(solve.Game.FirstBloodReward) * solve.GameChallenge.CurScore / 100
					if solve.Game.FirstBloodReward != 0 {
						rankRewardEnabled = true
					}
				}

				if rankRewardEnabled {
					rewardScore = math.Max(math.Floor(rewardScore), 1)

					challengeScore += rewardScore
				}
			}

			// 更新解题信息
			if scoreBoardData, exists := teamMap[solve.TeamID]; exists {

				scoreBoardData.Score += challengeScore
				scoreBoardData.SolvedChallenges = append(scoreBoardData.SolvedChallenges, solve.SolveID)

				teamMap[solve.TeamID] = scoreBoardData
			} else {
				solvedList := make([]string, 0)
				solvedList = append(solvedList, solve.SolveID)
				scoreBoardData := models.ScoreBoardData{
					TeamName:             solve.Team.TeamName,
					SolvedChallenges:     solvedList,
					NewSolvedChallengeID: nil,
					Score:                0,
					RecordTime:           curTime,
				}
				scoreBoardData.Score += challengeScore
				teamMap[solve.TeamID] = scoreBoardData
			}
		}

		// 加载分数修正
		var adjustments []models.ScoreAdjustment
		if err := dbtool.DB().Where("game_id = ?", gameID).Preload("Team").Find(&adjustments).Error; err != nil {
			zaphelper.Logger.Error("Failed to load score adjuestment for game ", zap.Error(err), zap.Int64("game_id", gameID))
			return
		}

		for _, adjustment := range adjustments {
			if scoreBoardData, exists := teamMap[adjustment.TeamID]; exists {
				// 有解题记录，直接修正
				scoreBoardData.Score += adjustment.ScoreChange
				teamMap[adjustment.TeamID] = scoreBoardData
			} else {
				// 没解题记录，创建新的
				solvedList := make([]string, 0)
				scoreBoardData := models.ScoreBoardData{
					TeamName:             adjustment.Team.TeamName,
					SolvedChallenges:     solvedList,
					NewSolvedChallengeID: nil,
					Score:                adjustment.ScoreChange,
					RecordTime:           curTime,
				}
				teamMap[adjustment.TeamID] = scoreBoardData
			}
		}

		// 现在已经计算完成当前所有队伍的解题记录，只需要更新进 sql 就行了

		for teamID, teamData := range teamMap {
			// 先判断是否是新数据
			tmpScoreboard, exists := teamGameScoreboardMap[teamID]

			if !exists {
				// 如果不存在，直接添加一条新的
				tmpScoreboardDatas := make(models.ScoreBoardDatas, 0)
				tmpScoreboardDatas = append(tmpScoreboardDatas, teamData)

				tmpScoreboard = models.ScoreBoard{
					GameID:         gameID,
					TeamID:         teamID,
					GenerateTime:   curTime,
					CurScore:       teamData.Score,
					Data:           tmpScoreboardDatas,
					LastUpdateTime: curTime,
				}

				teamGameScoreboardMap[teamID] = tmpScoreboard
			} else {
				// 如果存在，插入新数据

				if tmpScoreboard.CurScore != teamData.Score {
					tmpScoreboard.Data = append(tmpScoreboard.Data, teamData)
					tmpScoreboard.LastUpdateTime = curTime
					tmpScoreboard.CurScore = teamData.Score

				}

				teamGameScoreboardMap[teamID] = tmpScoreboard
			}
		}

		var scoreboards []models.ScoreBoard = make([]models.ScoreBoard, 0)
		for _, scoreboard := range teamGameScoreboardMap {
			scoreboards = append(scoreboards, scoreboard)
		}

		if len(scoreboards) > 0 {
			err := dbtool.DB().Clauses(clause.OnConflict{
				UpdateAll: true,
			}).Create(&scoreboards).Error

			if err != nil {
				zaphelper.Logger.Error("Failed to update scoreboard for game ", zap.Error(err), zap.Int64("game_id", gameID))
			}
		}

	}
}

func UpdateGameScoreBoardCache() {
	var active_games []models.Game
	query := dbtool.DB()
	// .Where("start_time <= ? AND end_time >= ?", time.Now().UTC(), time.Now().UTC())

	if err := query.Find(&active_games).Error; err != nil {
		println("Failed to load active games")
		return
	}

	var game_ids []int64
	for _, game := range active_games {
		game_ids = append(game_ids, game.GameID)
	}

	for _, game_id := range game_ids {
		if err := ristretto_tool.MakeGameScoreBoardCache(game_id); err != nil {
			zaphelper.Logger.Error("Failed to make game scoreboard cache", zap.Error(err), zap.Int64("game_id", game_id))
			continue
		}
	}
}
