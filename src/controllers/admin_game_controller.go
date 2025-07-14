package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	noticetool "a1ctf/src/utils/notice_tool"
	"a1ctf/src/webmodels"
	"mime"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// helper: convert slice of strings to LIKE patterns for ILIKE ANY
func mapSliceToLike(src []string) []string {
	var dst []string
	for _, s := range src {
		dst = append(dst, "%"+strings.ToLower(s)+"%")
	}
	return dst
}

// helper: extract keys from map[int64]struct{}
func keysInt64(m map[int64]struct{}) []int64 {
	res := make([]int64, 0, len(m))
	for k := range m {
		res = append(res, k)
	}
	return res
}

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

	// 避免因为更改先后造成顺序变动
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

		if game.StartTime.Before(time.Now().UTC()) {
			existingGameChallenge.CurScore = existingGameChallenge.TotalScore
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
			CurScore:    existingGameChallenge.CurScore,
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
	storePath := filepath.Join("data", "uploads", "posters", fmt.Sprintf("%d", now.Year()), fmt.Sprintf("%d", now.Month()))
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

// AdminGetGameScoreAdjustments 获取比赛分数修正记录
func AdminGetGameScoreAdjustments(c *gin.Context) {
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

	// 获取分数修正记录
	var adjustments []models.ScoreAdjustment
	if err := dbtool.DB().Preload("Team").Preload("CreatedByUser").
		Where("game_id = ?", gameID).
		Order("created_at DESC").
		Find(&adjustments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load score adjustments",
		})
		return
	}

	// 构建响应数据
	data := make([]gin.H, 0, len(adjustments))
	for _, adj := range adjustments {
		teamName := ""
		if adj.Team != nil {
			teamName = adj.Team.TeamName
		}

		createdByUsername := ""
		if adj.CreatedByUser != nil {
			createdByUsername = adj.CreatedByUser.Username
		}

		data = append(data, gin.H{
			"adjustment_id":       adj.AdjustmentID,
			"team_id":             adj.TeamID,
			"team_name":           teamName,
			"adjustment_type":     adj.AdjustmentType,
			"score_change":        adj.ScoreChange,
			"reason":              adj.Reason,
			"created_by":          adj.CreatedBy,
			"created_by_username": createdByUsername,
			"created_at":          adj.CreatedAt,
			"updated_at":          adj.UpdatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": data,
	})
}

// AdminCreateScoreAdjustment 创建分数修正记录
func AdminCreateScoreAdjustment(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	var payload webmodels.CreateScoreAdjustmentPayload
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

	// 验证队伍是否存在且属于该比赛
	var team models.Team
	if err := dbtool.DB().Where("team_id = ? AND game_id = ?", payload.TeamID, gameID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Team not found in this game",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to verify team",
			})
		}
		return
	}

	// 获取当前用户信息
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

	// 创建分数修正记录
	adjustment := models.ScoreAdjustment{
		TeamID:         payload.TeamID,
		GameID:         gameID,
		AdjustmentType: models.AdjustmentType(payload.AdjustmentType),
		ScoreChange:    payload.ScoreChange,
		Reason:         payload.Reason,
		CreatedBy:      userID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := dbtool.DB().Create(&adjustment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to create score adjustment",
		})
		return
	}

	// 更新队伍分数
	scoreChange := adjustment.ScoreChange
	if err := dbtool.DB().Model(&models.Team{}).
		Where("team_id = ?", payload.TeamID).
		Update("team_score", gorm.Expr("team_score + ?", scoreChange)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to update team score",
		})
		return
	}

	// 获取创建的记录详情
	if err := dbtool.DB().Preload("Team").Preload("CreatedByUser").
		Where("adjustment_id = ?", adjustment.AdjustmentID).
		First(&adjustment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load created adjustment",
		})
		return
	}

	// 构建响应数据
	teamName := ""
	if adjustment.Team != nil {
		teamName = adjustment.Team.TeamName
	}

	createdByUsername := ""
	if adjustment.CreatedByUser != nil {
		createdByUsername = adjustment.CreatedByUser.Username
	}

	data := gin.H{
		"adjustment_id":       adjustment.AdjustmentID,
		"team_id":             adjustment.TeamID,
		"team_name":           teamName,
		"adjustment_type":     adjustment.AdjustmentType,
		"score_change":        adjustment.ScoreChange,
		"reason":              adjustment.Reason,
		"created_by":          adjustment.CreatedBy,
		"created_by_username": createdByUsername,
		"created_at":          adjustment.CreatedAt,
		"updated_at":          adjustment.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": data,
	})
}

// AdminUpdateScoreAdjustment 更新分数修正记录
func AdminUpdateScoreAdjustment(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	adjustmentIDStr := c.Param("adjustment_id")
	adjustmentID, err := strconv.ParseInt(adjustmentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid adjustment ID",
		})
		return
	}

	var payload webmodels.UpdateScoreAdjustmentPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	// 获取原始记录
	var originalAdjustment models.ScoreAdjustment
	if err := dbtool.DB().Where("adjustment_id = ? AND game_id = ?", adjustmentID, gameID).
		First(&originalAdjustment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Score adjustment not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to load score adjustment",
			})
		}
		return
	}

	// 计算分数差异
	scoreDifference := payload.ScoreChange - originalAdjustment.ScoreChange

	// 开始事务
	tx := dbtool.DB().Begin()

	// 更新分数修正记录
	if err := tx.Model(&originalAdjustment).Updates(models.ScoreAdjustment{
		AdjustmentType: models.AdjustmentType(payload.AdjustmentType),
		ScoreChange:    payload.ScoreChange,
		Reason:         payload.Reason,
		UpdatedAt:      time.Now(),
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to update score adjustment",
		})
		return
	}

	// 更新队伍分数
	if scoreDifference != 0 {
		if err := tx.Model(&models.Team{}).
			Where("team_id = ?", originalAdjustment.TeamID).
			Update("team_score", gorm.Expr("team_score + ?", scoreDifference)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to update team score",
			})
			return
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to commit transaction",
		})
		return
	}

	// 获取更新后的记录详情
	var updatedAdjustment models.ScoreAdjustment
	if err := dbtool.DB().Preload("Team").Preload("CreatedByUser").
		Where("adjustment_id = ?", adjustmentID).
		First(&updatedAdjustment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load updated adjustment",
		})
		return
	}

	// 构建响应数据
	teamName := ""
	if updatedAdjustment.Team != nil {
		teamName = updatedAdjustment.Team.TeamName
	}

	createdByUsername := ""
	if updatedAdjustment.CreatedByUser != nil {
		createdByUsername = updatedAdjustment.CreatedByUser.Username
	}

	data := gin.H{
		"adjustment_id":       updatedAdjustment.AdjustmentID,
		"team_id":             updatedAdjustment.TeamID,
		"team_name":           teamName,
		"adjustment_type":     updatedAdjustment.AdjustmentType,
		"score_change":        updatedAdjustment.ScoreChange,
		"reason":              updatedAdjustment.Reason,
		"created_by":          updatedAdjustment.CreatedBy,
		"created_by_username": createdByUsername,
		"created_at":          updatedAdjustment.CreatedAt,
		"updated_at":          updatedAdjustment.UpdatedAt,
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": data,
	})
}

// AdminDeleteScoreAdjustment 删除分数修正记录
func AdminDeleteScoreAdjustment(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	adjustmentIDStr := c.Param("adjustment_id")
	adjustmentID, err := strconv.ParseInt(adjustmentIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid adjustment ID",
		})
		return
	}

	// 获取要删除的记录
	var adjustment models.ScoreAdjustment
	if err := dbtool.DB().Where("adjustment_id = ? AND game_id = ?", adjustmentID, gameID).
		First(&adjustment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Score adjustment not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to load score adjustment",
			})
		}
		return
	}

	// 开始事务
	tx := dbtool.DB().Begin()

	// 删除分数修正记录
	if err := tx.Delete(&adjustment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to delete score adjustment",
		})
		return
	}

	// 从队伍分数中减去该修正值
	if err := tx.Model(&models.Team{}).
		Where("team_id = ?", adjustment.TeamID).
		Update("team_score", gorm.Expr("team_score - ?", adjustment.ScoreChange)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to update team score",
		})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to commit transaction",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Score adjustment deleted successfully",
	})
}

// AdminDeleteChallengeSolves 删除题目解题记录（支持删除所有或特定队伍）
func AdminDeleteChallengeSolves(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid challenge ID",
		})
		return
	}

	var payload struct {
		TeamID *int64 `json:"team_id"` // 可选，如果不提供则删除所有
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	// 验证比赛和题目是否存在
	var gameChallenge models.GameChallenge
	if err := dbtool.DB().Where("game_id = ? AND challenge_id = ?", gameID, challengeID).
		First(&gameChallenge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Game challenge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to load game challenge",
			})
		}
		return
	}

	// 如果指定了队伍ID，验证队伍是否存在
	var team *models.Team
	if payload.TeamID != nil {
		team = &models.Team{}
		if err := dbtool.DB().Where("team_id = ?", *payload.TeamID).First(team).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{
					"code":    404,
					"message": "Team not found",
				})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{
					"code":    500,
					"message": "Failed to load team",
				})
			}
			return
		}
	}

	// 开始事务
	tx := dbtool.DB().Begin()

	// 构建查询条件
	query := tx.Where("game_id = ? AND challenge_id = ?", gameID, challengeID)
	if payload.TeamID != nil {
		query = query.Where("team_id = ?", *payload.TeamID)
	}

	// 获取要删除的解题记录
	var solves []models.Solve
	if err := query.Find(&solves).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load solves",
		})
		return
	}

	if len(solves) == 0 {
		tx.Rollback()
		message := "No solve records found"
		if payload.TeamID != nil {
			message = "No solve records found for this team and challenge"
		}
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": message,
		})
		return
	}

	// 删除解题记录
	if err := query.Delete(&models.Solve{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to delete solves",
		})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to commit transaction",
		})
		return
	}

	// 构建响应消息
	var message string
	var data gin.H
	if payload.TeamID != nil {
		message = fmt.Sprintf("Deleted %d solve records for team %s", len(solves), team.TeamName)
		data = gin.H{
			"deleted_count": len(solves),
			"team_name":     team.TeamName,
		}
	} else {
		message = fmt.Sprintf("Cleared %d solve records", len(solves))
		data = gin.H{
			"deleted_count": len(solves),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": message,
		"data":    data,
	})
}

// AdminGetSubmits 获取指定比赛的提交记录（包含正确与错误）
func AdminGetSubmits(c *gin.Context) {
	// 解析并校验 game_id
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid game ID",
		})
		return
	}

	// 确认比赛存在
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

	// 解析分页及过滤参数
	var payload struct {
		Size           int      `json:"size" binding:"min=0"`
		Offset         int      `json:"offset"`
		ChallengeIDs   []int64  `json:"challenge_ids"`   // 多个题目ID
		ChallengeNames []string `json:"challenge_names"` // 多个题目名称(模糊匹配，OR 关系)
		TeamIDs        []int64  `json:"team_ids"`        // 多个队伍ID
		TeamNames      []string `json:"team_names"`      // 多个队伍名称
		JudgeStatuses  []string `json:"judge_statuses"`  // 多个评测结果
		StartTime      *string  `json:"start_time"`      // 起始时间 (ISO8601)
		EndTime        *string  `json:"end_time"`        // 结束时间 (ISO8601)
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	// 构建基础查询
	baseQuery := dbtool.DB().Model(&models.Judge{}).Where("game_id = ?", gameID)

	// 题目过滤
	challengeIDSet := make(map[int64]struct{})
	if len(payload.ChallengeIDs) > 0 {
		for _, id := range payload.ChallengeIDs {
			challengeIDSet[id] = struct{}{}
		}
	}
	if len(payload.ChallengeNames) > 0 {
		var ids []int64
		if err := dbtool.DB().Model(&models.Challenge{}).
			Where("lower(name) ILIKE ANY(?)", pq.Array(mapSliceToLike(payload.ChallengeNames))).
			Pluck("challenge_id", &ids).Error; err == nil {
			for _, id := range ids {
				challengeIDSet[id] = struct{}{}
			}
		}

		if len(ids) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"code":  200,
				"data":  make([]gin.H, 0),
				"total": 0,
			})
			return
		}
	}
	if len(challengeIDSet) > 0 {
		idList := keysInt64(challengeIDSet)
		baseQuery = baseQuery.Where("challenge_id IN ?", idList)
	}

	// 队伍过滤
	teamIDSet := make(map[int64]struct{})
	for _, id := range payload.TeamIDs {
		teamIDSet[id] = struct{}{}
	}
	if len(payload.TeamNames) > 0 {
		var ids []int64
		if err := dbtool.DB().Model(&models.Team{}).
			Where("lower(team_name) ILIKE ANY(?)", pq.Array(mapSliceToLike(payload.TeamNames))).
			Pluck("team_id", &ids).Error; err == nil {
			for _, id := range ids {
				teamIDSet[id] = struct{}{}
			}
		}
	}
	if len(teamIDSet) > 0 {
		baseQuery = baseQuery.Where("team_id IN ?", keysInt64(teamIDSet))
	}

	// 评测结果过滤
	if len(payload.JudgeStatuses) > 0 {
		coveredStatus := make([]models.JudgeStatus, 0)
		for _, status := range payload.JudgeStatuses {
			switch status {
			case "JudgeAC":
				coveredStatus = append(coveredStatus, models.JudgeAC)
			case "JudgeWA":
				coveredStatus = append(coveredStatus, models.JudgeWA)
			}
		}
		baseQuery = baseQuery.Where("judge_status IN ?", coveredStatus)
	}

	// 时间范围过滤
	if payload.StartTime != nil && strings.TrimSpace(*payload.StartTime) != "" {
		if t, err := time.Parse(time.RFC3339, *payload.StartTime); err == nil {
			baseQuery = baseQuery.Where("judge_time >= ?", t)
		}
	}
	if payload.EndTime != nil && strings.TrimSpace(*payload.EndTime) != "" {
		if t, err := time.Parse(time.RFC3339, *payload.EndTime); err == nil {
			baseQuery = baseQuery.Where("judge_time <= ?", t)
		}
	}

	// 查询总数
	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to count submits",
		})
		return
	}

	// 查询具体记录
	var judges []models.Judge
	query := baseQuery.Preload("Team").Preload("Challenge").Order("judge_time DESC").Offset(payload.Offset)
	if payload.Size > 0 {
		query = query.Limit(payload.Size)
	}
	if err := query.Find(&judges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load submits",
		})
		return
	}

	// 批量获取提交者用户名
	submitterIDs := make([]string, 0, len(judges))
	unique := make(map[string]struct{})
	for _, j := range judges {
		if _, ok := unique[j.SubmiterID]; !ok {
			unique[j.SubmiterID] = struct{}{}
			submitterIDs = append(submitterIDs, j.SubmiterID)
		}
	}

	userMap := make(map[string]string) // user_id -> username
	if len(submitterIDs) > 0 {
		var users []models.User
		if err := dbtool.DB().Select("user_id", "username").Where("user_id IN ?", submitterIDs).Find(&users).Error; err == nil {
			for _, u := range users {
				userMap[u.UserID] = u.Username
			}
		}
	}

	// 构造响应数据
	data := make([]gin.H, 0, len(judges))
	for _, j := range judges {
		username := userMap[j.SubmiterID]
		teamName := ""
		if j.Team.TeamName != "" {
			teamName = j.Team.TeamName
		}
		challengeName := ""
		if j.Challenge.Name != "" {
			challengeName = j.Challenge.Name
		}

		data = append(data, gin.H{
			"judge_id":       j.JudgeID,
			"username":       username,
			"team_name":      teamName,
			"team_id":        j.TeamID,
			"challenge_id":   j.ChallengeID,
			"flag_content":   j.JudgeContent,
			"challenge_name": challengeName,
			"judge_status":   j.JudgeStatus,
			"judge_time":     j.JudgeTime,
		})
	}

	// 返回
	c.JSON(http.StatusOK, gin.H{
		"code":  200,
		"data":  data,
		"total": total,
	})
}
