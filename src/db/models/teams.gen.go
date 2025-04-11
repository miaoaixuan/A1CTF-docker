package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

const TableNameTeam = "teams"

type ParticipationStatus string

const (
	ParticipateUnRegistered ParticipationStatus = "UnRegistered" // 未报名
	ParticipatePending      ParticipationStatus = "Pending"      // 已报名，等待审核
	ParticipateApproved     ParticipationStatus = "Approved"     // 已报名，审核通过
	ParticipateRejected     ParticipationStatus = "Rejected"     // 已报名，审核不通过
	ParticipateParticipated ParticipationStatus = "Participated" // 已报名，已参加
	ParticipateBanned       ParticipationStatus = "Banned"       // 已被禁赛
)

func (e ParticipationStatus) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *ParticipationStatus) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

// Team mapped from table <teams>
type Team struct {
	TeamID          int64               `gorm:"column:team_id;primaryKey;autoIncrement:true" json:"team_id"`
	GameID          int64               `gorm:"column:game_id;not null" json:"game_id"`
	TeamName        string              `gorm:"column:team_name;not null" json:"team_name"`
	TeamAvatar      *string             `gorm:"column:team_avatar" json:"team_avatar"`
	TeamSlogan      *string             `gorm:"column:team_slogan" json:"team_slogan"`
	TeamDescription *string             `gorm:"column:team_description" json:"team_description"`
	TeamMembers     *[]string           `gorm:"column:team_members" json:"team_members"`
	TeamScore       float64             `gorm:"column:team_score;not null" json:"team_score"`
	TeamHash        string              `gorm:"column:team_hash;not null" json:"team_hash"`
	InviteCode      *string             `gorm:"column:invite_code" json:"invite_code"`
	TeamStatus      ParticipationStatus `gorm:"column:team_status;not null" json:"team_status"`
}

// TableName Team's table name
func (*Team) TableName() string {
	return TableNameTeam
}
