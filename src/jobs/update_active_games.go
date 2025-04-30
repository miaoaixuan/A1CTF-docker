package jobs

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"log"
	"time"
)

func updateActiveGameScores(game_ids []int64) {
	if len(game_ids) > 0 {
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
	}
}

func UpdateActivateGames() {
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

	// 先更新每个比赛每道题目的当前分数
	updateActiveGameScores(game_ids)

	// 开始计算每只队伍当前的总分
	for _, game_id := range game_ids {
		var solves []models.Solve
		if err := dbtool.DB().Where("game_id = ?", game_id).Preload("GameChallenge").Preload("Team").Find(&solves).Error; err != nil {
			println("Failed to load game solves")
			return
		}

		var teamMap = make(map[int64]models.ScoreBoardData)
		for _, solve := range solves {
			if _, err := teamMap[solve.TeamID]; err == true {
				scoreBoardData := teamMap[solve.TeamID]

				scoreBoardData.Score += solve.GameChallenge.CurScore
				scoreBoardData.SolvedChallenges = append(scoreBoardData.SolvedChallenges, solve.ChallengeID)

				teamMap[solve.TeamID] = scoreBoardData
			} else {
				solvedList := make([]int64, 0)
				scoreBoardData := models.ScoreBoardData{
					TeamName:             solve.Team.TeamName,
					TeamID:               solve.TeamID,
					SolvedChallenges:     solvedList,
					NewSolvedChallengeID: nil,
					Score:                0,
				}
				teamMap[solve.TeamID] = scoreBoardData
			}
		}

		values := make(models.ScoreBoardDatas, 0, len(teamMap))
		for _, v := range teamMap {
			values = append(values, v)
		}

		scoreboardItem := models.ScoreBoard{
			GameID:       game_id,
			GenerateTime: time.Now().UTC(),
			Data:         values,
		}

		if err := dbtool.DB().Create(&scoreboardItem).Error; err != nil {
			log.Fatalf("failed to insert scoreboard item %+v", scoreboardItem)
		}
	}
}
