package dbtool

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	if db != nil {
		return db
	}

	dsn := "host=localhost user=postgres password=root dbname=a1ctf port=5000 sslmode=disable TimeZone=Asia/Shanghai"
	db_local, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	db = db_local

	return db
}
