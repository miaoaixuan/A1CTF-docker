package jobs

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/ristretto_tool"
	"a1ctf/src/utils/zaphelper"
	"log"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
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
	query := dbtool.DB().Where("start_time <= ? AND end_time >= ?", time.Now().UTC(), time.Now().UTC())

	if err := query.Find(&active_games).Error; err != nil {
		println("Failed to load active games")
		return
	}

	var game_ids []int64
	for _, game := range active_games {
		game_ids = append(game_ids, game.GameID)
	}

	// 开始计算每只队伍当前的总分, 4000条一分块
	for _, game_id := range game_ids {

		var exists_scoreboard = true

		// 查找当前比赛 cur_records 小于 4000 的分块
		var scoreboardItem models.ScoreBoard
		if err := dbtool.DB().Where("game_id = ? AND cur_records < 4000", game_id).First(&scoreboardItem).Error; err != nil {
			if err != gorm.ErrRecordNotFound {
				println("Failed to load scoreboard item")
				return
			} else {
				exists_scoreboard = false
				scoreboardItem = models.ScoreBoard{
					GameID:       game_id,
					GenerateTime: time.Now().UTC(),
					Data:         make(models.ScoreBoardDataWithTimeList, 0),
					CurRecords:   0,
				}
			}
		}

		var solves []models.Solve
		if err := dbtool.DB().Where("game_id = ? AND solve_status = ?", game_id, models.SolveCorrect).Preload("GameChallenge").Preload("Team").Find(&solves).Error; err != nil {
			println("Failed to load game solves")
			return
		}

		var teamMap = make(map[int64]models.ScoreBoardData)
		for _, solve := range solves {
			if !solve.GameChallenge.Visible {
				continue
			}

			if scoreBoardData, exists := teamMap[solve.TeamID]; exists {
				scoreBoardData.Score += solve.GameChallenge.CurScore
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
				}

				scoreBoardData.Score += solve.GameChallenge.CurScore

				teamMap[solve.TeamID] = scoreBoardData
			}
		}

		// 加载分数修正并应用到队伍分数
		var adjustments []models.ScoreAdjustment
		if err := dbtool.DB().Where("game_id = ?", game_id).Find(&adjustments).Error; err != nil {
			println("Failed to load score adjustments")
			return
		}

		for _, adjustment := range adjustments {
			if scoreBoardData, exists := teamMap[adjustment.TeamID]; exists {
				scoreBoardData.Score += adjustment.ScoreChange
				teamMap[adjustment.TeamID] = scoreBoardData
			} else {
				// 如果队伍没有解题记录，但有分数修正，也需要创建记录
				var team models.Team
				if err := dbtool.DB().Where("team_id = ?", adjustment.TeamID).First(&team).Error; err == nil {
					scoreBoardData := models.ScoreBoardData{
						TeamName:             team.TeamName,
						SolvedChallenges:     make([]string, 0),
						NewSolvedChallengeID: nil,
						Score:                adjustment.ScoreChange,
					}
					teamMap[adjustment.TeamID] = scoreBoardData
				}
			}
		}

		scoreboardItemWithTime := models.ScoreBoardDataWithTime{
			RecordTime: time.Now().UTC(),
			Data:       teamMap,
		}

		scoreboardItem.Data = append(scoreboardItem.Data, scoreboardItemWithTime)

		if !exists_scoreboard {
			if err := dbtool.DB().Create(&scoreboardItem).Error; err != nil {
				log.Fatalf("failed to insert scoreboard item %+v", scoreboardItem)
			}
		} else {
			if err := dbtool.DB().Model(&scoreboardItem).Updates(models.ScoreBoard{
				Data:       scoreboardItem.Data,
				CurRecords: int32(len(scoreboardItem.Data)),
			}).Error; err != nil {
				log.Fatalf("failed to update scoreboard item %+v", scoreboardItem)
			}
		}
	}
}

func UpdateGameScoreBoardCache() {
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

	for _, game_id := range game_ids {
		if err := ristretto_tool.MakeGameScoreBoardCache(game_id); err != nil {
			zaphelper.Logger.Error("Failed to make game scoreboard cache", zap.Error(err), zap.Int64("game_id", game_id))
			continue
		}
	}
}
