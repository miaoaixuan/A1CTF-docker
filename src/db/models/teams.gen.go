package models

const TableNameTeam = "teams"

// Team mapped from table <teams>
type Team struct {
	TeamID          int64     `gorm:"column:team_id;primaryKey;autoIncrement:true" json:"team_id"`
	GameID          int64     `gorm:"column:game_id;not null" json:"game_id"`
	TeamName        string    `gorm:"column:team_name;not null" json:"team_name"`
	TeamAvatar      *string   `gorm:"column:team_avatar" json:"team_avatar"`
	TeamSlogan      *string   `gorm:"column:team_slogan" json:"team_slogan"`
	TeamDescription *string   `gorm:"column:team_description" json:"team_description"`
	TeamMembers     *[]string `gorm:"column:team_members" json:"team_members"`
	TeamScore       float64   `gorm:"column:team_score;not null" json:"team_score"`
	TeamHash        string    `gorm:"column:team_hash;not null" json:"team_hash"`
	InviteCode      *string   `gorm:"column:invite_code" json:"invite_code"`
	TeamStatus      int32     `gorm:"column:team_status;not null" json:"team_status"`
}

// TableName Team's table name
func (*Team) TableName() string {
	return TableNameTeam
}
