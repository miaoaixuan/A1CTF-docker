package controllers

import (
	"net/http"
	"time"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"a1ctf/src/db/models"
	clientconfig "a1ctf/src/modules/client_config"
	"a1ctf/src/tasks"
	dbtool "a1ctf/src/utils/db_tool"
	general "a1ctf/src/utils/general"
	"a1ctf/src/utils/ristretto_tool"
	"a1ctf/src/utils/turnstile"
	"a1ctf/src/webmodels"
)

// GetProfile 获取用户的基本资料信息
func GetProfile(c *gin.Context) {
	// 从JWT中提取用户信息
	claims := jwt.ExtractClaims(c)
	userID := claims["UserID"].(string)

	userMap, err := ristretto_tool.CachedMemberMap()
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
			"client_config_version": clientconfig.ClientConfig.UpdatedTime,
		},
	})
}

func Register(c *gin.Context) {
	var payload webmodels.RegisterPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request payload",
		})
		return
	}

	if clientconfig.ClientConfig.TurnstileEnabled {
		turnstile := turnstile.New(clientconfig.ClientConfig.TurnstileSecretKey)
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
		// 记录注册失败日志（用户名或邮箱已存在）
		tasks.LogFromGinContext(c, tasks.LogEntry{
			Category:     models.LogCategorySecurity,
			Action:       "REGISTER_FAILED",
			ResourceType: models.ResourceTypeUser,
			ResourceID:   &payload.Username,
			Details: map[string]interface{}{
				"username": payload.Username,
				"email":    payload.Email,
				"reason":   "username_or_email_exists",
			},
			Status: models.LogStatusFailed,
		})

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
		Role:          models.UserRoleUser,
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
		// 记录注册失败日志
		errMsg := err.Error()
		tasks.LogFromGinContext(c, tasks.LogEntry{
			Category:     models.LogCategorySecurity,
			Action:       "REGISTER_FAILED",
			ResourceType: models.ResourceTypeUser,
			ResourceID:   &newUser.UserID,
			Details: map[string]interface{}{
				"username": payload.Username,
				"email":    payload.Email,
				"reason":   "database_error",
			},
			Status:       models.LogStatusFailed,
			ErrorMessage: &errMsg,
		})

		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    501,
			"message": "System error",
		})
		return
	}

	// 记录注册成功日志
	tasks.LogFromGinContext(c, tasks.LogEntry{
		Category:     models.LogCategoryUser,
		Action:       "REGISTER",
		ResourceType: models.ResourceTypeUser,
		ResourceID:   &newUser.UserID,
		Details: map[string]interface{}{
			"username": payload.Username,
			"email":    payload.Email,
		},
		Status: models.LogStatusSuccess,
	})

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
	})
}

// GetClientConfig 获取客户端配置
func GetClientConfig(c *gin.Context) {

	ClientConfig := clientconfig.ClientConfig

	if ClientConfig.SystemName == "" {
		settings, err := clientconfig.LoadSystemSettings()
		if err != nil {
			settings = clientconfig.DefaultSettings
		}
		settings.UpdatedTime = time.Now().UTC()
		ClientConfig = settings
	}

	// 创建客户端配置
	clientConfig := map[string]interface{}{
		"systemName":    ClientConfig.SystemName,
		"systemLogo":    ClientConfig.SystemLogo,
		"systemFavicon": ClientConfig.SystemFavicon,
		"systemSlogan":  ClientConfig.SystemSlogan,
		"systemFooter":  ClientConfig.SystemFooter,

		"systemICP":             ClientConfig.SystemICP,
		"systemOrganization":    ClientConfig.SystemOrganization,
		"systemOrganizationURL": ClientConfig.SystemOrganizationURL,

		"themeColor":       ClientConfig.ThemeColor,
		"darkModeDefault":  ClientConfig.DarkModeDefault,
		"allowUserTheme":   ClientConfig.AllowUserTheme,
		"defaultLanguage":  ClientConfig.DefaultLanguage,
		"turnstileEnabled": ClientConfig.TurnstileEnabled,
		"turnstileSiteKey": ClientConfig.TurnstileSiteKey,

		// 品牌资源
		"FancyBackGroundIconWhite": ClientConfig.FancyBackGroundIconWhite,
		"FancyBackGroundIconBlack": ClientConfig.FancyBackGroundIconBlack,
		"DefaultBGImage":           ClientConfig.DefaultBGImage,
		"SVGIcon":                  ClientConfig.SVGIcon,
		"SVGAltData":               ClientConfig.SVGAltData,
		"TrophysGold":              ClientConfig.TrophysGold,
		"TrophysSilver":            ClientConfig.TrophysSilver,
		"TrophysBronze":            ClientConfig.TrophysBronze,
		"SchoolLogo":               ClientConfig.SchoolLogo,
		"SchoolSmallIcon":          ClientConfig.SchoolSmallIcon,
		"SchoolUnionAuthText":      ClientConfig.SchoolUnionAuthText,
		"BGAnimation":              ClientConfig.BGAnimation,

		"updateVersion": ClientConfig.UpdatedTime,
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": clientConfig,
	})
}
