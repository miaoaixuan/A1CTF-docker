package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AdminListUsers(c *gin.Context) {

	var payload AdminListUsersPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	var users []models.User
	if err := dbtool.DB().Find(&users).Offset(payload.Offset).Limit(payload.Size).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	var count int64
	if err := dbtool.DB().Model(&models.User{}).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}

	userItems := make([]AdminListUserItem, 0, len(users))

	for _, user := range users {
		userItems = append(userItems, AdminListUserItem{
			UserID:        user.UserID,
			UserName:      user.Username,
			RealName:      user.Realname,
			StudentID:     user.StudentNumber,
			Phone:         user.Phone,
			Slogan:        user.Slogan,
			RegisterTime:  user.RegisterTime,
			LastLoginTime: user.LastLoginTime,
			LastLoginIP:   user.LastLoginIP,
			Email:         user.Email,
			Avatar:        user.Avatar,
			Role:          user.Role,
			EmailVerified: user.EmailVerified,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":  200,
		"data":  userItems,
		"total": count,
	})
}

// AdminUpdateUser 更新用户信息
func AdminUpdateUser(c *gin.Context) {
	var payload AdminUpdateUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求参数",
		})
		return
	}

	// 先检查用户是否存在
	var user models.User
	if err := dbtool.DB().First(&user, "user_id = ?", payload.UserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "未找到用户",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询用户失败",
			})
		}
		return
	}

	// 更新用户信息
	user.Username = payload.UserName
	user.Realname = payload.RealName
	user.StudentNumber = payload.StudentID
	user.Phone = payload.Phone
	user.Slogan = payload.Slogan
	user.Email = payload.Email
	user.Avatar = payload.Avatar
	user.Role = payload.Role

	if err := dbtool.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新用户信息失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "用户信息已更新",
	})
}

// 生成随机密码
func generateRandomPassword(length int) string {
	rand.Seed(time.Now().UnixNano())
	chars := "ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789"
	password := make([]byte, length)
	for i := 0; i < length; i++ {
		password[i] = chars[rand.Intn(len(chars))]
	}
	return string(password)
}

// AdminResetUserPassword 重置用户密码
func AdminResetUserPassword(c *gin.Context) {
	var payload AdminUserOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求参数",
		})
		return
	}

	// 先检查用户是否存在
	var user models.User
	if err := dbtool.DB().First(&user, "user_id = ?", payload.UserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "未找到用户",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询用户失败",
			})
		}
		return
	}

	// 生成新密码
	newPassword := generateRandomPassword(8)

	// 更新用户密码
	// 注意：实际应用中应该对密码进行哈希处理
	user.Password = newPassword

	if err := dbtool.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "重置密码失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":         200,
		"message":      "密码已重置",
		"new_password": newPassword,
	})
}

// AdminDeleteUser 删除用户
func AdminDeleteUser(c *gin.Context) {
	var payload AdminUserOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求参数",
		})
		return
	}

	// 开始事务
	tx := dbtool.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 先检查用户是否存在
	var user models.User
	if err := tx.First(&user, "user_id = ?", payload.UserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "未找到用户",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询用户失败",
			})
		}
		tx.Rollback()
		return
	}

	// 删除用户
	if err := tx.Delete(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除用户失败",
		})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "提交事务失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "用户已删除",
	})
}
