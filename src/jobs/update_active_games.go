package jobs

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"log"
	"time"
)

func UpdateActivateGames() {
	var active_games []models.Game
	query := dbtool.DB().Where("start_time <= ? AND end_time >= ?", time.Now(), time.Now())

	if err := query.Find(&active_games).Error; err != nil {
		println("Failed to load active games")
		return
	}

	var game_ids []int64
	for _, game := range active_games {
		game_ids = append(game_ids, game.GameID)
	}

	log.Printf("Active games: %v", game_ids)

	if len(game_ids) > 0 {
		if err := dbtool.DB().Exec(`
			UPDATE game_challenges gc
			SET solve_count = (
				SELECT COUNT(*) 
				FROM solves s 
				WHERE s.game_id = gc.game_id AND s.challenge_id = gc.challenge_id AND s.solve_status = 1
			)
			WHERE gc.game_id IN ?;
		`, game_ids).Error; err != nil {
			println("Failed to update solve count")
			return
		}

		if err := dbtool.DB().Exec(`
			UPDATE game_challenges gc
			SET cur_score = FLOOR(
				gc.total_score * (
					((gc.total_score - gc.minimal_score) / gc.total_score) + 
					(1 - ((gc.total_score - gc.minimal_score) / gc.total_score)) * 
					EXP((1 - gc.solve_count) / gc.difficulty)
				)
			)
			WHERE gc.game_id IN ?;
		`, game_ids).Error; err != nil {
			println("Failed to update cur_score")
			return
		}
	}
}
