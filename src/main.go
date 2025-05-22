package main

import (
	"log"
	"net/http"
	"regexp"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"a1ctf/src/controllers"
	"a1ctf/src/db"
	"a1ctf/src/db/models"
	"a1ctf/src/jobs"
	"a1ctf/src/utils"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/redis_tool"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/go-co-op/gocron/v2"

	cache "github.com/chenyahui/gin-cache"
	"github.com/chenyahui/gin-cache/persist"
)

func Index(c *gin.Context) {

	dsn := "host=localhost user=postgres password=root dbname=a1ctf port=5000 sslmode=disable TimeZone=Asia/Shanghai"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	result := models.Challenge{}
	if db.First(&result).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Not Found",
		})
		return
	} else {
		c.JSON(http.StatusOK, gin.H{
			"message": result,
		})
	}
}

var (
	identityKey = "UserID"
)

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
		Authenticator:   controllers.Login(),
		Authorizator:    authorizator(),
		Unauthorized:    unauthorized(),
		TokenLookup:     "cookie:a1token",
		// TokenLookup: "query:token",
		// TokenLookup: "cookie:token",
		TokenHeadName: "Bearer",
		TimeFunc:      time.Now,
	}
}

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
	`^/api/Login$`:           {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/account/profile$`: {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	`^/api/file/upload$`:     {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},

	`^/api/admin/challenge/list$`:   {RequestMethod: []string{"GET", "POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/challenge/create$`: {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/challenge/\d+$`:    {RequestMethod: []string{"GET", "PUT", "DELETE"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/challenge/search$`: {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	`^/api/admin/user/list$`:           {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/user/update$`:         {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/user/reset-password$`: {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/user/delete$`:         {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	`^/api/admin/team/list$`:    {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/team/approve$`: {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/team/ban$`:     {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/team/unban$`:   {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/team/delete$`:  {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	`^/api/admin/game/list$`:              {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/game/create$`:            {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/game/\d+$`:               {RequestMethod: []string{"GET", "POST", "PUT"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/game/\d+/challenge/\d+$`: {RequestMethod: []string{"PUT"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	`^/api/game/list$`:              {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	`^/api/game/\d+$`:               {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	`^/api/game/\d+/challenges$`:    {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	`^/api/game/\d+/challenge/\d+$`: {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	`^/api/game/\d+/notices$`:       {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	`^/api/game/\d+/createTeam$`:    {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},
	`^/api/game/\d+/scoreboard$`:    {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	`^/api/game/\d+/container/\d+$`: {RequestMethod: []string{"POST", "DELETE", "PATCH", "GET"}, Permissions: []models.UserRole{}},
	`^/api/game/\d+/flag/\d+$`:      {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{}},
	`^/api/hub$`:                    {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
	`^/api/game/\d+/flag/[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$`: {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},

	`^/api/admin/container/list$`:   {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/container/delete$`: {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/container/extend$`: {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/container/flag$`:   {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{models.UserRoleAdmin}},

	// 系统设置相关API权限
	`^/api/admin/system/settings$`:  {RequestMethod: []string{"GET", "POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/system/upload$`:    {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/admin/system/test-smtp$`: {RequestMethod: []string{"POST"}, Permissions: []models.UserRole{models.UserRoleAdmin}},
	`^/api/client-config$`:          {RequestMethod: []string{"GET"}, Permissions: []models.UserRole{}},
}

// Helper function to check if a slice contains a value
func contains_role(slice []models.UserRole, value models.UserRole) bool {
	for _, item := range slice {
		if item == value {
			return true
		}
	}
	return false
}

func contains_str(slice []string, value string) bool {
	for _, item := range slice {
		if item == value {
			return true
		}
	}
	return false
}

func authorizator() func(data interface{}, c *gin.Context) bool {
	return func(data interface{}, c *gin.Context) bool {
		if v, ok := data.(*models.JWTUser); ok {

			for k, rules := range PermissionMap {
				match, _ := regexp.MatchString(k, c.Request.URL.Path)
				if match {
					// println(k, c.Request.URL.Path)

					// if len(rules.Permissions) ==  {
					// 	return false
					// }

					if !contains_str(rules.RequestMethod, c.Request.Method) {
						return false
					}

					if len(rules.Permissions) != 0 && !contains_role(rules.Permissions, v.Role) {
						return false
					}

					var all_users []models.User

					if err := redis_tool.GetOrCache("user_list", &all_users, func() (interface{}, error) {
						if err := dbtool.DB().Find(&all_users).Error; err != nil {
							return nil, err
						}

						return all_users, nil
					}, 1*time.Second, true); err != nil {
						return false
					}

					var valid = false
					var finalUser models.User

					for _, user := range all_users {
						if user.UserID == v.UserID && user.JWTVersion == v.JWTVersion {
							valid = true
							finalUser = user
							break
						}
					}

					if !valid {
						return false
					}

					if finalUser.JWTVersion != v.JWTVersion {
						c.SetCookie("a1token", "", -1, "/", "", false, false)
						return false
					}

					return true
				}
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

func handleNoRoute() func(c *gin.Context) {
	return func(c *gin.Context) {
		claims := jwt.ExtractClaims(c)
		log.Printf("NoRoute claims: %#v\n", claims)
		c.JSON(404, gin.H{"code": "404", "message": "Page not found"})
	}
}

func StartLoopEvent() {
	s, _ := gocron.NewScheduler()
	s.NewJob(
		gocron.DurationJob(
			2*time.Second,
		),
		gocron.NewTask(
			jobs.UpdateActivateGameScore,
		),
		gocron.WithSingletonMode(gocron.LimitModeWait),
	)

	s.NewJob(
		gocron.DurationJob(
			5*time.Second,
		),
		gocron.NewTask(
			jobs.UpdateActiveGameScoreBoard,
		),
		gocron.WithSingletonMode(gocron.LimitModeWait),
	)

	s.NewJob(
		gocron.DurationJob(
			2*time.Second,
		),
		gocron.NewTask(
			jobs.ContainerOperationsJob,
		),
		gocron.WithSingletonMode(gocron.LimitModeWait),
	)

	s.NewJob(
		gocron.DurationJob(
			1*time.Second,
		),
		gocron.NewTask(
			jobs.FlagJudgeJob,
		),
		gocron.WithSingletonMode(gocron.LimitModeWait),
	)

	s.Start()
}

func main() {
	// 加载配置文件
	utils.LoadConfig()

	// 初始化数据库连接
	dbtool.Init()

	// 初始化 db
	db.InitDB()

	// 加载配置文件
	controllers.LoadSystemSettings()

	// db_init.InitMyDB()

	memoryStore := persist.NewMemoryStore(1 * time.Minute)

	// cacheByCookieURI := cache.Cache(
	// 	memoryStore,
	// 	1*time.Second,
	// 	cache.WithCacheStrategyByRequest(func(c *gin.Context) (bool, cache.Strategy) {
	// 		cookie, err := c.Cookie("a1token")
	// 		req_path := c.Request.URL.Path
	// 		if err != nil {
	// 			return false, cache.Strategy{}
	// 		} else {
	// 			return true, cache.Strategy{
	// 				CacheKey: cookie + req_path,
	// 			}
	// 		}
	// 	}),
	// )

	// r := gin.Default()

	// 关闭日志输出
	r := gin.New()

	r.Use(gzip.Gzip(gzip.DefaultCompression))

	authMiddleware, err := jwt.New(initParams())
	if err != nil {
		log.Fatal("JWT Error:" + err.Error())
	}

	public := r.Group("/api")
	{
		public.POST("/auth/login", authMiddleware.LoginHandler)
		public.POST("/auth/register", controllers.Register)

		public.GET("/game/list", cache.CacheByRequestURI(memoryStore, 1*time.Second), controllers.UserListGames)
		public.GET("/game/:game_id/scoreboard", cache.CacheByRequestURI(memoryStore, 1*time.Second), controllers.GameStatusMiddleware(true, false), controllers.UserGameGetScoreBoard)

		fileGroup := public.Group("/file")
		{
			fileGroup.GET("/download/:file_id", controllers.DownloadFile)
		}

		public.GET("/client-config", controllers.GetClientConfig)
	}

	auth := r.Group("/api")
	auth.Use(authMiddleware.MiddlewareFunc())
	{
		fileGroup := auth.Group("/file")
		{
			fileGroup.POST("/upload", controllers.UploadFile)
		}

		// 添加账户相关接口
		accountGroup := auth.Group("/account")
		{
			accountGroup.GET("/profile", controllers.GetProfile)
		}

		challengeGroup := auth.Group("/admin/challenge")
		{
			challengeGroup.POST("/list", controllers.AdminListChallenges)

			challengeGroup.POST("/create", controllers.AdminCreateChallenge)
			challengeGroup.DELETE("/:challenge_id", controllers.AdminDeleteChallenge)
			challengeGroup.GET("/:challenge_id", controllers.AdminGetChallenge)
			challengeGroup.PUT("/:challenge_id", controllers.AdminUpdateChallenge)

			challengeGroup.POST("/search", controllers.AdminSearchChallenges)
		}

		userGroup := auth.Group("/admin/user")
		{
			userGroup.POST("/list", controllers.AdminListUsers)
			userGroup.POST("/update", controllers.AdminUpdateUser)
			userGroup.POST("/reset-password", controllers.AdminResetUserPassword)
			userGroup.POST("/delete", controllers.AdminDeleteUser)
		}

		teamGroup := auth.Group("/admin/team")
		{
			teamGroup.POST("/list", controllers.AdminListTeams)
			teamGroup.POST("/approve", controllers.AdminApproveTeam)
			teamGroup.POST("/ban", controllers.AdminBanTeam)
			teamGroup.POST("/unban", controllers.AdminUnbanTeam)
			teamGroup.POST("/delete", controllers.AdminDeleteTeam)
		}

		gameGroup := auth.Group("/admin/game")
		{
			gameGroup.POST("/list", controllers.AdminListGames)
			gameGroup.POST("/create", controllers.AdminCreateGame)
			gameGroup.GET("/:game_id", controllers.AdminGetGame)
			gameGroup.PUT("/:game_id/challenge/:challenge_id", controllers.AdminAddGameChallenge)
			gameGroup.PUT("/:game_id", controllers.AdminUpdateGame)
		}

		// 用户相关接口
		userGameGroup := auth.Group("/game")
		{
			// 中间件检查比赛状态
			userGameGroup.GET("/:game_id", controllers.GameStatusMiddleware(true, true), controllers.UserGetGameDetailWithTeamInfo)

			userGameGroup.GET("/:game_id/challenges", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGetGameChallenges)

			// 查询比赛中的某道题
			userGameGroup.GET("/:game_id/challenge/:challenge_id", cache.CacheByRequestURI(memoryStore, 1*time.Second), controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGetGameChallenge)

			// 比赛通知接口
			userGameGroup.GET("/:game_id/notices", cache.CacheByRequestURI(memoryStore, 1*time.Second), controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGetGameNotices)

			// 创建比赛队伍
			userGameGroup.POST("/:game_id/createTeam", controllers.GameStatusMiddleware(false, true), controllers.UserCreateGameTeam)

			// 题目容器
			userGameGroup.POST("/:game_id/container/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserCreateGameContainer)
			userGameGroup.DELETE("/:game_id/container/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserCloseGameContainer)
			userGameGroup.PATCH("/:game_id/container/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserExtendGameContainer)
			userGameGroup.GET("/:game_id/container/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGetGameChallengeContainerInfo)

			// 提交 Flag
			userGameGroup.POST("/:game_id/flag/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGameChallengeSubmitFlag)
			userGameGroup.GET("/:game_id/flag/:judge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGameGetJudgeResult)
		}

		auth.GET("/hub", func(c *gin.Context) {
			// 在升级为WebSocket前获取查询参数
			gameID := c.Query("game")
			if gameID == "" {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "game parameter is required"})
				return
			}

			// 处理WebSocket连接
			dbtool.Melody().HandleRequestWithKeys(c.Writer, c.Request, map[string]interface{}{
				"gameID": gameID,
			})
		})

		containerGroup := auth.Group("/admin/container")
		{
			containerGroup.POST("/list", controllers.AdminListContainers)
			containerGroup.POST("/delete", controllers.AdminDeleteContainer)
			containerGroup.POST("/extend", controllers.AdminExtendContainer)
			containerGroup.GET("/flag", controllers.AdminGetContainerFlag)
		}

		// 系统设置相关API
		systemGroup := auth.Group("/admin/system")
		{
			systemGroup.GET("/settings", controllers.GetSystemSettings)
			systemGroup.POST("/settings", controllers.UpdateSystemSettings)
			systemGroup.POST("/upload", controllers.UploadSystemFile)
			systemGroup.POST("/test-smtp", controllers.TestSMTPSettings)
		}
	}

	// 未知接口
	// r.NoRoute(authMiddleware.MiddlewareFunc(), handleNoRoute())

	r.Static("/assets", "./clientapp/build/client/assets")
	r.Static("/favicon.ico", "./clientapp/build/client/favicon.ico")
	r.Static("/images", "./clientapp/build/client/images")
	r.Static("/locales", "./clientapp/build/client/locales")
	r.NoRoute(func(c *gin.Context) {
		c.File("./clientapp/build/client/index.html")
	})

	// 任务线程
	StartLoopEvent()

	log.Fatal(r.Run(":7777"))

	// k8stool.TestCreate()
}
