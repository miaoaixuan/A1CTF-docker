package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/ristretto_tool"
	"a1ctf/src/webmodels"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func UserGetGameChallenges(c *gin.Context) {
	game := c.MustGet("game").(models.Game)

	simpleGameChallenges, err := ristretto_tool.CachedGameSimpleChallenges(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	var team = c.MustGet("team").(models.Team)

	// Cache all solves to redis

	solveMap, err := ristretto_tool.CachedSolvedChallengesForGame(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load solves",
		})
	}

	solves, ok := solveMap[team.TeamID]
	if !ok {
		solves = make([]models.Solve, 0)
	}

	var solved_challenges []webmodels.UserSimpleGameSolvedChallenge = make([]webmodels.UserSimpleGameSolvedChallenge, 0, len(solves))

	for _, solve := range solves {
		solved_challenges = append(solved_challenges, webmodels.UserSimpleGameSolvedChallenge{
			ChallengeID:   solve.ChallengeID,
			ChallengeName: solve.Challenge.Name,
			SolveTime:     solve.SolveTime,
			Rank:          solve.Rank,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"challenges":        simpleGameChallenges,
			"solved_challenges": solved_challenges,
		},
	})
}

func UserGetGameChallenge(c *gin.Context) {
	game := c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}
	var gameChallenges []models.GameChallenge

	// 使用 Preload 进行关联查询
	if err := dbtool.DB().Preload("Challenge").
		Where("game_id = ? and game_challenges.challenge_id = ?", game.GameID, challengeID).
		Find(&gameChallenges).Error; err != nil {

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
			Code:    404,
			Message: "Challenge not found",
		})
		return
	}

	gameChallenge := gameChallenges[0]

	// 检查是否存在 Flag 如果不存在就按照 flag 模板生成一份
	var flag models.TeamFlag
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, gameChallenge.Challenge.ChallengeID).First(&flag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 生成 Flag
			flag = models.TeamFlag{
				FlagID:      0,
				FlagContent: *gameChallenge.JudgeConfig.FlagTemplate,
				TeamID:      team.TeamID,
				GameID:      game.GameID,
				ChallengeID: *gameChallenge.Challenge.ChallengeID,
			}

			if err := dbtool.DB().Create(&flag).Error; err != nil {
				c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
					Code:    500,
					Message: "System error",
				})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error.",
			})
			return
		}
	}

	userAttachments := make([]webmodels.UserAttachmentConfig, 0, len(gameChallenge.Challenge.Attachments))

	for _, attachment := range gameChallenge.Challenge.Attachments {
		userAttachments = append(userAttachments, webmodels.UserAttachmentConfig{
			AttachName:   attachment.AttachName,
			AttachType:   attachment.AttachType,
			AttachURL:    attachment.AttachURL,
			AttachHash:   attachment.AttachHash,
			DownloadHash: attachment.DownloadHash,
		})
	}

	// Hints 处理
	visibleHints := make(models.Hints, 0, len(*gameChallenge.Hints))
	for _, hint := range *gameChallenge.Hints {
		if hint.Visible {
			visibleHints = append(visibleHints, hint)
		}
	}

	result := webmodels.UserDetailGameChallenge{
		ChallengeID:         *gameChallenge.Challenge.ChallengeID,
		ChallengeName:       gameChallenge.Challenge.Name,
		Description:         gameChallenge.Challenge.Description,
		TotalScore:          gameChallenge.TotalScore,
		CurScore:            gameChallenge.CurScore,
		Hints:               visibleHints,
		BelongStage:         gameChallenge.BelongStage,
		SolveCount:          gameChallenge.SolveCount,
		Category:            gameChallenge.Challenge.Category,
		Attachments:         userAttachments,
		ContainerType:       gameChallenge.Challenge.ContainerType,
		ContainerStatus:     models.NoContainer,
		ContainerExpireTime: nil,
	}

	// 存活靶机处理
	var containers []models.Container
	if err := dbtool.DB().Where("game_id = ? AND challenge_id = ? AND team_id = ? AND (container_status = ? OR container_status = ?)", game.GameID, gameChallenge.Challenge.ChallengeID, team.TeamID, models.ContainerRunning, models.ContainerQueueing).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) > 1 {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	result.Containers = make([]webmodels.ExposePortInfo, 0, len(*gameChallenge.Challenge.ContainerConfig))
	for _, container := range *gameChallenge.Challenge.ContainerConfig {
		tempConfig := webmodels.ExposePortInfo{
			ContainerName:  container.Name,
			ContainerPorts: make(models.ExposePorts, 0),
		}

		if len(containers) == 1 {
			for _, container_expose := range containers[0].ContainerExposeInfos {
				if container_expose.ContainerName == container.Name {
					tempConfig.ContainerPorts = container_expose.ExposePorts
					break
				}
			}
		}

		// var tempPorts models.ExposePorts = make(models.ExposePorts, 0)

		// for _, port := range container.ExposePorts {
		// 	tempPorts = append(tempPorts, models.ExposePort{
		// 		PortName: port.Name,
		// 		Port:     port.Port,
		// 		IP:       "node1.ctf.a1natas.com",
		// 	})
		// }

		// tempConfig["container_ports"] = tempPorts

		result.Containers = append(result.Containers, tempConfig)
	}

	if len(containers) > 0 {
		result.ContainerStatus = containers[0].ContainerStatus
		result.ContainerExpireTime = &containers[0].ExpireTime
	} else {
		result.ContainerStatus = models.NoContainer
		result.ContainerExpireTime = nil
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

func UserGameChallengeSubmitFlag(c *gin.Context) {
	game := c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	var payload webmodels.UserSubmitFlagPayload = webmodels.UserSubmitFlagPayload{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var gameChallenge models.GameChallenge
	if err := dbtool.DB().Preload("Challenge").Where("game_id = ? AND game_challenges.challenge_id = ?", game.GameID, challengeID).First(&gameChallenge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Challenge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to load game challenges",
			})
		}
		return
	}

	var teamFlag models.TeamFlag
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, challengeID).First(&teamFlag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Please click the challenge first.",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	var solve models.Solve
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, challengeID).First(&solve).Error; err == nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "You have already solved this challenge",
		})
		return
	}

	// 插入 Judge 队列
	newJudge := models.Judge{
		IngameID:     gameChallenge.IngameID,
		GameID:       game.GameID,
		ChallengeID:  *gameChallenge.Challenge.ChallengeID,
		TeamID:       team.TeamID,
		FlagID:       teamFlag.FlagID,
		JudgeType:    gameChallenge.JudgeConfig.JudgeType,
		JudgeStatus:  models.JudgeQueueing,
		SubmiterID:   c.MustGet("user_id").(string),
		JudgeID:      uuid.NewString(),
		JudgeTime:    time.Now().UTC(),
		JudgeContent: payload.FlagContent,
	}

	if err := dbtool.DB().Create(&newJudge).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "System error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"judge_id": newJudge.JudgeID,
		},
	})
}

func UserGameGetJudgeResult(c *gin.Context) {
	_ = c.MustGet("game").(models.Game)
	_ = c.MustGet("team").(models.Team)

	judgeIDStr := c.Param("judge_id")

	if _, err := uuid.Parse(judgeIDStr); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid judge ID",
		})
		c.Abort()
		return
	}

	team := c.MustGet("team").(models.Team)
	var judge models.Judge
	if err := dbtool.DB().Where("judge_id = ? AND team_id = ?", judgeIDStr, team.TeamID).First(&judge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Judge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to load judge",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"judge_id":     judge.JudgeID,
			"judge_status": judge.JudgeStatus,
		},
	})
}
