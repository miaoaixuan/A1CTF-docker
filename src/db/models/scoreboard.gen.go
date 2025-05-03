package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

const TableScoreboard = "scoreboard"

type ScoreBoardData struct {
	TeamName             string   `json:"team_name"`
	SolvedChallenges     []string `json:"solved_challenges"`
	NewSolvedChallengeID *int64   `json:"new_solved"`
	Score                float64  `json:"score"`
}

type ScoreBoardDatas map[int64]ScoreBoardData

type ScoreBoardDataWithTime struct {
	RecordTime time.Time       `json:"record_time"`
	Data       ScoreBoardDatas `json:"data"`
}

type ScoreBoardDataWithTimeList []ScoreBoardDataWithTime

func (e ScoreBoardDataWithTimeList) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *ScoreBoardDataWithTimeList) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

// Team mapped from table <team_flags>
type ScoreBoard struct {
	ScoreID      int64                      `gorm:"primaryKey;column:score_id;autoIncrement" json:"score_id"`
	GameID       int64                      `gorm:"column:game_id;not null" json:"game_id"`
	Game         Game                       `gorm:"foreignKey:GameID;references:game_id" json:"-"`
	GenerateTime time.Time                  `gorm:"column:generate_time;not null" json:"generate_time"`
	Data         ScoreBoardDataWithTimeList `gorm:"column:data;not null" json:"data"`
	PrevScore    float64                    `gorm:"column:prev_score;not null" json:"prev_score"`
	CurRecords   int32                      `gorm:"column:cur_records;not null" json:"cur_records"`
}

// TableName Team's table name
func (*ScoreBoard) TableName() string {
	return TableScoreboard
}
