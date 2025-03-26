package main

import (
	"log"
	"net/http"
	"regexp"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"a1ctf/src/controllers"
	"a1ctf/src/db/models"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/go-co-op/gocron/v2"
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
			UserID:   claims[identityKey].(string),
			UserName: claims["UserName"].(string),
			Role:     claims["Role"].(string),
		}
	}
}

func payloadFunc() func(data interface{}) jwt.MapClaims {
	return func(data interface{}) jwt.MapClaims {
		if v, ok := data.(*models.JWTUser); ok {
			return jwt.MapClaims{
				identityKey: v.UserID,
				"UserName":  v.UserName,
				"Role":      v.Role,
			}
		}
		return jwt.MapClaims{}
	}
}

var PermissionMap = map[string][]string{
	"/api/Login":                  {"ADMIN", "ADMIN2"},
	"/api/file/upload":            {},
	"/api/admin/challenge/list":   {"ADMIN"},
	"/api/admin/challenge/create": {"ADMIN"},
	"/api/admin/challenge/delete": {"ADMIN"},
	"/api/admin/challenge/get":    {"ADMIN"},
	"/api/admin/challenge/update": {"ADMIN"},
	"/api/admin/challenge/search": {"ADMIN"},

	"/api/admin/game/list":          {"ADMIN"},
	"/api/admin/game/create":        {"ADMIN"},
	"\\/api\\/admin\\/game/[\\d]$":  {"ADMIN"},
	"/api/admin/game/challenge/add": {"ADMIN"},
}

// Helper function to check if a slice contains a value
func contains(slice []string, value string) bool {
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

					if rules == nil {
						return false
					}

					if len(rules) == 0 {
						return true
					}

					if contains(rules, v.Role) {
						return true
					} else {
						return false
					}
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
			1*time.Second,
		),
		gocron.NewTask(
			func(a string, b int) {
				println(time.Time.String(time.Now()))
			},
			"hello",
			1,
		),
	)

	s.Start()
}

func main() {
	r := gin.Default()

	authMiddleware, err := jwt.New(initParams())
	if err != nil {
		log.Fatal("JWT Error:" + err.Error())
	}

	public := r.Group("/api")
	{
		public.POST("/auth/login", authMiddleware.LoginHandler)
		public.POST("/auth/register", controllers.Register)

		fileGroup := public.Group("/file")
		{
			fileGroup.GET("/download/:file_id", controllers.DownloadFile)
		}
	}

	auth := r.Group("/api")
	auth.Use(authMiddleware.MiddlewareFunc())
	{
		fileGroup := auth.Group("/file")
		{
			fileGroup.POST("/upload", controllers.UploadFile)
		}

		challengeGroup := auth.Group("/admin/challenge")
		{
			challengeGroup.POST("/list", controllers.ListChallenges)
			challengeGroup.POST("/create", controllers.CreateChallenge)
			challengeGroup.POST("/delete", controllers.DeleteChallenge)
			challengeGroup.POST("/get", controllers.GetChallenge)
			challengeGroup.POST("/update", controllers.UpdateChallenge)
			challengeGroup.POST("/search", controllers.SearchChallenges)
		}

		gameGroup := auth.Group("/admin/game")
		{
			gameGroup.POST("/list", controllers.ListGames)
			gameGroup.POST("/create", controllers.CreateGame)
			gameGroup.GET("/:game_id", controllers.GetGame)
			gameGroup.POST("/challenge/add", controllers.AddGameChallenge)
		}
	}

	// 未知接口
	r.NoRoute(authMiddleware.MiddlewareFunc(), handleNoRoute())

	// 任务线程
	// StartLoopEvent()

	log.Fatal(r.Run(":7777"))

	// k8stool.TestCreate()
}
