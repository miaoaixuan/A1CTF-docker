package controllers

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/ristretto_tool"
)

func UploadFile(c *gin.Context) {
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

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "No file uploaded",
		})
		return
	}

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

	now := time.Now().UTC()
	storePath := filepath.Join("uploads", fmt.Sprintf("%d", now.Month()), fmt.Sprintf("%d", now.Day()))
	if err := os.MkdirAll(storePath, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to create upload directory",
		})
		return
	}

	newFilePath := filepath.Join(storePath, fileID.String())
	if err := c.SaveUploadedFile(file, newFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to save file",
		})
		return
	}

	fileType := file.Header.Get("Content-Type")
	if fileType == "" {
		fileType = mime.TypeByExtension(filepath.Ext(file.Filename))
		if fileType == "" {
			fileType = "application/octet-stream"
		}
	}

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

	if err := dbtool.DB().Create(&newUpload).Error; err != nil {
		_ = os.Remove(newFilePath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to save file record",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"file_id": fileID.String(),
	})
}

// Public file download
func DownloadFile(c *gin.Context) {
	fileIDStr := c.Param("file_id")
	fileID, err := uuid.Parse(fileIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid file ID",
		})
		return
	}

	filesMap, err := ristretto_tool.CachedFileMap()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load files map",
		})
	}

	uploadRecord, ok := filesMap[fileID.String()]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "File not found",
		})
		return
	}

	if _, err := os.Stat(uploadRecord.FilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "File not found on server",
		})
		return
	}

	file, err := os.Open(uploadRecord.FilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Error opening file",
		})
		return
	}
	defer file.Close()

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", uploadRecord.FileName))
	c.Header("Content-Type", uploadRecord.FileType)

	c.Header("Cache-Control", "public, max-age=36000")

	if _, err := io.Copy(c.Writer, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Error streaming file",
		})
	}
}

// UploadUserAvatar 处理用户头像上传
func UploadUserAvatar(c *gin.Context) {
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

	// 获取上传的头像文件
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "No avatar file uploaded",
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
	storePath := filepath.Join("uploads", "avatars", fmt.Sprintf("%d", now.Year()), fmt.Sprintf("%d", now.Month()))
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
			"message": "Failed to save avatar file",
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

	// 构建头像URL
	avatarURL := fmt.Sprintf("/api/file/download/%s", fileID.String())

	// 更新用户头像字段
	if err := tx.Model(&models.User{}).Where("user_id = ?", userID.String()).Update("avatar", avatarURL).Error; err != nil {
		tx.Rollback()
		_ = os.Remove(newFilePath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to update user avatar",
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

	ristretto_tool.DeleteCache("user_list")

	// 返回成功响应
	c.JSON(http.StatusOK, gin.H{
		"code":       200,
		"message":    "Avatar uploaded successfully",
		"avatar_url": avatarURL,
	})
}

// isImageMimeType 检查MIME类型是否为图片
func isImageMimeType(mimeType string) bool {
	imageMimeTypes := map[string]bool{
		"image/jpeg":    true,
		"image/png":     true,
		"image/gif":     true,
		"image/webp":    true,
		"image/bmp":     true,
		"image/tiff":    true,
		"image/svg+xml": true,
		"image/x-icon":  true,
	}

	return imageMimeTypes[mimeType]
}

// UploadTeamAvatar 处理团队头像上传
func UploadTeamAvatar(c *gin.Context) {
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

	// 获取团队ID
	teamIDStr := c.PostForm("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid team ID",
		})
		return
	}

	// 检查团队是否存在并验证用户是否是团队成员
	var teamExists bool
	var team models.Team

	// 检查团队是否存在
	if err := dbtool.DB().Raw("SELECT EXISTS(SELECT 1 FROM teams WHERE team_id = ?)", teamID).Scan(&teamExists).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Database query failed",
		})
		return
	}

	if !teamExists {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "Team not found",
		})
		return
	}

	// 检查用户是否为团队成员 - 通过team_members数组字段判断
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Database query failed",
		})
		return
	}

	// 检查用户ID是否在team_members数组中
	isMember := false
	for _, memberID := range team.TeamMembers {
		if memberID == userID.String() {
			isMember = true
			break
		}
	}

	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{
			"code":    403,
			"message": "User is not a member of this team",
		})
		return
	}

	// 获取上传的头像文件
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "No avatar file uploaded",
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
	storePath := filepath.Join("uploads", "team_avatars", fmt.Sprintf("%d", now.Year()), fmt.Sprintf("%d", now.Month()))
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
			"message": "Failed to save avatar file",
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

	// 构建头像URL
	avatarURL := fmt.Sprintf("/api/file/download/%s", fileID.String())

	// 更新团队头像字段
	if err := tx.Exec("UPDATE teams SET team_avatar = ? WHERE team_id = ?", avatarURL, teamID).Error; err != nil {
		tx.Rollback()
		_ = os.Remove(newFilePath)
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to update team avatar",
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

	ristretto_tool.DeleteCache(fmt.Sprintf("all_teams_for_game_%d", team.GameID))

	// 返回成功响应
	c.JSON(http.StatusOK, gin.H{
		"code":       200,
		"message":    "Team avatar uploaded successfully",
		"avatar_url": avatarURL,
	})
}
