package dbtool

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

func DB() *gorm.DB {
	if db != nil {
		return db
	}

	_ = logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // 使用标准输出
		logger.Config{
			SlowThreshold:             time.Second, // 慢查询阈值（例如 1 秒）
			LogLevel:                  logger.Info, // 日志级别设为 Info，记录所有 SQL
			IgnoreRecordNotFoundError: true,        // 忽略 "记录未找到" 错误
			Colorful:                  true,        // 启用彩色日志（可选）
		},
	)

	dsn := os.Getenv("DSN")
	db_local, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		// Logger: newLogger, // 设置自定义 Logger
	})
	if err != nil {
		panic(err)
	}

	db = db_local

	return db
}
