package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// JoinRequestStatus 加入申请状态枚举
type JoinRequestStatus string

const (
	JoinRequestPending  JoinRequestStatus = "Pending"  // 待处理
	JoinRequestApproved JoinRequestStatus = "Approved" // 已批准
	JoinRequestRejected JoinRequestStatus = "Rejected" // 已拒绝
)

// Scan 实现 Scanner 接口
func (s *JoinRequestStatus) Scan(value interface{}) error {
	if value == nil {
		*s = JoinRequestPending
		return nil
	}

	switch v := value.(type) {
	case []byte:
		var status JoinRequestStatus
		if err := json.Unmarshal(v, &status); err != nil {
			return err
		}
		*s = status
	case string:
		var status JoinRequestStatus
		if err := json.Unmarshal([]byte(v), &status); err != nil {
			return err
		}
		*s = status
	}
	return nil
}

// Value 实现 Valuer 接口
func (s JoinRequestStatus) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// TeamJoinRequest 加入战队申请模型
type TeamJoinRequest struct {
	RequestID  int64             `gorm:"primaryKey;column:request_id" json:"request_id"`
	TeamID     int64             `gorm:"column:team_id;not null" json:"team_id"`
	UserID     string            `gorm:"column:user_id;type:uuid;not null" json:"user_id"`
	GameID     int64             `gorm:"column:game_id;not null" json:"game_id"`
	Status     JoinRequestStatus `gorm:"column:status;type:jsonb;not null" json:"status"`
	CreateTime time.Time         `gorm:"column:create_time;not null" json:"create_time"`
	HandleTime *time.Time        `gorm:"column:handle_time" json:"handle_time"`
	HandledBy  *string           `gorm:"column:handled_by;type:uuid" json:"handled_by"`
	Message    *string           `gorm:"column:message" json:"message"`

	// 关联
	Team    Team  `gorm:"foreignKey:TeamID;references:team_id" json:"team"`
	User    User  `gorm:"foreignKey:UserID;references:user_id" json:"user"`
	Game    Game  `gorm:"foreignKey:GameID;references:game_id" json:"game"`
	Handler *User `gorm:"foreignKey:HandledBy;references:user_id" json:"handler"`
}

// TableName 设置表名
func (TeamJoinRequest) TableName() string {
	return "team_join_requests"
}
