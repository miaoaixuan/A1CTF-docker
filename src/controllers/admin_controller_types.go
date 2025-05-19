package controllers

import (
	"a1ctf/src/db/models"
)

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
