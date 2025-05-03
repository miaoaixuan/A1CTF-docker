package controllers

import (
	"a1ctf/src/db/models"
	"time"
)

// Game challenge payloads

type UserAttachmentConfig struct {
	AttachName   string                `json:"attach_name"`
	AttachType   models.AttachmentType `json:"attach_type"`
	AttachURL    *string               `json:"attach_url,omitempty"`
	AttachHash   *string               `json:"attach_hash,omitempty"`
	DownloadHash *string               `json:"download_hash,omitempty"`
}

type UserCreateTeamPayload struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Slogan      string `json:"slogan"`
}

type UserSubmitFlagPayload struct {
	FlagContent string `json:"flag" binding:"required"`
}

type TimeLineScoreItem struct {
	RecordTime int64   `json:"record_time"`
	Score      float64 `json:"score"`
}

type TimeLineItem struct {
	TeamID   int64               `json:"team_id"`
	TeamName string              `json:"team_name"`
	Scores   []TimeLineScoreItem `json:"scores"`
}

type TeamSolveItem struct {
	ChallengeID int64     `json:"challenge_id"`
	Score       float64   `json:"score"`
	Solver      string    `json:"solver"`
	Rank        int64     `json:"rank"`
	SolveTime   time.Time `json:"solve_time"`
}

type TeamScoreItem struct {
	TeamID           int64           `json:"team_id"`
	TeamName         string          `json:"team_name"`
	TeamAvatar       *string         `json:"team_avatar"`
	TeamSlogan       *string         `json:"team_slogan"`
	TeamDescription  *string         `json:"team_description"`
	Rank             int64           `json:"rank"`
	Score            float64         `json:"score"`
	SolvedChallenges []TeamSolveItem `json:"solved_challenges"`
}

// Authorization payloads

type LoginPayload struct {
	Username string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password" binding:"required"`
	CaptCha  string `form:"captcha" json:"captcha"`
}

type RegisterPayload struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Captcha  string `json:"captcha,omitempty"`
}

// Admin payloads

type AdminUpdateGamePayload struct {
	models.Game
	Challenges []models.GameChallenge `json:"challenges"`
}

type AdminListGamePayload struct {
	Size   int `json:"size" binding:"min=0"`
	Offset int `json:"offset"`
}

type AdminAddGameChallengePayload struct {
	GameID      int64 `json:"game_id" binding:"min=0"`
	ChallengeID int64 `json:"challenge_id" binding:"min=0"`
}
