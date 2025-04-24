package jobs

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"fmt"
	"time"

	"github.com/google/uuid"
)

func processQueueingJudge(judge *models.Judge) error {
	switch judge.JudgeType {
	case models.JudgeTypeDynamic:
		if judge.JudgeContent == judge.TeamFlag.FlagContent {

			// 查询已经解出来的人
			var solves []models.Solve
			if err := dbtool.DB().Where("game_id = ? AND challenge_id = ?", judge.GameID, judge.ChallengeID).Find(&solves).Error; err != nil {
				return fmt.Errorf("database error: %w data: %+v", err, judge)
			}

			newSolve := models.Solve{
				SolveID:     uuid.NewString(),
				GameID:      judge.GameID,
				ChallengeID: judge.ChallengeID,
				TeamID:      judge.TeamID,
				SolveStatus: models.SolveCorrect,
				SolveTime:   time.Now().UTC(),
				SolverID:    judge.SubmiterID,
				Rank:        int32(len(solves) + 1),
			}

			if err := dbtool.DB().Create(&newSolve).Error; err != nil {
				judge.JudgeStatus = models.JudgeError
				return fmt.Errorf("database error: %w data: %+v", err, judge)
			}

			judge.JudgeStatus = models.JudgeAC
			return nil
		} else {
			judge.JudgeStatus = models.JudgeWA
			return nil
		}
	case models.JudgeTypeScript:
		judge.JudgeStatus = models.JudgeError
		return fmt.Errorf("dynamic judge not implemented now")
	default:
		judge.JudgeStatus = models.JudgeError
		return fmt.Errorf("unknown judge type: %s", judge.JudgeType)
	}
}

func FlagJudgeJob() {
	var judges []models.Judge
	if err := dbtool.DB().Where(
		"judge_status IN (?)",
		[]interface{}{models.JudgeQueueing, models.JudgeRunning},
	).Preload("TeamFlag").Find(&judges).Error; err != nil {
		fmt.Printf("database error: %v\n", err)
		return
	}

	for _, judge := range judges {
		if err := processQueueingJudge(&judge); err != nil {
			fmt.Printf("process judge error: %v\n", err)
			continue
		}

		if err := dbtool.DB().Save(&judge).Error; err != nil {
			fmt.Printf("database error: %v\n", err)
			continue
		}
	}
}
