package models

import "time"

const TableNameSolve = "solves"

// Judge mapped from table <judges>
type Solve struct {
	SolveID     string    `gorm:"column:solve_id;primaryKey" json:"solve_id"`
	ChallengeID int64     `gorm:"column:challenge_id;not null" json:"challenge_id"`
	TeamID      int64     `gorm:"column:team_id;not null" json:"team_id"`
	GameID      int64     `gorm:"column:game_id;not null" json:"game_id"`
	ContainerID *string   `gorm:"column:container_id" json:"container_id"`
	SolveStatus int32     `gorm:"column:solve_status" json:"solve_status"`
	SolveTime   time.Time `gorm:"column:solve_time;not null" json:"solve_time"`
	Rank        int32     `gorm:"column:rank" json:"rank"`
}

// TableName Judge's table name
func (*Solve) TableName() string {
	return TableNameSolve
}
