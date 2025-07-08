package jobs

import (
	"a1ctf/src/db/models"
	"a1ctf/src/tasks"
	dbtool "a1ctf/src/utils/db_tool"
	noticetool "a1ctf/src/utils/notice_tool"
	"a1ctf/src/utils/zaphelper"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
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
				IngameID:    judge.IngameID,
				JudgeID:     judge.JudgeID,
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

			if newSolve.Rank <= 3 {
				var solveDetail = models.Solve{}

				if err := dbtool.DB().Where("solve_id = ?", newSolve.SolveID).Preload("Challenge").Preload("Team").First(&solveDetail).Error; err != nil {
					zaphelper.Logger.Error("Announce first blood error", zap.Error(err))
				}

				var noticeCate models.NoticeCategory
				var rewardScore float64
				var rewardReason string

				if newSolve.Rank == 1 {
					noticeCate = models.NoticeFirstBlood
					rewardScore = 50
					rewardReason = "First Blood Reward"
				} else if newSolve.Rank == 2 {
					noticeCate = models.NoticeSecondBlood
					rewardScore = 30
					rewardReason = "Second Blood Reward"
				} else {
					noticeCate = models.NoticeThirdBlood
					rewardScore = 10
					rewardReason = "Third Blood Reward"
				}

				rewardReason = fmt.Sprintf("%s for %s", rewardReason, judge.Challenge.Name)

				adjustment := models.ScoreAdjustment{
					TeamID:         judge.TeamID,
					GameID:         judge.GameID,
					AdjustmentType: models.AdjustmentTypeReward,
					ScoreChange:    rewardScore,
					Reason:         rewardReason,
					CreatedBy:      uuid.MustParse(judge.SubmiterID),
					CreatedAt:      time.Now(),
					UpdatedAt:      time.Now(),
				}

				if err := dbtool.DB().Create(&adjustment).Error; err != nil {
					tasks.LogJudgeOperation(nil, nil, models.ActionJudge, judge.JudgeID, map[string]interface{}{
						"team_id":      judge.TeamID,
						"game_id":      judge.GameID,
						"score_change": adjustment.ScoreChange,
					}, err)
				}

				go func() {
					noticetool.InsertNotice(judge.GameID, noticeCate, []string{solveDetail.Team.TeamName, solveDetail.Challenge.Name})
				}()
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
	).Preload("TeamFlag").Preload("Challenge").Find(&judges).Error; err != nil {
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
