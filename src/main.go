package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"a1ctf/src/controllers"
	"a1ctf/src/db"
	"a1ctf/src/jobs"
	clientconfig "a1ctf/src/modules/client_config"
	jwtauth "a1ctf/src/modules/jwt_auth"
	"a1ctf/src/modules/monitoring"
	"a1ctf/src/tasks"
	"a1ctf/src/utils"
	dbtool "a1ctf/src/utils/db_tool"
	k8stool "a1ctf/src/utils/k8s_tool"
	"a1ctf/src/utils/ristretto_tool"

	"github.com/gin-contrib/pprof"
	"github.com/gin-gonic/gin"
	"github.com/go-co-op/gocron/v2"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/viper"
	"golang.org/x/time/rate"

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
			viper.GetDuration("job-intervals.container-updating"),
		),
		gocron.NewTask(
			jobs.UpdateLivingContainers,
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

func RateLimiter(rateLimit int, rateInterval time.Duration) gin.HandlerFunc {
	limiter := rate.NewLimiter(rate.Every(rateInterval), rateLimit)

	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"message": "Too many requests, please try again later",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

func main() {

	// 加载配置文件
	utils.LoadConfig()
	k8stool.InitNodeAddressMap()

	// 初始化数据库连接
	dbtool.Init()

	// 初始化缓存池
	ristretto_tool.LoadCacheTime()
	ristretto_tool.InitCachePool()

	defer ristretto_tool.CloseCachePool()

	// 初始化 db
	db.InitDB()

	// 加载配置文件
	clientconfig.LoadSystemSettings()

	// 初始化系统监控
	if viper.GetBool("monitoring.enabled") {
		systemMonitor := monitoring.NewSystemMonitor(viper.GetDuration("monitoring.system-monitor-interval"))
		systemMonitor.Start()
		defer systemMonitor.Stop()
	}

	tasks.InitTaskQueue()

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

	// // 启动 Gzip 压缩
	// if viper.GetBool("system.gin-gzip-enabled") {
	// 	r.Use(gzip.Gzip(gzip.DefaultCompression))
	// }

	// JWT 鉴权中间件
	authMiddleware := jwtauth.InitJwtMiddleWare()

	// 公共接口
	public := r.Group("/api")
	{
		public.POST("/auth/login", authMiddleware.LoginHandler)
		public.POST("/auth/register", controllers.Register)

		public.GET("/game/list", cache.CacheByRequestURI(memoryStore, 1*time.Second), controllers.UserListGames)
		public.GET("/game/:game_id/scoreboard", controllers.GameStatusMiddleware(true, false), controllers.UserGameGetScoreBoard)

		public.GET("/game/:game_id", controllers.GameStatusMiddleware(true, false), controllers.UserGetGameDetailWithTeamInfo)

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

		// 团队管理接口
		teamManageGroup := auth.Group("/team")
		{
			teamManageGroup.POST("/join", controllers.TeamJoinRequest)
			teamManageGroup.GET("/:team_id/requests", controllers.GetTeamJoinRequests)
			teamManageGroup.POST("/request/:request_id/handle", controllers.HandleTeamJoinRequest)
			teamManageGroup.POST("/:team_id/transfer-captain", controllers.TransferTeamCaptain)
			teamManageGroup.DELETE("/:team_id/member/:user_id", controllers.RemoveTeamMember)
			teamManageGroup.DELETE("/:team_id", controllers.DeleteTeam)
			teamManageGroup.PUT("/:team_id", controllers.UpdateTeamInfo)
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

			gameGroup.POST("/:game_id/submits", controllers.AdminGetSubmits)

			// 比赛海报上传路由
			gameGroup.POST("/:game_id/poster/upload", controllers.AdminUploadGamePoster)

			// 分组管理路由
			gameGroup.GET("/:game_id/groups", controllers.AdminGetGameGroups)
			gameGroup.POST("/:game_id/groups", controllers.AdminCreateGameGroup)
			gameGroup.PUT("/:game_id/groups/:group_id", controllers.AdminUpdateGameGroup)
			gameGroup.DELETE("/:game_id/groups/:group_id", controllers.AdminDeleteGameGroup)

			// 公告管理路由
			gameGroup.POST("/:game_id/notices", controllers.AdminCreateNotice)
			gameGroup.POST("/:game_id/notices/list", controllers.AdminListNotices)
			gameGroup.DELETE("/notices", controllers.AdminDeleteNotice)

			// 分数修正管理路由
			gameGroup.GET("/:game_id/score-adjustments", controllers.AdminGetGameScoreAdjustments)
			gameGroup.POST("/:game_id/score-adjustments", controllers.AdminCreateScoreAdjustment)
			gameGroup.PUT("/:game_id/score-adjustments/:adjustment_id", controllers.AdminUpdateScoreAdjustment)
			gameGroup.DELETE("/:game_id/score-adjustments/:adjustment_id", controllers.AdminDeleteScoreAdjustment)

			// 题目解题记录管理路由
			gameGroup.POST("/:game_id/challenge/:challenge_id/solves/delete", controllers.AdminDeleteChallengeSolves)
		}

		// 用户相关接口
		userGameGroup := auth.Group("/game")
		{
			userGameGroup.GET("/:game_id/challenges", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGetGameChallenges)

			// 查询比赛中的某道题
			userGameGroup.GET("/:game_id/challenge/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGetGameChallenge)

			// 比赛通知接口
			userGameGroup.GET("/:game_id/notices", cache.CacheByRequestURI(memoryStore, 1*time.Second), controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGetGameNotices)

			// 用户获取分组列表（公开接口，用于创建团队时选择分组）
			userGameGroup.GET("/:game_id/groups", controllers.GameStatusMiddleware(true, false), controllers.UserGetGameGroups)

			// 创建比赛队伍
			userGameGroup.POST("/:game_id/createTeam", controllers.GameStatusMiddleware(false, true), controllers.UserCreateGameTeam)

			// 题目容器
			userGameGroup.POST("/:game_id/container/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserCreateGameContainer)
			userGameGroup.DELETE("/:game_id/container/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserCloseGameContainer)
			userGameGroup.PATCH("/:game_id/container/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserExtendGameContainer)
			userGameGroup.GET("/:game_id/container/:challenge_id", controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGetGameChallengeContainerInfo)

			// 提交 Flag
			userGameGroup.POST("/:game_id/flag/:challenge_id", RateLimiter(100, 1*time.Second), controllers.GameStatusMiddleware(false, true), controllers.TeamStatusMiddleware(), controllers.UserGameChallengeSubmitFlag)
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

			systemGroup.GET("/logs", controllers.GetSystemLogs)
			systemGroup.GET("/logs/stats", controllers.GetSystemLogStats)
		}
	}

	// 未知接口
	// r.NoRoute(authMiddleware.MiddlewareFunc(), handleNoRoute())

	r.Static("/assets", "./clientapp/assets")
	r.Static("/favicon.ico", "./clientapp/favicon.ico")
	r.Static("/images", "./clientapp/images")
	r.Static("/locales", "./clientapp/locales")
	r.NoRoute(func(c *gin.Context) {
		c.File("./clientapp/index.html")
	})

	// 任务线程
	StartLoopEvent()

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:    fmt.Sprintf("%s:%s", viper.GetString("system.gin-host"), viper.GetString("system.gin-port")),
		Handler: r,
	}

	// 在独立的goroutine中启动服务器
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("Server started on %s", srv.Addr)

	// 等待中断信号以优雅地关闭服务器
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	tasks.CloseTaskQueue()

	// 设置关闭超时时间
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 关闭缓存
	ristretto_tool.CloseCachePool()

	// 关闭HTTP服务器
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}
