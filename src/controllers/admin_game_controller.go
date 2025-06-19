package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	noticetool "a1ctf/src/utils/notice_tool"
	"a1ctf/src/webmodels"
	"mime"

	"github.com/google/uuid"
)

func AdminListGames(c *gin.Context) {
	var payload webmodels.AdminListGamePayload
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

	sort.Slice(gameChallenges, func(i, j int) bool {
		return gameChallenges[i].Challenge.Name < gameChallenges[j].Challenge.Name
	})

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

	var payload webmodels.AdminUpdateGamePayload
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
	game.Poster = payload.Poster
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

	shouldSendNotice := false
	noticeData := []string{}

	for _, chal := range payload.Challenges {
		// 获取当前数据库中的GameChallenge
		var existingGameChallenge models.GameChallenge
		if err := dbtool.DB().Where("challenge_id = ? AND game_id = ?", chal.ChallengeID, gameID).First(&existingGameChallenge).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to load existing challenge",
			})
			return
		}

		// 检测新增的Hint
		existingHints := existingGameChallenge.Hints
		newHints := chal.Hints

		// 如果存在新增的可见Hint，发送通知
		if existingHints != nil && newHints != nil {
			existingVisibleCount := 0
			newVisibleCount := 0

			// 计算现有可见Hint数量
			for _, hint := range *existingHints {
				if hint.Visible {
					existingVisibleCount++
				}
			}

			// 计算新的可见Hint数量
			for _, hint := range *newHints {
				if hint.Visible {
					newVisibleCount++
				}
			}

			// 如果新的可见Hint数量大于现有的，说明有新增的可见Hint
			if newVisibleCount > existingVisibleCount {
				var challenge models.Challenge
				if err := dbtool.DB().Where("challenge_id = ?", chal.ChallengeID).First(&challenge).Error; err == nil {
					shouldSendNotice = true
					noticeData = append(noticeData, challenge.Name)
				}
			}
		}

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

	if shouldSendNotice {
		go func() {
			noticetool.InsertNotice(gameID, models.NoticeNewHint, noticeData)
		}()
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

// AdminCreateNotice 创建公告
func AdminCreateNotice(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	var payload struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	// 验证游戏是否存在
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

	// 使用 notice_tool 插入公告
	go func() {
		noticetool.InsertNotice(gameID, models.NoticeNewAnnounce, []string{payload.Title, payload.Content})
	}()

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "公告创建成功",
	})
}

// AdminListNotices 获取公告列表
func AdminListNotices(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	var payload struct {
		Size   int `json:"size" binding:"min=0"`
		Offset int `json:"offset"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	var notices []models.Notice
	query := dbtool.DB().Where("game_id = ? AND notice_category = ?", gameID, models.NoticeNewAnnounce).
		Order("create_time DESC").
		Offset(payload.Offset).
		Limit(payload.Size)

	if err := query.Find(&notices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load notices",
		})
		return
	}

	// 获取总数
	var total int64
	if err := dbtool.DB().Model(&models.Notice{}).
		Where("game_id = ? AND notice_category = ?", gameID, models.NoticeNewAnnounce).
		Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to count notices",
		})
		return
	}

	data := make([]gin.H, 0, len(notices))
	for _, notice := range notices {
		title := ""
		content := ""
		if len(notice.Data) >= 2 {
			title = notice.Data[0]
			content = notice.Data[1]
		}

		data = append(data, gin.H{
			"notice_id":   notice.NoticeID,
			"title":       title,
			"content":     content,
			"create_time": notice.CreateTime,
			"announced":   notice.Announced,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":  200,
		"data":  data,
		"total": total,
	})
}

// AdminDeleteNotice 删除公告
func AdminDeleteNotice(c *gin.Context) {
	var payload webmodels.AdminDeleteNoticePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	// 验证公告是否存在
	var notice models.Notice
	if err := dbtool.DB().Where("notice_id = ?", payload.NoticeID).First(&notice).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Notice not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to verify notice",
			})
		}
		return
	}

	// 删除公告
	if err := dbtool.DB().Delete(&notice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to delete notice",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "公告删除成功",
	})
}

// AdminUploadGamePoster 上传比赛海报
func AdminUploadGamePoster(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	// 验证游戏是否存在
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

	// 获取上传的海报文件
	file, err := c.FormFile("poster")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "No poster file uploaded",
		})
		return
	}

	// 检查文件类型是否为图片
	fileType := file.Header.Get("Content-Type")
	if !isImageMimeType(fileType) {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{
			"code":    415,
			"message": "Uploaded file is not an image",
		})
		return
	}

	// 生成唯一的文件ID
	var fileID uuid.UUID
	for {
		fileID = uuid.New()
		var existingUpload models.Upload
		result := dbtool.DB().Where("file_id = ?", fileID).First(&existingUpload)
		if result.Error == gorm.ErrRecordNotFound {
			break
		} else if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Database query failed",
			})
			return
		}
	}

	// 创建存储目录
	now := time.Now().UTC()
	storePath := filepath.Join("uploads", "posters", fmt.Sprintf("%d", now.Year()), fmt.Sprintf("%d", now.Month()))
	if err := os.MkdirAll(storePath, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to create upload directory",
		})
		return
	}

	// 保存文件
	newFilePath := filepath.Join(storePath, fileID.String())
	if err := c.SaveUploadedFile(file, newFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to save poster file",
		})
		return
	}

	// 设置文件类型（如果为空）
	if fileType == "" {
		fileType = mime.TypeByExtension(filepath.Ext(file.Filename))
		if fileType == "" {
			fileType = "image/jpeg" // 默认类型
		}
	}

	// 获取用户信息
	users, _ := c.Get("UserID")
	userClaims := users.(*models.JWTUser)
	userID, err := uuid.Parse(userClaims.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid user ID",
		})
		return
	}

	// 创建上传记录
	newUpload := models.Upload{
		FileID:     fileID.String(),
		UserID:     userID.String(),
		FileName:   file.Filename,
		FilePath:   newFilePath,
		FileHash:   "", // 可以添加文件哈希计算
		FileType:   fileType,
		FileSize:   file.Size,
		UploadTime: now,
	}

	// 开始数据库事务
	tx := dbtool.DB().Begin()

	// 保存上传记录
	if err := tx.Create(&newUpload).Error; err != nil {
		tx.Rollback()
		_ = os.Remove(newFilePath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to save file record",
		})
		return
	}

	// 构建海报URL
	posterURL := fmt.Sprintf("/api/file/download/%s", fileID.String())

	// 更新游戏海报字段
	if err := tx.Model(&models.Game{}).Where("game_id = ?", gameID).Update("poster", posterURL).Error; err != nil {
		tx.Rollback()
		_ = os.Remove(newFilePath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to update game poster",
		})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		_ = os.Remove(newFilePath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to commit transaction",
		})
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, gin.H{
		"code":       200,
		"message":    "Game poster uploaded successfully",
		"poster_url": posterURL,
	})
}
