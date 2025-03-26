package dbtool

import (
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	if db != nil {
		return db
	}

	dsn := os.Getenv("DSN")
	db_local, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	db = db_local

	return db
}
