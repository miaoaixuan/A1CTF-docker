package dbtool

import (
	"a1ctf/src/modules/monitoring"
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/go-redis/redis"
	"github.com/olahol/melody"
	"github.com/spf13/viper"
)

var db *gorm.DB
var redis_instance *redis.Client
var ml *melody.Melody
var gameSessions map[*melody.Session]int64 = make(map[*melody.Session]int64)
var ctx = context.Background()

func DB() *gorm.DB {
	return db
}

func Melody() *melody.Melody {
	return ml
}

func Redis() *redis.Client {
	return redis_instance
}

func Context() context.Context {
	return ctx
}

func Init() {

	// Init DB

	_ = logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // 使用标准输出
		logger.Config{
			SlowThreshold:             time.Second, // 慢查询阈值（例如 1 秒）
			LogLevel:                  logger.Info, // 日志级别设为 Info，记录所有 SQL
			IgnoreRecordNotFoundError: true,        // 忽略 "记录未找到" 错误
			Colorful:                  true,        // 启用彩色日志（可选）
		},
	)

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		viper.GetString("postgres.host"),
		viper.GetString("postgres.user"),
		viper.GetString("postgres.password"),
		viper.GetString("postgres.dbname"),
		viper.GetString("postgres.port"),
		viper.GetString("postgres.sslmode"))
	db_local, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		// Logger: newLogger, // 设置自定义 Logger
	})
	if err != nil {
		panic(err)
	}

	if viper.GetBool("monitoring.enabled") {
		prometheusPlugin := &monitoring.PrometheusPlugin{
			SlowThreshold: viper.GetDuration("monitoring.gorm-slow-query-threshold"), // 慢查询阈值
		}

		if err := db_local.Use(prometheusPlugin); err != nil {
			panic(err)
		}
	}

	db = db_local

	// Init melody
	ml = melody.New()

	gameSessions = make(map[*melody.Session]int64)

	ml.HandleConnect(func(s *melody.Session) {
		// 从会话keys中获取gameID
		gameIDStr, exists := s.Get("gameID")
		if !exists {
			s.Close()
			return
		}

		gameID, err := strconv.ParseInt(gameIDStr.(string), 10, 64)
		if err != nil {
			s.Close()
			return
		}

		gameSessions[s] = gameID

		s.Write([]byte("{ \"status\": \"connected\" }"))
	})

	ml.HandleClose(func(s *melody.Session, i int, s2 string) error {
		delete(gameSessions, s)
		return nil
	})

	redis_instance = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", viper.GetString("redis.host"), viper.GetString("redis.port")),
		Password: viper.GetString("redis.password"),
		DB:       viper.GetInt("redis.db"),
	})

	_, err = redis_instance.Ping().Result()
	if err != nil {
		log.Fatalf("Connect to redis failed: %v", err)
	}
}

func GameSessions() map[*melody.Session]int64 {
	return gameSessions
}
