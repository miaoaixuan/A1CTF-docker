package webmodels

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
	GroupID     *int64 `json:"group_id"`
}

type UserSubmitFlagPayload struct {
	FlagContent string `json:"flag" binding:"required"`
}

// Authorization payloads

type RegisterPayload struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Captcha  string `json:"captcha"`
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

type AdminListUsersPayload struct {
	Size   int    `json:"size" binding:"min=0"`
	Offset int    `json:"offset"`
	Search string `json:"search"`
}

type AdminListTeamsPayload struct {
	GameID int    `json:"game_id"`
	Size   int    `json:"size" binding:"min=0"`
	Offset int    `json:"offset"`
	Search string `json:"search"`
}

type AdminTeamOperationPayload struct {
	TeamID int64 `json:"team_id" binding:"required"`
	GameID int64 `json:"game_id"`
}

// Admin Container payloads

// AdminUpdateUserPayload 用户管理的负载
type AdminUpdateUserPayload struct {
	UserID    string          `json:"user_id" binding:"required"`
	UserName  string          `json:"user_name" binding:"required"`
	RealName  *string         `json:"real_name"`
	StudentID *string         `json:"student_id"`
	Phone     *string         `json:"phone"`
	Slogan    *string         `json:"slogan"`
	Email     *string         `json:"email"`
	Avatar    *string         `json:"avatar"`
	Role      models.UserRole `json:"role" binding:"required"`
}

// AdminUserOperationPayload 用户操作的负载
type AdminUserOperationPayload struct {
	UserID string `json:"user_id" binding:"required"`
}

// 容器列表请求参数
type AdminListContainersPayload struct {
	GameID int    `json:"game_id"`
	Size   int    `json:"size" binding:"min=0"`
	Offset int    `json:"offset"`
	Search string `json:"search"`
}

// 容器操作请求参数
type AdminContainerOperationPayload struct {
	ContainerID string `json:"container_id" binding:"required"`
}

// 延长容器生命周期请求参数
type AdminExtendContainerPayload struct {
	ContainerID string `json:"container_id" binding:"required"`
}

// 容器详情返回结构
type AdminContainerItem struct {
	ContainerID         string                 `json:"container_id"`
	ContainerName       string                 `json:"container_name"`
	ContainerStatus     models.ContainerStatus `json:"container_status"`
	ContainerExpireTime time.Time              `json:"container_expiretime"`
	ContainerType       string                 `json:"container_type"`
	ContainerPorts      models.ExposePorts     `json:"container_ports"`
	TeamName            string                 `json:"team_name"`
	GameName            string                 `json:"game_name"`
	ChallengeName       string                 `json:"challenge_name"`
}

// Team management payloads

type TeamJoinPayload struct {
	InviteCode string `json:"invite_code" binding:"required"`
}

type HandleJoinRequestPayload struct {
	Action string `json:"action" binding:"required"` // "approve" or "reject"
}

type TransferCaptainPayload struct {
	NewCaptainID string `json:"new_captain_id" binding:"required"`
}

type UpdateTeamInfoPayload struct {
	TeamSlogan *string `json:"team_slogan"`
}

// 分组管理相关的请求模型
type CreateGameGroupPayload struct {
	GroupName   string `json:"group_name" binding:"required"`
	Description string `json:"description"`
}

type UpdateGameGroupPayload struct {
	GroupName   string `json:"group_name" binding:"required"`
	Description string `json:"description"`
}

// 公告管理相关的请求模型
type AdminCreateNoticePayload struct {
	GameID  int64  `json:"game_id" binding:"required"`
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
}

type AdminListNoticesPayload struct {
	GameID int `json:"game_id" binding:"required"`
	Size   int `json:"size" binding:"min=0"`
	Offset int `json:"offset"`
}

type AdminDeleteNoticePayload struct {
	NoticeID int64 `json:"notice_id" binding:"required"`
}
