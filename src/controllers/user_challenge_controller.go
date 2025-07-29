package controllers

import (
	"a1ctf/src/db/models"
	"a1ctf/src/tasks"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/ristretto_tool"
	"a1ctf/src/webmodels"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UserGetGameChallenges(c *gin.Context) {
	user := c.MustGet("user").(models.User)

	// 管理员前台需要返回所有题目
	if user.Role == models.UserRoleAdmin {
		AdminGetSimpleGameChallenges(c)
		return
	}

	game := c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	simpleGameChallenges, err := ristretto_tool.CachedGameSimpleChallenges(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	// Cache all solves to redis

	solveMap, err := ristretto_tool.CachedSolvedChallengesForGame(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load solves",
		})
		return
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
	user := c.MustGet("user").(models.User)

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

	// 1. 使用缓存检查题目可见性
	isVisible, err := ristretto_tool.CachedGameChallengeVisibility(game.GameID, challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to check challenge visibility",
		})
		return
	}

	// 管理员可以查看到所有题目
	if !isVisible && user.Role == models.UserRoleUser {
		c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
			Code:    404,
			Message: "Challenge not found",
		})
		return
	}

	// 2. 使用缓存获取题目详细信息
	gameChallenge, err := ristretto_tool.CachedGameChallengeDetail(game.GameID, challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load challenge details",
		})
		return
	}

	// 5. Flag 处理，对于没有 flag 的队伍，需要添加到 flag 创建队列里，先判断是否是动态 Flag
	if gameChallenge.Challenge.FlagType == models.FlagTypeDynamic {
		allFlags, err := ristretto_tool.CachedAllTeamFlags(game.GameID, challengeID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
			return
		}

		if _, exists := allFlags[team.TeamID]; !exists {
			// 缓存不存在，添加到任务队列
			_ = tasks.NewTeamFlagCreateTask(*gameChallenge.JudgeConfig.FlagTemplate, team.TeamID, game.GameID, challengeID, team.TeamHash, team.TeamName, gameChallenge.Challenge.FlagType)
		}
	}

	// 3. 使用缓存获取附件信息
	userAttachments, err := ristretto_tool.CachedChallengeAttachments(*gameChallenge.Challenge.ChallengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load challenge attachments",
		})
		return
	}

	// 4. 使用缓存获取可见提示
	visibleHints, err := ristretto_tool.CachedChallengeVisibleHints(game.GameID, challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load challenge hints",
		})
		return
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
		Visible:             gameChallenge.Visible,
	}

	// 6. 容器状态处理 - 使用短时缓存（200ms）平衡性能和实时性
	containers, err := ristretto_tool.CachedContainerStatus(game.GameID, *gameChallenge.Challenge.ChallengeID, team.TeamID)
	if err != nil {
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
	user := c.MustGet("user").(models.User)

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

	// 1. 使用缓存获取题目详细信息
	gameChallenge, err := ristretto_tool.CachedGameChallengeDetail(game.GameID, challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load challenge details",
		})
		return
	}

	// 2. 使用缓存检查是否已解决
	hasSolved, err := ristretto_tool.CachedTeamSolveStatus(game.GameID, team.TeamID, challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to check solve status",
		})
		return
	}

	if hasSolved {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "You have already solved this challenge",
		})
		return
	}

	clientIP := c.ClientIP()

	// 插入 Judge 队列
	newJudge := models.Judge{
		IngameID:     gameChallenge.IngameID,
		GameID:       game.GameID,
		ChallengeID:  *gameChallenge.Challenge.ChallengeID,
		TeamID:       team.TeamID,
		JudgeType:    gameChallenge.JudgeConfig.JudgeType,
		JudgeStatus:  models.JudgeQueueing,
		SubmiterID:   c.MustGet("user_id").(string),
		JudgeID:      uuid.NewString(),
		JudgeTime:    time.Now().UTC(),
		JudgeContent: payload.FlagContent,
		SubmiterIP:   &clientIP,
	}

	// 判断是否是动态 Flag，如果是就从 teamFlag 的 map 缓存中拿 flag
	if gameChallenge.Challenge.FlagType == models.FlagTypeDynamic {
		teamFlagMap, err := ristretto_tool.CachedAllTeamFlags(game.GameID, challengeID)
		teamFlag, exsist := teamFlagMap[team.TeamID]
		if !exsist || err != nil {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to get team flag",
			})
			return
		}
		newJudge.FlagID = &teamFlag.FlagID
	} else {
		newJudge.FlagID = nil
	}

	if err := dbtool.DB().Create(&newJudge).Error; err != nil {
		// 记录失败日志
		tasks.LogUserOperationWithError(c, models.ActionSubmitFlag, models.ResourceTypeChallenge, &challengeIDStr, map[string]interface{}{
			"game_id":        game.GameID,
			"team_id":        team.TeamID,
			"user_id":        user.UserID,
			"challenge_name": gameChallenge.Challenge.Name,
			"flag_content":   payload.FlagContent,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "System error",
		})
		return
	}

	// 启动一个检查作弊任务

	tasks.NewFlagAntiCheatTask(newJudge)

	tasks.LogUserOperation(c, models.ActionSubmitFlag, models.ResourceTypeChallenge, &challengeIDStr, map[string]interface{}{
		"game_id":        game.GameID,
		"team_id":        team.TeamID,
		"user_id":        user.UserID,
		"challenge_name": gameChallenge.Challenge.Name,
		"judge_id":       newJudge.JudgeID,
		"flag_content":   payload.FlagContent, // 只记录前50个字符
	})

	// dbtool.DB().Model(&models.Judge{}).Preload("TeamFlag").Where("judge_id = ?", newJudge.JudgeID).First(&newJudge)

	// err = tasks.NewJudgeFlagTask(newJudge)
	// if err != nil {
	// 	c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
	// 		Code:    400,
	// 		Message: "You have a judge in queue, please wait for a moment",
	// 	})
	// 	return
	// }

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"judge_id": newJudge.JudgeID,
		},
	})
}

func UserGameGetJudgeResult(c *gin.Context) {
	_ = c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	judgeIDStr := c.Param("judge_id")

	if _, err := uuid.Parse(judgeIDStr); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid judge ID",
		})
		c.Abort()
		return
	}

	// 使用缓存获取判题结果，减少高频查询的数据库压力
	judge, err := ristretto_tool.CachedJudgeResult(judgeIDStr, team.TeamID)
	if err != nil {
		if err.Error() == "judge not found" {
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
