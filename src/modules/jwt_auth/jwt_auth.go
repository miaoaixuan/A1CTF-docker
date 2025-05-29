package jwtauth

import (
	"a1ctf/src/db/models"
	clientconfig "a1ctf/src/modules/client_config"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/general"
	"a1ctf/src/utils/redis_tool"
	"a1ctf/src/utils/turnstile"
	"time"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
)

var (
	identityKey = "UserID"
)

func identityHandler() func(c *gin.Context) interface{} {
	return func(c *gin.Context) interface{} {
		claims := jwt.ExtractClaims(c)
		return &models.JWTUser{
			UserID:     claims[identityKey].(string),
			UserName:   claims["UserName"].(string),
			Role:       models.UserRole(claims["Role"].(string)),
			JWTVersion: claims["JWTVersion"].(string),
		}
	}
}

func payloadFunc() func(data interface{}) jwt.MapClaims {
	return func(data interface{}) jwt.MapClaims {
		if v, ok := data.(*models.JWTUser); ok {
			return jwt.MapClaims{
				identityKey:  v.UserID,
				"UserName":   v.UserName,
				"Role":       v.Role,
				"JWTVersion": v.JWTVersion,
			}
		}
		return jwt.MapClaims{}
	}
}

type PermissionSetting struct {
	RequestMethod []string
	Permissions   []models.UserRole
}

var PermissionMap = map[string]PermissionSetting{
	"/api/account/profile":        {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/file/upload":            {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},
	"/api/file/download/:file_id": {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/user/avatar/upload":     {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},
	"/api/team/avatar/upload":     {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},

	// 战队管理相关权限
	"/api/team/join":                       {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},
	"/api/team/:team_id/requests":          {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/team/request/:request_id/handle": {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},
	"/api/team/:team_id/transfer-captain":  {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},
	"/api/team/:team_id/member/:user_id":   {RequestMethod: []string{"DELETE"}, Permissions: []models.UserRole{}},
	"/api/team/:team_id":                   {RequestMethod: []string{"DELETE", "PUT"}, Permissions: []models.UserRole{}},

	"/api/admin/challenge/list":          {RequestMethod: []string{"GET", "POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/challenge/create":        {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/challenge/:challenge_id": {RequestMethod: []string{"GET", "PUT", "DELETE"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/challenge/search":        {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	"/api/admin/user/list":           {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/user/update":         {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/user/reset-password": {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/user/delete":         {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	"/api/admin/team/list":    {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/team/approve": {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/team/ban":     {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/team/unban":   {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/team/delete":  {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	"/api/admin/game/list":                             {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/game/create":                           {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/game/:game_id":                         {RequestMethod: []string{"GET", "POST", "PUT"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/game/:game_id/challenge/:challenge_id": {RequestMethod: []string{"PUT"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	"/api/game/list":                             {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/game/:game_id":                         {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/game/:game_id/challenges":              {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/game/:game_id/challenge/:challenge_id": {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/game/:game_id/notices":                 {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/game/:game_id/createTeam":              {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},
	"/api/game/:game_id/scoreboard":              {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/game/:game_id/container/:challenge_id": {RequestMethod: []string{"POST", "DELETE", "PATCH", "GET"}, Permissions: []models.UserRole{}},
	"/api/game/:game_id/flag/:challenge_id":      {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},
	"/api/hub":                                   {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	"/api/game/:game_id/flag/:judge_id":          {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},

	"/api/admin/container/list":   {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/container/delete": {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/container/extend": {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/container/flag":   {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	// 系统设置相关API权限
	"/api/admin/system/settings":  {RequestMethod: []string{"GET", "POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/system/upload":    {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/admin/system/test-smtp": {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	"/api/client-config":          {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
}

var RequestMethodMaskMap = map[string]uint64{
	"GET":     0b1,
	"POST":    0b10,
	"PUT":     0b100,
	"DELETE":  0b1000,
	"PATCH":   0b10000,
	"HEAD":    0b100000,
	"OPTIONS": 0b1000000,
	"CONNECT": 0b10000000,
	"TRACE":   0b100000000,
	"ANY":     0b111111111,
}

var UserRoleMaskMap = map[models.UserRole]uint64{
	models.UserRoleAdmin:   0b1,
	models.UserRoleUser:    0b10,
	models.UserRoleMonitor: 0b100,
}

type OptimizedPermissionSetting struct {
	RequestMethodMask uint64
	PermissionMask    uint64
}

// 掩码优化后的权限映射表
var OptimizedPermissionMap = map[string]OptimizedPermissionSetting{}

// 利用掩码优化权限映射表
func optimizePermissionMap() {
	for path, rules := range PermissionMap {
		requestMethodMask := uint64(0)
		for _, method := range rules.RequestMethod {
			requestMethodMask |= RequestMethodMaskMap[method]
		}

		permissionMask := uint64(0)
		for _, role := range rules.Permissions {
			permissionMask |= UserRoleMaskMap[role]
		}

		OptimizedPermissionMap[path] = OptimizedPermissionSetting{
			RequestMethodMask: requestMethodMask,
			PermissionMask:    permissionMask,
		}
	}
}

func authorizator() func(data interface{}, c *gin.Context) bool {
	return func(data interface{}, c *gin.Context) bool {
		if v, ok := data.(*models.JWTUser); ok {

			pathURL := c.FullPath()

			rules, ok := OptimizedPermissionMap[pathURL]
			if ok {

				requestMethodMask, ok := RequestMethodMaskMap[c.Request.Method]
				if !ok {
					return false
				}

				permissionMask, ok := UserRoleMaskMap[v.Role]
				if !ok {
					return false
				}

				// 检查请求方法
				if requestMethodMask&rules.RequestMethodMask == 0 {
					return false
				}

				// 检查权限
				if rules.PermissionMask != 0 && permissionMask&rules.PermissionMask == 0 {
					return false
				}

				var all_users map[string]models.User = make(map[string]models.User)

				if err := redis_tool.GetOrCacheSingleFlight("jwt_version_map", &all_users, func() (interface{}, error) {

					var tmpAllUsers map[string]models.User = make(map[string]models.User)
					var tmpUser []models.User
					if err := dbtool.DB().Find(&tmpUser).Error; err != nil {
						return nil, err
					}

					for _, user := range tmpUser {
						tmpAllUsers[user.UserID] = user
					}

					return tmpAllUsers, nil
				}, 1*time.Second, true); err != nil {
					return false
				}

				finalUser, ok := all_users[v.UserID]
				if !ok {
					return false
				}

				if finalUser.JWTVersion != v.JWTVersion {
					c.SetCookie("a1token", "", -1, "/", "", false, false)
					return false
				}

				return true
			}
		}
		return false
	}
}

func unauthorized() func(c *gin.Context, code int, message string) {
	return func(c *gin.Context, code int, message string) {
		c.JSON(code, gin.H{
			"code":    code,
			"message": message,
		})
	}
}

type LoginPayload struct {
	Username string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password" binding:"required"`
	CaptCha  string `form:"captcha" json:"captcha"`
}

func Login() func(c *gin.Context) (interface{}, error) {
	return func(c *gin.Context) (interface{}, error) {
		var loginVals LoginPayload
		if err := c.ShouldBind(&loginVals); err != nil {
			return "", jwt.ErrMissingLoginValues
		}

		if clientconfig.ClientConfig.TurnstileEnabled {
			turnstile := turnstile.New(clientconfig.ClientConfig.TurnstileSecretKey)
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

func initParams() *jwt.GinJWTMiddleware {

	return &jwt.GinJWTMiddleware{
		Realm:       "test zone",
		Key:         []byte("secret key"),
		Timeout:     time.Hour * 48,
		MaxRefresh:  time.Hour,
		IdentityKey: identityKey,
		PayloadFunc: payloadFunc(),

		SendCookie: true,
		CookieName: "a1token",

		IdentityHandler: identityHandler(),
		Authenticator:   Login(),
		Authorizator:    authorizator(),
		Unauthorized:    unauthorized(),
		TokenLookup:     "cookie:a1token",
		// TokenLookup: "query:token",
		// TokenLookup: "cookie:token",
		TokenHeadName: "Bearer",
		TimeFunc:      time.Now,
	}
}

var authMiddleware *jwt.GinJWTMiddleware

func InitJwtMiddleWare() *jwt.GinJWTMiddleware {
	optimizePermissionMap()
	tmpMiddleware, err := jwt.New(initParams())
	if err != nil {
		panic(err)
	}
	authMiddleware = tmpMiddleware
	return authMiddleware
}

func GetJwtMiddleWare() *jwt.GinJWTMiddleware {
	return authMiddleware
}
