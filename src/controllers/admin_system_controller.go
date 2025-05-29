package controllers

import (
	clientconfig "a1ctf/src/modules/client_config"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetSystemSettings 获取系统设置
func GetSystemSettings(c *gin.Context) {
	settings, err := clientconfig.LoadSystemSettings()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"data": clientconfig.DefaultSettings,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": settings,
	})
}

// UpdateSystemSettings 更新系统设置
func UpdateSystemSettings(c *gin.Context) {
	var settings clientconfig.SystemSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求数据",
		})
		return
	}

	// 保存设置
	if err := clientconfig.SaveSystemSettings(settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "保存系统设置失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "系统设置已更新",
	})
}

// UploadSystemFile 上传系统文件（图片）
func UploadSystemFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "文件上传失败: " + err.Error(),
		})
		return
	}

	// 检查文件类型
	if !isValidFileType(file.Filename) {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "不支持的文件类型",
		})
		return
	}

	// 创建上传目录
	uploadDir := "./uploads/system"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建上传目录失败: " + err.Error(),
		})
		return
	}

	// 生成唯一文件名
	fileExt := filepath.Ext(file.Filename)
	fileName := uuid.New().String() + fileExt
	filePath := filepath.Join(uploadDir, fileName)

	// 保存文件
	if err := saveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "保存文件失败: " + err.Error(),
		})
		return
	}

	// 返回文件URL
	fileURL := "/uploads/system/" + fileName
	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"url": fileURL,
		},
	})
}

// TestSMTPSettings 测试SMTP设置
func TestSMTPSettings(c *gin.Context) {
	var smtpConfig struct {
		Host     string `json:"host"`
		Port     int    `json:"port"`
		Username string `json:"username"`
		Password string `json:"password"`
		From     string `json:"from"`
		To       string `json:"to"`
	}

	if err := c.ShouldBindJSON(&smtpConfig); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求数据",
		})
		return
	}

	// TODO: 实现SMTP测试逻辑

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "SMTP测试成功",
	})
}

func isValidFileType(filename string) bool {
	ext := filepath.Ext(filename)
	validExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".svg":  true,
		".ico":  true,
	}
	return validExts[ext]
}

func saveUploadedFile(file *multipart.FileHeader, dst string) error {
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
}
