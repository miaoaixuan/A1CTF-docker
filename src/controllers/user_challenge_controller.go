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

	// 1. 使用缓存检查题目可见性
	isVisible, err := ristretto_tool.CachedGameChallengeVisibility(game.GameID, challengeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to check challenge visibility",
		})
		return
	}

	if !isVisible {
		c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
			Code:    404,
			Message: "Challenge not found or not visible",
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

	// 5. Flag 处理 - 使用缓存优化高并发查询性能，防止重复创建
	// 这里我们预创建 flag 以确保存在，但在 UserGetGameChallenge 接口中不需要返回具体内容
	_, err = ristretto_tool.CachedTeamFlag(game.GameID, team.TeamID, *gameChallenge.Challenge.ChallengeID, *gameChallenge.JudgeConfig.FlagTemplate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to get team flag",
		})
		return
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

	// 3. 使用缓存获取 teamFlag，提升性能
	teamFlag, err := ristretto_tool.CachedTeamFlag(game.GameID, team.TeamID, challengeID, *gameChallenge.JudgeConfig.FlagTemplate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to get team flag",
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
