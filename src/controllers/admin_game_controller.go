package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
)

func AdminListGames(c *gin.Context) {
	var payload AdminListGamePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	var games []models.Game
	query := dbtool.DB().Offset(payload.Offset).Limit(payload.Size)

	if err := query.Find(&games).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load games",
		})
		return
	}

	data := make([]gin.H, 0, len(games))
	for _, game := range games {
		data = append(data, gin.H{
			"game_id":    game.GameID,
			"name":       game.Name,
			"summary":    game.Summary,
			"start_time": game.StartTime,
			"end_time":   game.EndTime,
			"visible":    game.Visible,
			"poster":     game.Poster,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": data,
	})
}

func AdminCreateGame(c *gin.Context) {
	var payload models.Game
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	game := models.Game{
		Name:                 payload.Name,
		Summary:              payload.Summary,
		StartTime:            payload.StartTime,
		EndTime:              payload.EndTime,
		Visible:              payload.Visible,
		Poster:               payload.Poster,
		WpExpireTime:         payload.WpExpireTime,
		Stages:               payload.Stages,
		RequireWp:            payload.RequireWp,
		ContainerNumberLimit: payload.ContainerNumberLimit,
		TeamNumberLimit:      payload.TeamNumberLimit,
		PracticeMode:         payload.PracticeMode,
		InviteCode:           payload.InviteCode,
		Description:          payload.Description,
	}

	if err := dbtool.DB().Create(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to create game",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"game_id": game.GameID,
		},
	})
}

func AdminGetGame(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	var game models.Game
	if err := dbtool.DB().Where("game_id = ?", gameID).First(&game).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Game not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to load game",
			})
		}
		return
	}

	var gameChallenges []models.GameChallenge

	// 使用 Preload 进行关联查询
	if err := dbtool.DB().Preload("Challenge").
		Where("game_id = ?", gameID).
		Find(&gameChallenges).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load game challenges",
		})
		return
	}

	result := gin.H{
		"game_id":                game.GameID,
		"name":                   game.Name,
		"summary":                game.Summary,
		"description":            game.Description,
		"poster":                 game.Poster,
		"invite_code":            game.InviteCode,
		"start_time":             game.StartTime,
		"end_time":               game.EndTime,
		"practice_mode":          game.PracticeMode,
		"team_number_limit":      game.TeamNumberLimit,
		"container_number_limit": game.ContainerNumberLimit,
		"require_wp":             game.RequireWp,
		"wp_expire_time":         game.WpExpireTime,
		"stages":                 game.Stages,
		"visible":                game.Visible,
		"challenges":             make([]gin.H, 0, len(gameChallenges)),
	}

	for _, gc := range gameChallenges {
		judgeConfig := gc.JudgeConfig
		if judgeConfig == nil {
			judgeConfig = gc.Challenge.JudgeConfig
		}

		result["challenges"] = append(result["challenges"].([]gin.H), gin.H{
			"challenge_id":   gc.Challenge.ChallengeID,
			"challenge_name": gc.Challenge.Name,
			"total_score":    gc.TotalScore,
			"cur_score":      gc.CurScore,
			"hints":          gc.Hints,
			"solve_count":    gc.SolveCount,
			"category":       gc.Challenge.Category,
			"judge_config":   judgeConfig,
			"belong_stage":   gc.BelongStage,
			"visible":        gc.Visible,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

func AdminUpdateGame(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	var payload AdminUpdateGamePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	var game models.Game
	if err := dbtool.DB().Where("game_id = ?", gameID).First(&game).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Game not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to load game",
			})
		}
		return
	}

	// 更新比赛信息
	game.Name = payload.Name
	game.Summary = payload.Summary
	game.Description = payload.Description
	game.InviteCode = payload.InviteCode
	game.StartTime = payload.StartTime
	game.EndTime = payload.EndTime
	game.PracticeMode = payload.PracticeMode
	game.TeamNumberLimit = payload.TeamNumberLimit
	game.ContainerNumberLimit = payload.ContainerNumberLimit
	game.RequireWp = payload.RequireWp
	game.WpExpireTime = payload.WpExpireTime
	game.Stages = payload.Stages
	game.Visible = payload.Visible

	if err := dbtool.DB().Save(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to save game",
		})
		return
	}

	for _, chal := range payload.Challenges {
		updateModel := models.GameChallenge{
			TotalScore:  chal.TotalScore,
			Hints:       chal.Hints,
			JudgeConfig: chal.JudgeConfig,
			Visible:     chal.Visible,
			BelongStage: chal.BelongStage,
		}

		if err := dbtool.DB().Model(&models.GameChallenge{}).
			Select("total_score", "hints", "judge_config", "visible", "belong_stage").
			Where("challenge_id = ? AND game_id = ?", chal.ChallengeID, gameID).Updates(updateModel).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to save challenge",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
	})

}

func AdminAddGameChallenge(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err1 := strconv.ParseInt(gameIDStr, 10, 64)
	challengeIDStr := c.Param("challenge_id")
	challengeID, err2 := strconv.ParseInt(challengeIDStr, 10, 64)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	var game models.Game
	if err := dbtool.DB().Where("game_id = ?", gameID).First(&game).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Game not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to verify game",
			})
		}
		return
	}

	var challenge models.Challenge
	if err := dbtool.DB().Where("challenge_id = ?", challengeID).First(&challenge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Challenge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to verify challenge",
			})
		}
		return
	}

	var gameChallenges []models.GameChallenge
	if err := dbtool.DB().Where("challenge_id = ? AND game_id = ?", challengeID, gameID).Find(&gameChallenges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Server error",
		})
	}

	if len(gameChallenges) > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"code":    409,
			"message": "Challenge already added to game",
		})
		return
	}

	gameChallenge := models.GameChallenge{
		GameID:      gameID,
		ChallengeID: challengeID,
		TotalScore:  500,
		CurScore:    500,
		Difficulty:  5,
		Hints:       &models.Hints{},
		JudgeConfig: challenge.JudgeConfig,
		BelongStage: nil,
		Visible:     false,
	}

	if err := dbtool.DB().Create(&gameChallenge).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to add challenge to game",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"challenge_id":   challenge.ChallengeID,
			"challenge_name": challenge.Name,
			"total_score":    gameChallenge.TotalScore,
			"cur_score":      gameChallenge.CurScore,
			"hints":          gameChallenge.Hints,
			"solve_count":    gameChallenge.SolveCount,
			"category":       challenge.Category,
			"judge_config":   gameChallenge.JudgeConfig,
			"belong_stage":   gameChallenge.BelongStage,
		},
	})
}
