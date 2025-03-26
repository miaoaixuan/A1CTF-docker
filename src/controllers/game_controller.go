package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
)

type ListGamePayload struct {
	Size   int `json:"size" binding:"min=0"`
	Offset int `json:"offset"`
}

type AddGameChallengePayload struct {
	GameID      int64 `json:"game_id" binding:"min=0"`
	ChallengeID int64 `json:"challenge_id" binding:"min=0"`
}

func ListGames(c *gin.Context) {
	var payload ListGamePayload
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

func CreateGame(c *gin.Context) {
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

func GetGame(c *gin.Context) {
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

	var gameChallenges []struct {
		models.GameChallenge
		models.Challenge
	}

	// 使用 Preload 进行关联查询
	if err := dbtool.DB().Table("game_challenges").
		Joins("LEFT JOIN challenges ON game_challenges.challenge_id = challenges.challenge_id").
		Where("game_id = ?", gameID).
		Scan(&gameChallenges).Error; err != nil {

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
		judgeConfig := gc.GameChallenge.JudgeConfig
		if judgeConfig == nil {
			judgeConfig = gc.Challenge.JudgeConfig
		}

		result["challenges"] = append(result["challenges"].([]gin.H), gin.H{
			"challenge_id":   gc.Challenge.ChallengeID,
			"challenge_name": gc.Challenge.Name,
			"total_score":    gc.GameChallenge.TotalScore,
			"cur_score":      gc.GameChallenge.CurScore,
			"hints":          gc.GameChallenge.Hints,
			"solve_count":    len(gc.Solved),
			"category":       gc.Challenge.Category,
			"judge_config":   judgeConfig,
			"belong_stage":   gc.GameChallenge.BelongStage,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

func AddGameChallenge(c *gin.Context) {
	var payload AddGameChallengePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	var game models.Game
	if err := dbtool.DB().Where("game_id = ?", payload.GameID).First(&game).Error; err != nil {
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
	if err := dbtool.DB().Where("challenge_id = ?", payload.ChallengeID).First(&challenge).Error; err != nil {
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

	gameChallenge := models.GameChallenge{
		GameID:      payload.GameID,
		ChallengeID: payload.ChallengeID,
		TotalScore:  500,
		CurScore:    500,
		Enabled:     false,
		Solved:      models.Solves{},
		Hints:       &models.StringArray{},
		JudgeConfig: challenge.JudgeConfig,
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
			"ingame_id": gameChallenge.IngameID,
		},
	})
}
