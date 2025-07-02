package controllers

import (
	"a1ctf/src/db/models"
	"a1ctf/src/tasks"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/webmodels"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func UserCreateGameContainer(c *gin.Context) {
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

	var gameChallenges []models.GameChallenge

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

	var containers []models.Container
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND (container_status = ? or container_status = ?)", game.GameID, team.TeamID, models.ContainerRunning, models.ContainerQueueing).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	for _, container := range containers {
		if container.ChallengeID == *gameChallenge.Challenge.ChallengeID && container.ContainerStatus == models.ContainerRunning {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: "You have created a container for this challenge",
			})
			return
		}

		if container.ChallengeID == *gameChallenge.Challenge.ChallengeID && container.ContainerStatus == models.ContainerQueueing {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: "Your container is queueing",
			})
			return
		}
	}

	if len(containers) > int(game.ContainerNumberLimit) {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "You have created too many containers",
		})
		return
	}

	var flag models.TeamFlag
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, gameChallenge.Challenge.ChallengeID).First(&flag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
				Code:    403,
				Message: "Flag haven't been created yet, please wait.",
			})
			return
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error.",
			})
			return
		}
	}

	// 加入数据库
	newContainer := models.Container{
		ContainerID:          uuid.NewString(),
		GameID:               game.GameID,
		FlagID:               flag.FlagID,
		TeamID:               team.TeamID,
		ChallengeID:          *gameChallenge.Challenge.ChallengeID,
		InGameID:             gameChallenge.IngameID,
		StartTime:            time.Now().UTC(),
		ExpireTime:           time.Now().Add(time.Duration(2) * time.Hour).UTC(),
		ContainerExposeInfos: make(models.ContainerExposeInfos, 0),
		ContainerStatus:      models.ContainerQueueing,
		ContainerConfig:      *gameChallenge.Challenge.ContainerConfig,
		ChallengeName:        gameChallenge.Challenge.Name,
		TeamHash:             team.TeamHash,
	}

	if err := dbtool.DB().Create(&newContainer).Error; err != nil {
		// 记录创建容器失败日志
		tasks.LogUserOperationWithError(c, models.ActionStartContainer, models.ResourceTypeContainer, &newContainer.ContainerID, map[string]interface{}{
			"game_id":        game.GameID,
			"user_id":        user.UserID,
			"team_id":        team.TeamID,
			"challenge_id":   challengeID,
			"challenge_name": gameChallenge.Challenge.Name,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    501,
			Message: "System error",
		})
		return
	}

	// 记录创建容器请求
	tasks.LogUserOperation(c, models.ActionStartContainer, models.ResourceTypeContainer, &newContainer.ContainerID, map[string]interface{}{
		"game_id":        game.GameID,
		"user_id":        user.UserID,
		"team_id":        team.TeamID,
		"challenge_id":   challengeID,
		"challenge_name": gameChallenge.Challenge.Name,
		"expire_time":    newContainer.ExpireTime,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "OK",
	})
}

func UserCloseGameContainer(c *gin.Context) {
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

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND container_status = ?", challengeID, team.TeamID, models.ContainerRunning).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "System error.",
		})
		return
	}

	curContainer := containers[0]

	if err := dbtool.DB().Model(&curContainer).Updates(map[string]interface{}{
		"container_status": models.ContainerStopping,
	}).Error; err != nil {
		// 记录停止容器失败日志
		tasks.LogUserOperationWithError(c, models.ActionStopContainer, models.ResourceTypeContainer, &curContainer.ContainerID, map[string]interface{}{
			"game_id":        game.GameID,
			"user_id":        user.UserID,
			"team_id":        team.TeamID,
			"challenge_id":   challengeID,
			"challenge_name": curContainer.ChallengeName,
			"container_id":   curContainer.ContainerID,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    501,
			Message: "System error",
		})
		return
	}

	// 记录停止容器成功日志
	tasks.LogUserOperation(c, models.ActionStopContainer, models.ResourceTypeContainer, &curContainer.ContainerID, map[string]interface{}{
		"game_id":        game.GameID,
		"user_id":        user.UserID,
		"team_id":        team.TeamID,
		"challenge_id":   challengeID,
		"challenge_name": curContainer.ChallengeName,
		"container_id":   curContainer.ContainerID,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "OK",
	})
}

func UserExtendGameContainer(c *gin.Context) {
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

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND container_status = ?", challengeID, team.TeamID, models.ContainerRunning).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "System error.",
		})
		return
	}

	curContainer := containers[0]

	// 延长时间为当前时间的2小时之后
	newExpireTime := time.Now().Add(time.Duration(2) * time.Hour).UTC()

	if err := dbtool.DB().Model(&curContainer).Updates(map[string]interface{}{
		"expire_time": newExpireTime,
	}).Error; err != nil {
		tasks.LogUserOperationWithError(c, models.ActionExtendContainer, models.ResourceTypeContainer, &curContainer.ContainerID, map[string]interface{}{
			"game_id":         game.GameID,
			"team_id":         team.TeamID,
			"user_id":         user.UserID,
			"challenge_id":    challengeID,
			"challenge_name":  curContainer.ChallengeName,
			"container_id":    curContainer.ContainerID,
			"old_expire_time": curContainer.ExpireTime,
			"new_expire_time": newExpireTime,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    501,
			Message: "System error",
		})
		return
	}

	tasks.LogUserOperation(c, models.ActionExtendContainer, models.ResourceTypeContainer, &curContainer.ContainerID, map[string]interface{}{
		"game_id":         game.GameID,
		"team_id":         team.TeamID,
		"user_id":         user.UserID,
		"challenge_id":    challengeID,
		"challenge_name":  curContainer.ChallengeName,
		"container_id":    curContainer.ContainerID,
		"old_expire_time": curContainer.ExpireTime,
		"new_expire_time": newExpireTime,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "OK",
	})
}

func UserGetGameChallengeContainerInfo(c *gin.Context) {
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

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND (container_status = ? OR container_status = ? OR container_status = ?)", challengeID, team.TeamID, models.ContainerRunning, models.ContainerQueueing, models.ContainerStarting).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "System error.",
		})
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

	result := gin.H{
		"container_status":     containers[0].ContainerStatus,
		"containers":           make([]gin.H, 0, len(*gameChallenge.Challenge.ContainerConfig)),
		"container_expiretime": containers[0].ExpireTime,
	}

	for _, container := range *gameChallenge.Challenge.ContainerConfig {
		tempConfig := gin.H{
			"container_name":  container.Name,
			"container_ports": make(models.ExposePorts, 0),
		}

		if len(containers) == 1 {
			for _, container_expose := range containers[0].ContainerExposeInfos {
				if container_expose.ContainerName == container.Name {
					tempConfig["container_ports"] = container_expose.ExposePorts
					break
				}
			}
		}

		result["containers"] = append(result["containers"].([]gin.H), tempConfig)
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}
