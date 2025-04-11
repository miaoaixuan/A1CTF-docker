package models

import (
	"time"
)

const TableNameJudge = "judges"

// Judge mapped from table <judges>
type Judge struct {
	ChallengeID  int64     `gorm:"column:challenge_id;not null" json:"challenge_id"`
	TeamID       int64     `gorm:"column:team_id;not null" json:"team_id"`
	JudgeType    int32     `gorm:"column:judge_type;not null" json:"judge_type"`
	JudgeStatus  int32     `gorm:"column:judge_status;not null" json:"judge_status"`
	JudgeResult  int32     `gorm:"column:judge_result;not null" json:"judge_result"`
	JudgeID      string    `gorm:"column:judge_id;primaryKey" json:"judge_id"`
	JudgeTime    time.Time `gorm:"column:judge_time;not null" json:"judge_time"`
	JudgeContent string    `gorm:"column:judge_content;not null" json:"judge_content"`
}

// TableName Judge's table name
func (*Judge) TableName() string {
	return TableNameJudge
}
