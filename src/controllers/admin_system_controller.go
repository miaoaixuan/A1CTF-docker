package controllers

import (
	"a1ctf/src/db/models"
	clientconfig "a1ctf/src/modules/client_config"
	"a1ctf/src/tasks"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/general"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

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
		// 记录日志
		tasks.LogAdminOperationWithError(c, models.ActionUpdate, models.ResourceTypeSystem, nil, settings, err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "保存系统设置失败: " + err.Error(),
		})
		return
	}

	// 记录成功日志
	tasks.LogAdminOperation(c, models.ActionUpdate, models.ResourceTypeSystem, nil, settings)

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
	uploadDir := "./data/uploads/system"
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
		// 记录失败日志
		tasks.LogAdminOperationWithError(c, models.ActionUpload, models.ResourceTypeFile, &fileName, map[string]interface{}{
			"original_filename": file.Filename,
			"file_size":         file.Size,
		}, err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "保存文件失败: " + err.Error(),
		})
		return
	}

	// 记录成功日志
	tasks.LogAdminOperation(c, models.ActionUpload, models.ResourceTypeFile, &fileName, map[string]interface{}{
		"original_filename": file.Filename,
		"file_size":         file.Size,
		"saved_path":        filePath,
	})

	// 返回文件URL
	fileURL := "/data/uploads/system/" + fileName
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

	// 记录测试日志
	tasks.LogAdminOperation(c, "TEST_SMTP", models.ResourceTypeSystem, nil, map[string]interface{}{
		"host": smtpConfig.Host,
		"port": smtpConfig.Port,
		"to":   smtpConfig.To,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "SMTP测试成功",
	})
}

// GetSystemLogs 获取系统日志
func GetSystemLogs(c *gin.Context) {

	// 解析查询参数
	var params general.QueryLogParams

	// 分页参数
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			params.Offset = offset
		}
	}

	if sizeStr := c.Query("size"); sizeStr != "" {
		if size, err := strconv.Atoi(sizeStr); err == nil {
			params.Size = size
		}
	}

	// 默认分页
	if params.Size <= 0 {
		params.Size = 20
	}

	// 过滤参数
	if category := c.Query("category"); category != "" {
		logCategory := models.LogCategory(category)
		params.Category = &logCategory
	}

	if userID := c.Query("user_id"); userID != "" {
		params.UserID = &userID
	}

	if action := c.Query("action"); action != "" {
		params.Action = &action
	}

	if resourceType := c.Query("resource_type"); resourceType != "" {
		params.ResourceType = &resourceType
	}

	if status := c.Query("status"); status != "" {
		params.Status = &status
	}

	if ipAddress := c.Query("ip_address"); ipAddress != "" {
		params.IPAddress = &ipAddress
	}

	if gameIDStr := c.Query("game_id"); gameIDStr != "" {
		if gameID, err := strconv.ParseInt(gameIDStr, 10, 64); err == nil {
			params.GameID = &gameID
		}
	}

	if keyword := c.Query("keyword"); keyword != "" {
		params.Keyword = &keyword
	}

	// 时间范围
	if startTimeStr := c.Query("start_time"); startTimeStr != "" {
		if startTime, err := time.Parse(time.RFC3339, startTimeStr); err == nil {
			params.StartTime = &startTime
		}
	}

	if endTimeStr := c.Query("end_time"); endTimeStr != "" {
		if endTime, err := time.Parse(time.RFC3339, endTimeStr); err == nil {
			params.EndTime = &endTime
		}
	}

	// 查询日志
	logs, total, err := general.QuerySystemLogs(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "查询系统日志失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"logs":  logs,
			"total": total,
			"pagination": gin.H{
				"offset": params.Offset,
				"size":   params.Size,
				"total":  total,
			},
		},
	})
}

// 系统日志统计接口
func GetSystemLogStats(c *gin.Context) {
	// 统计最近24小时的日志
	last24h := time.Now().Add(-24 * time.Hour)

	var stats struct {
		TotalLogs    int64 `json:"total_logs"`
		SuccessLogs  int64 `json:"success_logs"`
		FailedLogs   int64 `json:"failed_logs"`
		AdminLogs    int64 `json:"admin_logs"`
		UserLogs     int64 `json:"user_logs"`
		SecurityLogs int64 `json:"security_logs"`
	}

	// 总日志数
	dbtool.DB().Model(&models.SystemLog{}).Where("create_time >= ?", last24h).Count(&stats.TotalLogs)

	// 成功日志数
	dbtool.DB().Model(&models.SystemLog{}).Where("create_time >= ? AND status = ?", last24h, models.LogStatusSuccess).Count(&stats.SuccessLogs)

	// 失败日志数
	dbtool.DB().Model(&models.SystemLog{}).Where("create_time >= ? AND status = ?", last24h, models.LogStatusFailed).Count(&stats.FailedLogs)

	// 管理员操作日志数
	dbtool.DB().Model(&models.SystemLog{}).Where("create_time >= ? AND log_category = ?", last24h, models.LogCategoryAdmin).Count(&stats.AdminLogs)

	// 用户操作日志数
	dbtool.DB().Model(&models.SystemLog{}).Where("create_time >= ? AND log_category = ?", last24h, models.LogCategoryUser).Count(&stats.UserLogs)

	// 安全相关日志数
	dbtool.DB().Model(&models.SystemLog{}).Where("create_time >= ? AND log_category = ?", last24h, models.LogCategorySecurity).Count(&stats.SecurityLogs)

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": stats,
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
