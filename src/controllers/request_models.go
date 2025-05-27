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
	Size   int `json:"size" binding:"min=0"`
	Offset int `json:"offset"`
}

type AdminListTeamsPayload struct {
	GameID int `json:"game_id"`
	Size   int `json:"size" binding:"min=0"`
	Offset int `json:"offset"`
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
	GameID int64 `json:"game_id" binding:"required"`
	Size   int   `json:"size" binding:"required"`
	Offset int   `json:"offset"`
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
