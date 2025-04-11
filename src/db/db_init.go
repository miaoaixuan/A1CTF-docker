package db

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
)

func InitMyDB() {
	var existingUsers models.User
	if err := dbtool.DB().Where("username = ?", "root").Limit(1).Scan(&existingUsers).Error; err != nil {
		println("New db, start init....")

	} else {
		println("DB already initialized")
	}
}
