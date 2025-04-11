package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

const TableNameGame = "games"

type GameStage struct {
	StageName string    `json:"stage_name"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

type GameStages []GameStage

func (e GameStages) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *GameStages) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

// Game mapped from table <games>
type Game struct {
	GameID               int64       `gorm:"column:game_id;primaryKey;autoIncrement:true" json:"game_id"`
	Name                 string      `gorm:"column:name;not null" json:"name"`
	Summary              *string     `gorm:"column:summary" json:"summary"`
	Description          *string     `gorm:"column:description" json:"description"`
	Poster               *string     `gorm:"column:poster" json:"poster"`
	InviteCode           *string     `gorm:"column:invite_code" json:"invite_code"`
	StartTime            time.Time   `gorm:"column:start_time;not null" json:"start_time"`
	EndTime              time.Time   `gorm:"column:end_time;not null" json:"end_time"`
	PracticeMode         bool        `gorm:"column:practice_mode;not null" json:"practice_mode"`
	TeamNumberLimit      int32       `gorm:"column:team_number_limit;not null" json:"team_number_limit"`
	ContainerNumberLimit int32       `gorm:"column:container_number_limit;not null" json:"container_number_limit"`
	RequireWp            bool        `gorm:"column:require_wp;not null" json:"require_wp"`
	WpExpireTime         time.Time   `gorm:"column:wp_expire_time;not null" json:"wp_expire_time"`
	Stages               *GameStages `gorm:"column:stages;not null" json:"stages"`
	Visible              bool        `gorm:"column:visible;not null" json:"visible"`
}

// TableName Game's table name
func (*Game) TableName() string {
	return TableNameGame
}
