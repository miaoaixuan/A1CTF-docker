package controllers

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
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

	var uploadRecord models.Upload
	if err := dbtool.DB().Where("file_id = ?", fileID).First(&uploadRecord).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "File not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Database query failed",
			})
		}
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

	if _, err := io.Copy(c.Writer, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Error streaming file",
		})
	}
}
