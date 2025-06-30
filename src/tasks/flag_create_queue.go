package tasks

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/general"
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/bytedance/sonic"
	"github.com/hibiken/asynq"
	"gorm.io/gorm"
)

func NewTeamFlagCreateTask(flagTemplate string, teamID int64, gameID int64, challengeID int64, teamHash string, teamName string) error {
	payload, err := sonic.Marshal(CreateTeamFlagPayload{FlagTemplate: flagTemplate, TeamID: teamID, GameID: gameID, ChallengeID: challengeID, TeamHash: teamHash, TeamName: teamName})
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeNewTeamFlag, payload)
	_, err = client.Enqueue(task, asynq.TaskID(fmt.Sprintf("teamFlag:create:%d:%d:%d", teamID, gameID, challengeID)))
	return err
}

func HandleTeamCreateTask(ctx context.Context, t *asynq.Task) error {
	var p CreateTeamFlagPayload
	if err := sonic.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	// 检查是否已经存在该队伍的 flag
	var existingFlag models.TeamFlag
	result := dbtool.DB().Where("team_id = ? AND game_id = ? AND challenge_id = ?", p.TeamID, p.GameID, p.ChallengeID).First(&existingFlag)
	if result.Error == nil {
		// 已经存在，无需重复创建
		log.Printf("Flag already exists for team %d in game %d, challenge %d", p.TeamID, p.GameID, p.ChallengeID)
		return nil
	}

	const maxRetries = 100
	for retry := 0; retry < maxRetries; retry++ {
		// 生成新的 flag
		flag := general.ProcessFlag(p.FlagTemplate, map[string]string{
			"team_id":      fmt.Sprintf("%d", p.TeamID),
			"game_id":      fmt.Sprintf("%d", p.GameID),
			"challenge_id": fmt.Sprintf("%d", p.ChallengeID),
			"team_hash":    p.TeamHash,
			"team_name":    p.TeamName,
		})

		// 尝试创建 flag，如果有唯一约束冲突会自动重试
		err := dbtool.DB().Create(&models.TeamFlag{
			GameID:      p.GameID,
			ChallengeID: p.ChallengeID,
			TeamID:      p.TeamID,
			FlagContent: flag,
		}).Error

		if err == nil {
			// 创建成功
			log.Printf("Successfully created flag for team %d in game %d, challenge %d", p.TeamID, p.GameID, p.ChallengeID)
			return nil
		}

		// 检查是否是唯一约束错误 - 支持不同数据库的错误信息
		errStr := strings.ToLower(fmt.Sprintf("%v", err))
		if errors.Is(err, gorm.ErrDuplicatedKey) ||
			strings.Contains(errStr, "unique constraint failed") ||
			strings.Contains(errStr, "duplicate key value violates unique constraint") ||
			strings.Contains(errStr, "duplicate entry") ||
			strings.Contains(errStr, "unique_flag_per_game_challenge") {
			// 唯一约束冲突，稍等后重试
			log.Printf("Flag collision detected (retry %d/%d) for team %d in game %d, challenge %d", retry+1, maxRetries, p.TeamID, p.GameID, p.ChallengeID)

			// 指数退避，避免高并发冲突
			backoffDuration := time.Duration(retry*retry+1) * 10 * time.Millisecond
			time.Sleep(backoffDuration)
			continue
		}

		// 其他错误，直接返回
		return fmt.Errorf("failed to create team flag: %w", err)
	}

	return fmt.Errorf("failed to create unique flag after %d retries for team %d in game %d, challenge %d", maxRetries, p.TeamID, p.GameID, p.ChallengeID)
}
