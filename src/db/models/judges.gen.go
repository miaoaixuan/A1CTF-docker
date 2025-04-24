package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type JudgeStatus string

const (
	JudgeQueueing JudgeStatus = "JudgeQueueing"
	JudgeRunning  JudgeStatus = "JudgeRunning"
	JudgeError    JudgeStatus = "JudgeError"
	JudgeWA       JudgeStatus = "JudgeWA"
	JudgeAC       JudgeStatus = "JudgeAC"
	JudgeTimeout  JudgeStatus = "JudgeTimeout"
)

func (e JudgeStatus) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *JudgeStatus) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

const TableNameJudge = "judges"

// Judge mapped from table <judges>
type Judge struct {
	GameID       int64       `gorm:"column:game_id;not null" json:"game_id"`
	Game         Game        `gorm:"foreignKey:GameID;references:game_id" json:"-"`
	ChallengeID  int64       `gorm:"column:challenge_id;not null" json:"challenge_id"`
	Challenge    Challenge   `gorm:"foreignKey:ChallengeID;references:challenge_id" json:"-"`
	TeamID       int64       `gorm:"column:team_id;not null" json:"team_id"`
	Team         Team        `gorm:"foreignKey:TeamID;references:team_id" json:"-"`
	FlagID       int64       `gorm:"column:flag_id;not null" json:"flag_id"`
	TeamFlag     TeamFlag    `gorm:"foreignKey:FlagID;references:flag_id" json:"-"`
	JudgeType    JudgeType   `gorm:"column:judge_type;not null" json:"judge_type"`
	JudgeStatus  JudgeStatus `gorm:"column:judge_status;not null" json:"judge_status"`
	JudgeResult  string      `gorm:"column:judge_result" json:"judge_result"`
	SubmiterID   string      `gorm:"column:submiter_id;not null" json:"submiter_id"`
	JudgeID      string      `gorm:"column:judge_id;primaryKey" json:"judge_id"`
	JudgeTime    time.Time   `gorm:"column:judge_time;not null" json:"judge_time"`
	JudgeContent string      `gorm:"column:judge_content;not null" json:"judge_content"`
}

// TableName Judge's table name
func (*Judge) TableName() string {
	return TableNameJudge
}
