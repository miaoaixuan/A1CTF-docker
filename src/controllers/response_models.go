package controllers

import (
	"a1ctf/src/db/models"
	"time"
)

// Error response

type ErrorMessage struct {
	Code    int64  `json:"code"`
	Message string `json:"message"`
}

// User Game Controller

type UserGameSimpleInfo struct {
	GameID    int64     `json:"game_id"`
	Name      string    `json:"name"`
	Summary   *string   `json:"summary"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Visible   bool      `json:"visible"`
	Poster    *string   `json:"poster"`
}

type UserFullGameInfo struct {
	GameID               int64                      `json:"game_id"`
	Name                 string                     `json:"name"`
	Summary              *string                    `json:"summary"`
	Description          *string                    `json:"description"`
	Poster               *string                    `json:"poster"`
	StartTime            time.Time                  `json:"start_time"`
	EndTime              time.Time                  `json:"end_time"`
	PracticeMode         bool                       `json:"practice_mode"`
	TeamNumberLimit      int32                      `json:"team_number_limit"`
	ContainerNumberLimit int32                      `json:"container_number_limit"`
	RequireWP            bool                       `json:"require_wp"`
	WPExpireTime         time.Time                  `json:"wp_expire_time"`
	Stages               *models.GameStages         `json:"stages"`
	Visible              bool                       `json:"visible"`
	TeamStatus           models.ParticipationStatus `json:"team_status"`
	TeamInfo             *models.Team               `json:"team_info"`
}

type UserSimpleGameSolvedChallenge struct {
	ChallengeID   int64     `json:"challenge_id"`
	ChallengeName string    `json:"challenge_name"`
	SolveTime     time.Time `json:"solve_time"`
	Rank          int32     `json:"rank"`
}

type UserSimpleGameChallenge struct {
	ChallengeID   int64                    `json:"challenge_id"`
	ChallengeName string                   `json:"challenge_name"`
	TotalScore    float64                  `json:"total_score"`
	CurScore      float64                  `json:"cur_score"`
	SolveCount    int32                    `json:"solve_count"`
	Category      models.ChallengeCategory `json:"category"`
}

type ExposePortInfo struct {
	ContainerName  string             `json:"container_name"`
	ContainerPorts models.ExposePorts `json:"container_ports"`
}

type UserDetailGameChallenge struct {
	ChallengeID         int64                         `json:"challenge_id"`
	ChallengeName       string                        `json:"challenge_name"`
	Description         string                        `json:"description"`
	TotalScore          float64                       `json:"total_score"`
	CurScore            float64                       `json:"cur_score"`
	Hints               models.Hints                  `json:"hints"`
	BelongStage         *string                       `json:"belong_stage"`
	SolveCount          int32                         `json:"solve_count"`
	Category            models.ChallengeCategory      `json:"category"`
	Attachments         []UserAttachmentConfig        `json:"attachments"`
	ContainerType       models.ChallengeContainerType `json:"container_type"`
	ContainerStatus     models.ContainerStatus        `json:"container_status"`
	ContainerExpireTime *time.Time                    `json:"container_expiretime"`
	Containers          []ExposePortInfo              `json:"containers"`
}

type GameNotice struct {
	NoticeID       int64                 `json:"notice_id"`
	NoticeCategory models.NoticeCategory `json:"notice_category"`
	Data           []string              `json:"data"`
	CreateTime     time.Time             `json:"create_time"`
}

type GameScoreboardData struct {
	GameID     int64           `json:"game_id"`
	Name       string          `json:"name"`
	TimeLines  []TimeLineItem  `json:"time_lines"`
	TeamScores []TeamScoreItem `json:"teams"`
}

// Admin User Controller

type AdminListUserItem struct {
	UserID        string          `json:"user_id"`
	UserName      string          `json:"user_name"`
	RealName      *string         `json:"real_name"`
	StudentID     *string         `json:"student_id"`
	Phone         *string         `json:"phone"`
	Slogan        *string         `json:"slogan"`
	RegisterTime  time.Time       `json:"register_time"`
	LastLoginTime time.Time       `json:"last_login_time"`
	LastLoginIP   *string         `json:"last_login_ip"`
	Email         *string         `json:"email"`
	Avatar        *string         `json:"avatar"`
	Role          models.UserRole `json:"role"`
	EmailVerified bool            `json:"email_verified"`
}

type AdminSimpleTeamMemberInfo struct {
	Avatar   *string `json:"avatar"`
	UserName string  `json:"user_name"`
	UserID   string  `json:"user_id"`
}

// 添加一个新的结构体用于团队成员信息
type TeamMemberInfo struct {
	Avatar   *string `json:"avatar"`
	UserName string  `json:"user_name"`
	UserID   string  `json:"user_id"`
	Captain  bool    `json:"captain"`
}

type AdminListTeamItem struct {
	TeamID     int64                       `json:"team_id"`
	TeamName   string                      `json:"team_name"`
	TeamAvatar *string                     `json:"team_avatar"`
	TeamSlogan *string                     `json:"team_slogan"`
	Members    []AdminSimpleTeamMemberInfo `json:"members"`
	Status     models.ParticipationStatus  `json:"status"`
	Score      float64                     `json:"score"`
}
