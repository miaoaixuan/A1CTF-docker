package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

const TableNameGameChallenge = "game_challenges"

type Solve struct {
	UserID      string    `json:"user_id"`
	GameID      int32     `json:"game_id"`
	SolveTime   time.Time `json:"solve_time"`
	ChallengeID int32     `json:"challenge_id"`
	Score       float64   `json:"score"`
	SolveRank   int32     `json:"solve_rank"`
}

type Solves []Solve

func (e Solves) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *Solves) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

type GameChallenge struct {
	IngameID    int64        `gorm:"column:ingame_id;primaryKey;autoIncrement:true" json:"ingame_id"`
	GameID      int64        `gorm:"column:game_id;not null" json:"game_id"`
	ChallengeID int64        `gorm:"column:challenge_id;not null" json:"challenge_id"`
	Score       float64      `gorm:"column:score;not null" json:"score"`
	Enabled     bool         `gorm:"column:enabled;not null" json:"enabled"`
	Solved      Solves       `gorm:"column:solved;not null;default:[]" json:"solved"`
	Hints       *[]string    `gorm:"column:hints;default:{}" json:"hints"`
	JudgeConfig *JudgeConfig `gorm:"column:judge_config" json:"judge_config"`
	BelongStage *int32       `gorm:"column:belong_stage" json:"belong_stage"`
}

// TableName GameChallenge's table name
func (*GameChallenge) TableName() string {
	return TableNameGameChallenge
}
