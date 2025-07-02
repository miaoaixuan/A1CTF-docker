package tasks

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/general"
	noticetool "a1ctf/src/utils/notice_tool"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/vmihailenco/msgpack/v5"
	"gorm.io/gorm"
)

func NewJudgeFlagTask(judge models.Judge) error {
	payload, err := msgpack.Marshal(judge)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeJudgeFlag, payload)
	_, err = client.Enqueue(task, asynq.Timeout(10*time.Second), asynq.TaskID(
		fmt.Sprintf("judge_flag_%s_%d_%d", judge.SubmiterID, judge.GameID, judge.ChallengeID),
	))
	return err
}

func processQueueingJudge(judge *models.Judge) error {
	switch judge.JudgeType {
	case models.JudgeTypeDynamic:
		if judge.JudgeContent == judge.TeamFlag.FlagContent {

			// 创建 solve 记录，不设置排名（设为0）
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
				Rank:        0, // 暂时设为0，等待排名计算任务处理
			}

			if err := dbtool.DB().Create(&newSolve).Error; err != nil {
				judge.JudgeStatus = models.JudgeError
				return fmt.Errorf("database error: %w data: %+v", err, judge)
			}

			// 创建排名计算任务
			if err := NewCalculateRanksTask(judge.GameID, judge.ChallengeID); err != nil {
				log.Printf("Failed to create rank calculation task: %v", err)
				// 不因为排名计算任务失败而让整个 judge 失败
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

func HandleFlagJudgeTask(ctx context.Context, t *asynq.Task) error {
	var judge models.Judge
	if err := msgpack.Unmarshal(t.Payload(), &judge); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	log.Printf("Judging for: %d", judge.TeamID)

	if err := processQueueingJudge(&judge); err != nil {
		fmt.Printf("process judge error: %v\n", err)

		LogJudgeOperation(
			&judge.SubmiterID,
			general.FindUserNameByUserID(judge.SubmiterID),
			models.ActionSubmitFlag,
			judge.JudgeID,
			map[string]interface{}{
				"game_id":      judge.GameID,
				"team_id":      judge.TeamID,
				"flag_content": judge.JudgeContent,
				"judge_type":   judge.JudgeType,
				"judge_time":   judge.JudgeTime,
			},
			fmt.Errorf("process judge error: %w", err),
		)
	}

	if err := dbtool.DB().Model(&models.Judge{}).Where("judge_id = ?", judge.JudgeID).Select("*").Updates(judge).Error; err != nil {
		LogJudgeOperation(
			&judge.SubmiterID,
			general.FindUserNameByUserID(judge.SubmiterID),
			models.ActionSubmitFlag,
			judge.JudgeID,
			map[string]interface{}{
				"game_id":      judge.GameID,
				"team_id":      judge.TeamID,
				"flag_content": judge.JudgeContent,
				"judge_type":   judge.JudgeType,
				"judge_time":   judge.JudgeTime,
			},
			fmt.Errorf("database error: %w", err),
		)
		return fmt.Errorf("database error: %w", err)
	}

	return nil
}

// RankCalculationPayload 排名计算任务的载荷
type RankCalculationPayload struct {
	GameID      int64 `json:"game_id"`
	ChallengeID int64 `json:"challenge_id"`
}

// NewCalculateRanksTask 创建排名计算任务
func NewCalculateRanksTask(gameID, challengeID int64) error {
	payload := RankCalculationPayload{
		GameID:      gameID,
		ChallengeID: challengeID,
	}

	payloadBytes, err := msgpack.Marshal(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeCalculateRanks, payloadBytes)
	_, err = client.Enqueue(task,
		asynq.Timeout(30*time.Second),
		asynq.TaskID(fmt.Sprintf("calculate_ranks_%d_%d", gameID, challengeID)),
		asynq.Queue("critical"), // 使用高优先级队列
	)
	return err
}

// HandleCalculateRanksTask 处理排名计算任务
func HandleCalculateRanksTask(ctx context.Context, t *asynq.Task) error {
	var payload RankCalculationPayload
	if err := msgpack.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("msgpack.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	log.Printf("Calculating ranks for game %d, challenge %d", payload.GameID, payload.ChallengeID)

	// 使用事务来确保排名计算的原子性
	err := dbtool.DB().Transaction(func(tx *gorm.DB) error {
		// 使用 PostgreSQL 的 ROW_NUMBER() 窗口函数重新计算所有排名
		if err := tx.Exec(`
			WITH ranked_solves AS (
				SELECT solve_id, 
					   ROW_NUMBER() OVER (ORDER BY solve_time ASC, solve_id ASC) as new_rank
				FROM solves 
				WHERE game_id = ? AND challenge_id = ?
			)
			UPDATE solves 
			SET rank = ranked_solves.new_rank
			FROM ranked_solves 
			WHERE solves.solve_id = ranked_solves.solve_id 
			  AND solves.game_id = ? 
			  AND solves.challenge_id = ?
		`, payload.GameID, payload.ChallengeID, payload.GameID, payload.ChallengeID).Error; err != nil {
			return fmt.Errorf("database error updating ranks: %w", err)
		}

		return nil
	})

	if err != nil {
		return fmt.Errorf("transaction error: %w", err)
	}

	// 排名计算完成后，检查是否需要发送前三名通知
	go func() {
		var topSolves []models.Solve
		if err := dbtool.DB().Where("game_id = ? AND challenge_id = ? AND rank <= 3", payload.GameID, payload.ChallengeID).
			Order("rank ASC").
			Preload("Challenge").
			Preload("Team").
			Find(&topSolves).Error; err != nil {
			log.Printf("Error fetching top solves for notifications: %v", err)
			return
		}

		for _, solve := range topSolves {
			var noticeCate models.NoticeCategory
			switch solve.Rank {
			case 1:
				noticeCate = models.NoticeFirstBlood
			case 2:
				noticeCate = models.NoticeSecondBlood
			case 3:
				noticeCate = models.NoticeThirdBlood
			default:
				continue
			}

			// 检查是否已经发送过通知（避免重复通知）
			var existingNotice models.Notice
			if err := dbtool.DB().Where("game_id = ? AND notice_category = ? AND data @> ?",
				payload.GameID, noticeCate,
				fmt.Sprintf(`["%s", "%s"]`, solve.Team.TeamName, solve.Challenge.Name)).
				First(&existingNotice).Error; err == nil {
				// 通知已存在，跳过
				continue
			}

			noticetool.InsertNotice(payload.GameID, noticeCate, []string{solve.Team.TeamName, solve.Challenge.Name})
		}
	}()

	log.Printf("Ranks calculated successfully for game %d, challenge %d", payload.GameID, payload.ChallengeID)
	return nil
}
