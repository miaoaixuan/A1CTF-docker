package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

const TableNameNotice = "notices"

// NoticeCategory defines possible categories for notices
type NoticeCategory string

const (
	NoticeFirstBlood   NoticeCategory = "FirstBlood"
	NoticeSecondBlood  NoticeCategory = "SecondBlood"
	NoticeThirdBlood   NoticeCategory = "ThirdBlood"
	NoticeNewChallenge NoticeCategory = "NewChallenge"
	NoticeNewHint      NoticeCategory = "NewHint"
	NoticeNewAnnounce  NoticeCategory = "NewAnnouncement"
)

func (e NoticeCategory) Value() (driver.Value, error) {
	return string(e), nil
}

func (e *NoticeCategory) Scan(value interface{}) error {
	if value == nil {
		*e = ""
		return nil
	}
	s, ok := value.(string)
	if !ok {
		return errors.New("type assertion to string failed")
	}
	*e = NoticeCategory(s)
	return nil
}

// NoticeData represents the JSONB data structure for notices
type NoticeData []string

func (n *NoticeData) Value() (driver.Value, error) {
	return json.Marshal(n)
}

func (n *NoticeData) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, &n)
}

// Notice mapped from table <notices>
type Notice struct {
	NoticeID       int64          `gorm:"column:notice_id;primaryKey;autoIncrement:true" json:"notice_id"`
	GameID         int64          `gorm:"column:game_id;not null" json:"game_id"`
	CreateTime     time.Time      `gorm:"column:create_time;not null" json:"create_time"`
	NoticeCategory NoticeCategory `gorm:"column:notice_category;not null" json:"notice_category"`
	Data           NoticeData     `gorm:"column:data;type:jsonb;not null" json:"data"`
}

// TableName Notice's table name
func (*Notice) TableName() string {
	return TableNameNotice
}
