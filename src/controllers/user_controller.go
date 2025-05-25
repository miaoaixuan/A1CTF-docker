package controllers

import (
	"net/http"
	"time"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	general "a1ctf/src/utils/general"
	"a1ctf/src/utils/redis_tool"
	"a1ctf/src/utils/turnstile"
)

func Login() func(c *gin.Context) (interface{}, error) {
	return func(c *gin.Context) (interface{}, error) {
		var loginVals LoginPayload
		if err := c.ShouldBind(&loginVals); err != nil {
			return "", jwt.ErrMissingLoginValues
		}

		if ClientConfig.TurnstileEnabled {
			turnstile := turnstile.New(ClientConfig.TurnstileSecretKey)
			response, err := turnstile.Verify(loginVals.CaptCha, c.ClientIP())
			if err != nil {
				return nil, jwt.ErrMissingLoginValues
			}

			if !response.Success {
				return nil, jwt.ErrMissingLoginValues
			}
		}

		user_result := models.User{}
		if dbtool.DB().First(&user_result, "username = ? OR email = ? ", loginVals.Username, loginVals.Username).Error != nil {
			return nil, jwt.ErrFailedAuthentication
		} else {
			if user_result.Password == general.SaltPassword(loginVals.Password, user_result.Salt) {

				// Update last login time
				if err := dbtool.DB().Model(&user_result).Updates(map[string]interface{}{
					"last_login_time": time.Now().UTC(),
					"last_login_ip":   c.ClientIP(),
				}).Error; err != nil {
					return nil, jwt.ErrFailedAuthentication
				}

				return &models.JWTUser{
					UserName:   user_result.Username,
					Role:       user_result.Role,
					UserID:     user_result.UserID,
					JWTVersion: user_result.JWTVersion,
				}, nil
			} else {
				return nil, jwt.ErrFailedAuthentication
			}
		}
	}
}

// GetProfile 获取用户的基本资料信息
func GetProfile(c *gin.Context) {
	// 从JWT中提取用户信息
	claims := jwt.ExtractClaims(c)
	userID := claims["UserID"].(string)

	userMap, err := redis_tool.CachedMemberMap()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "System error",
		})
		return
	}

	user, ok := userMap[userID]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"user_id":               user.UserID,
			"username":              user.Username,
			"role":                  user.Role,
			"phone":                 user.Phone,
			"student_number":        user.StudentNumber,
			"realname":              user.Realname,
			"slogan":                user.Slogan,
			"avatar":                user.Avatar,
			"email":                 user.Email,
			"email_verified":        user.EmailVerified,
			"register_time":         user.RegisterTime,
			"last_login_time":       user.LastLoginTime,
			"last_login_ip":         user.LastLoginIP,
			"client_config_version": ClientConfig.UpdatedTime,
		},
	})
}

func Register(c *gin.Context) {
	var payload RegisterPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request payload",
		})
		return
	}

	if ClientConfig.TurnstileEnabled {
		turnstile := turnstile.New(ClientConfig.TurnstileSecretKey)
		response, err := turnstile.Verify(payload.Captcha, c.ClientIP())
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid request payload",
			})
			return
		}

		if !response.Success {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid request payload",
			})
			return
		}
	}

	var existingUsers []models.User
	if err := dbtool.DB().Where("username = ? OR email = ?", payload.Username, payload.Email).Find(&existingUsers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "System error",
		})
		return
	}

	if len(existingUsers) > 0 {
		c.JSON(http.StatusNotAcceptable, gin.H{
			"code":    500,
			"message": "Username or email has registered",
		})
		return
	}

	newSalt := general.GenerateSalt()
	saltedPassword := general.SaltPassword(payload.Password, newSalt)

	newUser := models.User{
		UserID:        uuid.New().String(),
		Username:      payload.Username,
		Password:      saltedPassword,
		Salt:          newSalt,
		Role:          models.UserRoleAdmin,
		CurToken:      nil,
		Phone:         nil,
		StudentNumber: nil,
		Realname:      nil,
		Slogan:        nil,
		Avatar:        nil,
		SsoData:       nil,
		Email:         &payload.Email,
		EmailVerified: false,
		JWTVersion:    general.RandomString(16),
		RegisterTime:  time.Now().UTC(),
	}

	if err := dbtool.DB().Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    501,
			"message": "System error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
	})
}
