package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
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

type StringArray []string

// Scan 实现 sql.Scanner 接口
func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = StringArray{}
		return nil
	}

	switch v := value.(type) {
	case []byte:
		// 处理 JSON 格式的数组
		return json.Unmarshal(v, s)
	case string:
		// 处理 PostgreSQL 数组字面量格式 {a,b,c}
		if v == "{}" {
			*s = StringArray{}
			return nil
		}
		// 去掉大括号并按逗号分割
		elements := strings.Split(strings.Trim(v, "{}"), ",")
		*s = StringArray(elements)
		return nil
	default:
		return fmt.Errorf("unsupported type for StringArray: %T", value)
	}
}

// Value 实现 driver.Valuer 接口
func (s StringArray) Value() (driver.Value, error) {
	if s == nil || len(s) == 0 {
		return "{}", nil
	}
	// 返回 PostgreSQL 数组格式 {a,b,c}
	return "{" + strings.Join(s, ",") + "}", nil
}

type GameChallenge struct {
	IngameID    int64        `gorm:"column:ingame_id;primaryKey;autoIncrement:true" json:"ingame_id"`
	GameID      int64        `gorm:"column:game_id;not null" json:"game_id"`
	ChallengeID int64        `gorm:"column:challenge_id;not null" json:"challenge_id"`
	TotalScore  float64      `gorm:"column:total_score;not null" json:"total_score"`
	CurScore    float64      `gorm:"column:cur_score;not null" json:"cur_score"`
	Enabled     bool         `gorm:"column:enabled;not null" json:"enabled"`
	Solved      Solves       `gorm:"column:solved;not null;default:[]" json:"solved"`
	Hints       *StringArray `gorm:"column:hints;default:{}" json:"hints"`
	JudgeConfig *JudgeConfig `gorm:"column:judge_config" json:"judge_config"`
	BelongStage *int32       `gorm:"column:belong_stage" json:"belong_stage"`

	// Challenge Challenge `gorm:"foreignKey:challenge_id;references:challenges.challenge_id"`
}

// TableName GameChallenge's table name
func (*GameChallenge) TableName() string {
	return TableNameGameChallenge
}
