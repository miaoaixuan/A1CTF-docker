package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"a1ctf/src/controllers"
	"a1ctf/src/db"
	"a1ctf/src/jobs"
	jwtauth "a1ctf/src/modules/jwt_auth"
	"a1ctf/src/modules/monitoring"
	"a1ctf/src/utils"
	dbtool "a1ctf/src/utils/db_tool"

	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/pprof"
	"github.com/gin-gonic/gin"
	"github.com/go-co-op/gocron/v2"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/viper"

	cache "github.com/chenyahui/gin-cache"
	"github.com/chenyahui/gin-cache/persist"
)

func StartLoopEvent() {
	s, _ := gocron.NewScheduler()
	s.NewJob(
		gocron.DurationJob(
			viper.GetDuration("job-intervals.update-activate-game-score"),
		),
		gocron.NewTask(
			jobs.UpdateActivateGameScore,
		),
		gocron.WithSingletonMode(gocron.LimitModeWait),
	)

	s.NewJob(
		gocron.DurationJob(
			viper.GetDuration("job-intervals.update-active-game-score-board"),
		),
		gocron.NewTask(
			jobs.UpdateActiveGameScoreBoard,
		),
		gocron.WithSingletonMode(gocron.LimitModeWait),
	)

	s.NewJob(
		gocron.DurationJob(
			viper.GetDuration("job-intervals.container-operations"),
		),
		gocron.NewTask(
			jobs.ContainerOperationsJob,
		),
		gocron.WithSingletonMode(gocron.LimitModeWait),
	)

	s.NewJob(
		gocron.DurationJob(
			viper.GetDuration("job-intervals.flag-judge"),
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

	// 初始化系统监控
	if viper.GetBool("monitoring.enabled") {
		systemMonitor := monitoring.NewSystemMonitor(viper.GetDuration("monitoring.system-monitor-interval"))
		systemMonitor.Start()
		defer systemMonitor.Stop()
	}

	memoryStore := persist.NewMemoryStore(1 * time.Minute)

	// 关闭日志输出
	r := gin.New()
	// r := gin.Default()

	// 设置 Trusted Proxies
	if len(viper.GetStringSlice("system.trusted-proxies")) > 0 {
		if viper.GetBool("system.forwarded-by-client-ip") && len(viper.GetStringSlice("system.remote-ip-headers")) > 0 {
			r.ForwardedByClientIP = viper.GetBool("system.forwarded-by-client-ip")
			r.RemoteIPHeaders = viper.GetStringSlice("system.remote-ip-headers")
		} else {
			log.Fatalf("No remote ip headers set, using default. If you are using a reverse proxy, please set the remote ip headers in the config file.")
		}
		r.SetTrustedProxies(viper.GetStringSlice("system.trusted-proxies"))
	} else {
		log.Printf("No trusted proxies set, using default. If you are using a reverse proxy, please set the trusted proxies in the config file.")
	}

	pprof.Register(r)

	// 启动 Gin 框架性能监控
	if viper.GetBool("monitoring.enabled") {
		r.Use(monitoring.GinPrometheusMiddleware())
	}

	// 启动性能监控
	http.Handle("/metrics", promhttp.Handler())
	go http.ListenAndServe(fmt.Sprintf("%s:%s", viper.GetString("system.prometheus-host"), viper.GetString("system.prometheus-port")), nil)

	// 启动 Gzip 压缩
	if viper.GetBool("system.gin-gzip-enabled") {
		r.Use(gzip.Gzip(gzip.DefaultCompression))
	}

	// JWT 鉴权中间件
	authMiddleware := jwtauth.GetJwtMiddleware()

	// 公共接口
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

	// 鉴权接口
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

		// 用户头像上传接口
		userAvatarGroup := auth.Group("/user")
		{
			userAvatarGroup.POST("/avatar/upload", controllers.UploadUserAvatar)
		}

		// 团队头像上传接口
		teamAvatarGroup := auth.Group("/team")
		{
			teamAvatarGroup.POST("/avatar/upload", controllers.UploadTeamAvatar)
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

	log.Fatal(r.Run(fmt.Sprintf("%s:%s", viper.GetString("system.gin-host"), viper.GetString("system.gin-port"))))

	// k8stool.TestCreate()
}
