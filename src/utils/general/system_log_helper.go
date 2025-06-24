package general

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"context"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
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
	db          *gorm.DB
	logQueue    chan *models.SystemLog
	workerCount int
	ctx         context.Context
	cancel      context.CancelFunc
	wg          sync.WaitGroup
	batchSize   int
	flushTimer  *time.Timer
	batch       []*models.SystemLog
	batchMutex  sync.Mutex
}

// NewSystemLogHelper 创建系统日志助手
func NewSystemLogHelper(db *gorm.DB) *SystemLogHelper {
	ctx, cancel := context.WithCancel(context.Background())

	// 从配置文件读取参数
	queueBufferSize := viper.GetInt("logging.queue-buffer-size")
	if queueBufferSize <= 0 {
		queueBufferSize = 1000 // 默认值
	}

	workerCount := viper.GetInt("logging.worker-count")
	if workerCount <= 0 {
		workerCount = 3 // 默认值
	}

	batchSize := viper.GetInt("logging.batch-size")
	if batchSize <= 0 {
		batchSize = 10 // 默认值
	}

	helper := &SystemLogHelper{
		db:          db,
		logQueue:    make(chan *models.SystemLog, queueBufferSize),
		workerCount: workerCount,
		ctx:         ctx,
		cancel:      cancel,
		batchSize:   batchSize,
		batch:       make([]*models.SystemLog, 0, batchSize),
	}

	// 启动 worker goroutines
	helper.startWorkers()

	return helper
}

var Helper *SystemLogHelper

func GetLogHelper() *SystemLogHelper {
	if Helper == nil {
		Helper = NewSystemLogHelper(dbtool.DB())
	}
	return Helper
}

// startWorkers 启动工作协程
func (h *SystemLogHelper) startWorkers() {
	// 启动多个 worker 处理日志写入
	for i := 0; i < h.workerCount; i++ {
		h.wg.Add(1)
		go h.logWorker()
	}

	// 启动批量处理 worker
	h.wg.Add(1)
	go h.batchWorker()
}

// logWorker 日志处理工作协程
func (h *SystemLogHelper) logWorker() {
	defer h.wg.Done()

	for {
		select {
		case logEntry := <-h.logQueue:
			if logEntry == nil {
				return
			}

			// 添加到批处理队列
			h.batchMutex.Lock()
			h.batch = append(h.batch, logEntry)
			shouldFlush := len(h.batch) >= h.batchSize
			h.batchMutex.Unlock()

			// 如果批处理队列满了，立即刷写
			if shouldFlush {
				h.flushBatch()
			}

		case <-h.ctx.Done():
			return
		}
	}
}

// batchWorker 批量处理工作协程
func (h *SystemLogHelper) batchWorker() {
	defer h.wg.Done()

	// 从配置文件读取刷写间隔
	flushInterval := viper.GetDuration("logging.flush-interval")
	if flushInterval <= 0 {
		flushInterval = 5 * time.Second // 默认值
	}

	ticker := time.NewTicker(flushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			h.flushBatch()
		case <-h.ctx.Done():
			// 系统关闭时，刷写剩余的日志
			h.flushBatch()
			return
		}
	}
}

// flushBatch 批量写入日志到数据库
func (h *SystemLogHelper) flushBatch() {
	h.batchMutex.Lock()
	if len(h.batch) == 0 {
		h.batchMutex.Unlock()
		return
	}

	// 复制当前批次
	currentBatch := make([]*models.SystemLog, len(h.batch))
	copy(currentBatch, h.batch)

	// 清空批处理队列
	h.batch = h.batch[:0]
	h.batchMutex.Unlock()

	// 批量写入数据库
	if err := h.db.CreateInBatches(currentBatch, h.batchSize).Error; err != nil {
		log.Printf("Failed to write logs to database: %v", err)
		// 这里可以考虑重试机制或者记录到文件
	}
}

// LogOperation 记录操作日志（异步）
func (h *SystemLogHelper) LogOperation(entry LogEntry) error {
	logModel := &models.SystemLog{
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

	// 异步写入队列
	select {
	case h.logQueue <- logModel:
		return nil
	default:
		// 队列满了，记录警告但不阻塞
		log.Printf("Log queue is full, dropping log entry: %+v", entry)
		return fmt.Errorf("log queue is full")
	}
}

// LogOperationSync 同步记录操作日志（用于关键日志）
func (h *SystemLogHelper) LogOperationSync(entry LogEntry) error {
	logModel := &models.SystemLog{
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

	return h.db.Create(logModel).Error
}

// Shutdown 优雅关闭日志系统
func (h *SystemLogHelper) Shutdown() {
	log.Println("Shutting down log helper...")

	// 停止接收新的日志
	h.cancel()

	// 关闭队列通道
	close(h.logQueue)

	// 等待所有 worker 完成
	h.wg.Wait()

	log.Println("Log helper shutdown complete")
}

// GetQueueLength 获取当前队列长度（用于监控）
func (h *SystemLogHelper) GetQueueLength() int {
	return len(h.logQueue)
}

// GetBatchLength 获取当前批处理队列长度（用于监控）
func (h *SystemLogHelper) GetBatchLength() int {
	h.batchMutex.Lock()
	defer h.batchMutex.Unlock()
	return len(h.batch)
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
