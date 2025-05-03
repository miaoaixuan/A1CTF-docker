package controllers

import (
	"net/http"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	general "a1ctf/src/utils/general"
)

func Login() func(c *gin.Context) (interface{}, error) {
	return func(c *gin.Context) (interface{}, error) {
		var loginVals LoginPayload
		if err := c.ShouldBind(&loginVals); err != nil {
			return "", jwt.ErrMissingLoginValues
		}

		user_result := models.User{}
		if dbtool.DB().First(&user_result, "username = ? OR email = ? ", loginVals.Username, loginVals.Username).Error != nil {
			return nil, jwt.ErrFailedAuthentication
		} else {
			if user_result.Password == general.SaltPassword(loginVals.Password, user_result.Salt) {
				return &models.JWTUser{
					UserName: user_result.Username,
					Role:     "ADMIN",
					UserID:   user_result.UserID,
				}, nil
			} else {
				return nil, jwt.ErrFailedAuthentication
			}
		}
	}
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
		Role:          0,
		CurToken:      nil,
		Phone:         nil,
		StudentNumber: nil,
		Realname:      nil,
		Slogan:        nil,
		Avatar:        nil,
		SsoData:       nil,
		Email:         &payload.Email,
		EmailVerified: false,
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
