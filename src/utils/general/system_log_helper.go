package general

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"fmt"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// LogEntry 日志条目结构
type LogEntry struct {
	Category     models.LogCategory `json:"category"`
	UserID       *string            `json:"user_id,omitempty"`
	Username     *string            `json:"username,omitempty"`
	Action       string             `json:"action"`
	ResourceType string             `json:"resource_type"`
	ResourceID   *string            `json:"resource_id,omitempty"`
	Details      interface{}        `json:"details,omitempty"`
	IPAddress    *string            `json:"ip_address,omitempty"`
	UserAgent    *string            `json:"user_agent,omitempty"`
	Status       string             `json:"status"`
	ErrorMessage *string            `json:"error_message,omitempty"`
	GameID       *int64             `json:"game_id,omitempty"`
	ChallengeID  *int64             `json:"challenge_id,omitempty"`
	TeamID       *int64             `json:"team_id,omitempty"`
}

// SystemLogHelper 系统日志助手
type SystemLogHelper struct {
	db *gorm.DB
}

// NewSystemLogHelper 创建系统日志助手
func NewSystemLogHelper(db *gorm.DB) *SystemLogHelper {
	return &SystemLogHelper{db: db}
}

var Helper *SystemLogHelper

func GetLogHelper() *SystemLogHelper {
	if Helper == nil {
		Helper = NewSystemLogHelper(dbtool.DB())
	}
	return Helper
}

// LogOperation 记录操作日志
func (h *SystemLogHelper) LogOperation(entry LogEntry) error {
	log := &models.SystemLog{
		LogCategory:  entry.Category,
		UserID:       entry.UserID,
		Username:     entry.Username,
		Action:       entry.Action,
		ResourceType: entry.ResourceType,
		ResourceID:   entry.ResourceID,
		Details:      entry.Details,
		IPAddress:    entry.IPAddress,
		UserAgent:    entry.UserAgent,
		Status:       entry.Status,
		ErrorMessage: entry.ErrorMessage,
		CreateTime:   time.Now(),
		GameID:       entry.GameID,
		ChallengeID:  entry.ChallengeID,
		TeamID:       entry.TeamID,
	}

	return h.db.Create(log).Error
}

// LogFromGinContext 从Gin上下文中提取信息记录日志
func (h *SystemLogHelper) LogFromGinContext(c *gin.Context, entry LogEntry) error {
	// 从上下文中提取用户信息

	user, exists := c.Get("user")

	if exists {
		user := user.(models.User)
		entry.UserID = &user.UserID
		entry.Username = &user.Username
	}

	// 提取IP地址
	clientIP := c.ClientIP()
	entry.IPAddress = &clientIP

	// 提取User-Agent
	userAgent := c.GetHeader("User-Agent")
	if userAgent != "" {
		entry.UserAgent = &userAgent
	}

	return h.LogOperation(entry)
}

// LogAdminOperation 记录管理员操作
func (h *SystemLogHelper) LogAdminOperation(c *gin.Context, action, resourceType string, resourceID *string, details interface{}) error {
	return h.LogFromGinContext(c, LogEntry{
		Category:     models.LogCategoryAdmin,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Details:      details,
		Status:       models.LogStatusSuccess,
	})
}

// LogAdminOperationWithError 记录管理员操作（带错误）
func (h *SystemLogHelper) LogAdminOperationWithError(c *gin.Context, action, resourceType string, resourceID *string, details interface{}, err error) error {
	status := models.LogStatusSuccess
	var errorMessage *string

	if err != nil {
		status = models.LogStatusFailed
		errMsg := err.Error()
		errorMessage = &errMsg
	}

	return h.LogFromGinContext(c, LogEntry{
		Category:     models.LogCategoryAdmin,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Details:      details,
		Status:       status,
		ErrorMessage: errorMessage,
	})
}

// LogUserOperation 记录用户操作
func (h *SystemLogHelper) LogUserOperation(c *gin.Context, action, resourceType string, resourceID *string, details interface{}) error {
	return h.LogFromGinContext(c, LogEntry{
		Category:     models.LogCategoryUser,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Details:      details,
		Status:       models.LogStatusSuccess,
	})
}

// LogUserOperationWithError 记录用户操作（带错误）
func (h *SystemLogHelper) LogUserOperationWithError(c *gin.Context, action, resourceType string, resourceID *string, details interface{}, err error) error {
	status := models.LogStatusSuccess
	var errorMessage *string

	if err != nil {
		status = models.LogStatusFailed
		errMsg := err.Error()
		errorMessage = &errMsg
	}

	return h.LogFromGinContext(c, LogEntry{
		Category:     models.LogCategoryUser,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Details:      details,
		Status:       status,
		ErrorMessage: errorMessage,
	})
}

// LogContainerOperation 记录容器操作
func (h *SystemLogHelper) LogContainerOperation(userID *string, username *string, action string, containerID string, details interface{}, err error) error {
	status := models.LogStatusSuccess
	var errorMessage *string

	if err != nil {
		status = models.LogStatusFailed
		errMsg := err.Error()
		errorMessage = &errMsg
	}

	return h.LogOperation(LogEntry{
		Category:     models.LogCategoryContainer,
		UserID:       userID,
		Username:     username,
		Action:       action,
		ResourceType: models.ResourceTypeContainer,
		ResourceID:   &containerID,
		Details:      details,
		Status:       status,
		ErrorMessage: errorMessage,
	})
}

// LogJudgeOperation 记录判题操作
func (h *SystemLogHelper) LogJudgeOperation(userID *string, username *string, action string, judgeID string, details interface{}, err error) error {
	status := models.LogStatusSuccess
	var errorMessage *string

	if err != nil {
		status = models.LogStatusFailed
		errMsg := err.Error()
		errorMessage = &errMsg
	}

	return h.LogOperation(LogEntry{
		Category:     models.LogCategoryJudge,
		UserID:       userID,
		Username:     username,
		Action:       action,
		ResourceType: "JUDGE",
		ResourceID:   &judgeID,
		Details:      details,
		Status:       status,
		ErrorMessage: errorMessage,
	})
}

// LogSystemOperation 记录系统操作
func (h *SystemLogHelper) LogSystemOperation(action string, details interface{}, err error) error {
	status := models.LogStatusSuccess
	var errorMessage *string

	if err != nil {
		status = models.LogStatusFailed
		errMsg := err.Error()
		errorMessage = &errMsg
	}

	return h.LogOperation(LogEntry{
		Category:     models.LogCategorySystem,
		Action:       action,
		ResourceType: models.ResourceTypeSystem,
		Details:      details,
		Status:       status,
		ErrorMessage: errorMessage,
	})
}

// LogSecurityOperation 记录安全相关操作
func (h *SystemLogHelper) LogSecurityOperation(c *gin.Context, action string, details interface{}, err error) error {
	status := models.LogStatusSuccess
	var errorMessage *string

	if err != nil {
		status = models.LogStatusFailed
		errMsg := err.Error()
		errorMessage = &errMsg
	}

	return h.LogFromGinContext(c, LogEntry{
		Category:     models.LogCategorySecurity,
		Action:       action,
		ResourceType: "SECURITY",
		Details:      details,
		Status:       status,
		ErrorMessage: errorMessage,
	})
}

// QuerySystemLogs 查询系统日志
func (h *SystemLogHelper) QuerySystemLogs(params QueryLogParams) ([]models.SystemLog, int64, error) {
	var logs []models.SystemLog
	var total int64

	query := h.db.Model(&models.SystemLog{})

	// 应用过滤条件
	if params.Category != nil {
		query = query.Where("log_category = ?", *params.Category)
	}

	if params.UserID != nil {
		query = query.Where("user_id = ?", *params.UserID)
	}

	if params.Action != nil {
		query = query.Where("action = ?", *params.Action)
	}

	if params.ResourceType != nil {
		query = query.Where("resource_type = ?", *params.ResourceType)
	}

	if params.Status != nil {
		query = query.Where("status = ?", *params.Status)
	}

	if params.StartTime != nil {
		query = query.Where("create_time >= ?", *params.StartTime)
	}

	if params.EndTime != nil {
		query = query.Where("create_time <= ?", *params.EndTime)
	}

	if params.IPAddress != nil {
		query = query.Where("ip_address = ?", *params.IPAddress)
	}

	if params.GameID != nil {
		query = query.Where("game_id = ?", *params.GameID)
	}

	if params.Keyword != nil {
		keyword := fmt.Sprintf("%%%s%%", *params.Keyword)
		query = query.Where("username ILIKE ? OR action ILIKE ? OR resource_type ILIKE ?", keyword, keyword, keyword)
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 应用分页和排序
	offset := params.Offset
	if offset < 0 {
		offset = 0
	}

	size := params.Size
	if size <= 0 {
		size = 20
	}
	if size > 100 {
		size = 100
	}

	query = query.Order("create_time DESC").Offset(offset).Limit(size)

	// 执行查询
	if err := query.Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

// QueryLogParams 查询日志参数
type QueryLogParams struct {
	Category     *models.LogCategory `json:"category,omitempty"`
	UserID       *string             `json:"user_id,omitempty"`
	Action       *string             `json:"action,omitempty"`
	ResourceType *string             `json:"resource_type,omitempty"`
	Status       *string             `json:"status,omitempty"`
	StartTime    *time.Time          `json:"start_time,omitempty"`
	EndTime      *time.Time          `json:"end_time,omitempty"`
	IPAddress    *string             `json:"ip_address,omitempty"`
	GameID       *int64              `json:"game_id,omitempty"`
	Keyword      *string             `json:"keyword,omitempty"`
	Offset       int                 `json:"offset"`
	Size         int                 `json:"size"`
}

// 辅助函数
func Int64ToString(i int64) string {
	return strconv.FormatInt(i, 10)
}

func Int64ToStringPtr(i int64) *string {
	s := strconv.FormatInt(i, 10)
	return &s
}

func StringToInt64Ptr(s string) *int64 {
	if s == "" {
		return nil
	}
	i, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return nil
	}
	return &i
}
