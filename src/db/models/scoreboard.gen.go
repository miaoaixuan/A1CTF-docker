package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

const TableScoreboard = "scoreboard"

type ScoreBoardData struct {
	TeamName             string  `json:"team_name"`
	TeamID               int64   `json:"team_id"`
	SolvedChallenges     []int64 `json:"solved_challenges"`
	NewSolvedChallengeID *int64  `json:"new_solved"`
	Score                float64 `json:"score"`
}

type ScoreBoardDatas []ScoreBoardData

func (e ScoreBoardDatas) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *ScoreBoardDatas) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

// Team mapped from table <team_flags>
type ScoreBoard struct {
	ScoreID      int64           `gorm:"primaryKey;column:score_id;autoIncrement" json:"score_id"`
	GameID       int64           `gorm:"column:game_id;not null" json:"game_id"`
	Game         Game            `gorm:"foreignKey:GameID;references:game_id" json:"-"`
	GenerateTime time.Time       `gorm:"column:generate_time;not null" json:"generate_time"`
	Data         ScoreBoardDatas `gorm:"column:data;not null" json:"data"`
}

// TableName Team's table name
func (*ScoreBoard) TableName() string {
	return TableScoreboard
}
