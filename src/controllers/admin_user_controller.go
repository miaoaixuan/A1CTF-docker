package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	general "a1ctf/src/utils/general"
	"a1ctf/src/webmodels"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AdminListUsers(c *gin.Context) {

	var payload webmodels.AdminListUsersPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	query := dbtool.DB().Model(&models.User{})

	// 如果有搜索关键词，添加搜索条件
	if payload.Search != "" {
		searchPattern := "%" + payload.Search + "%"
		query = query.Where("username LIKE ? OR email LIKE ? OR realname LIKE ? OR student_number LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern)
	}

	var users []models.User
	if err := query.Offset(payload.Offset).Limit(payload.Size).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	var count int64
	countQuery := dbtool.DB().Model(&models.User{})
	if payload.Search != "" {
		searchPattern := "%" + payload.Search + "%"
		countQuery = countQuery.Where("username LIKE ? OR email LIKE ? OR realname LIKE ? OR student_number LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern)
	}
	if err := countQuery.Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}

	userItems := make([]webmodels.AdminListUserItem, 0, len(users))

	for _, user := range users {
		userItems = append(userItems, webmodels.AdminListUserItem{
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
	var payload webmodels.AdminUpdateUserPayload
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

// AdminResetUserPassword 重置用户密码
func AdminResetUserPassword(c *gin.Context) {
	var payload webmodels.AdminUserOperationPayload
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
	newPassword := general.RandomPassword(16)
	newSalt := general.GenerateSalt()
	saltedPassword := general.SaltPassword(newPassword, newSalt)

	// 更新用户密码
	user.Password = saltedPassword
	user.Salt = newSalt
	// 作废老令牌
	user.JWTVersion = general.RandomPassword(16)

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
	var payload webmodels.AdminUserOperationPayload
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
