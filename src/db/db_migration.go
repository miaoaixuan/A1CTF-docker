package db

import (
	dbtool "a1ctf/src/utils/db_tool"
	"database/sql"
	"fmt"
	"log"

	"github.com/pressly/goose/v3"
)

func getDBVersion(db *sql.DB) (int, error) {
	var dbVersion int
	err := db.QueryRow("SELECT version_id FROM goose_db_version ORDER BY version_id DESC LIMIT 1").Scan(&dbVersion)
	if err != nil {
		return -1, fmt.Errorf("failed to get DB version: %v", err)
	}
	return dbVersion, nil

}

func InitDB() {
	db, err := dbtool.DB().DB()
	if err != nil {
		log.Fatalf("goose: failed to open DB: %v", err)
	}

	version, err := getDBVersion(db)
	if err != nil {
		log.Fatalf("goose: failed to get DB version: %v", err)
	}
	println("Current DB version:", version, goose.MaxVersion)
}
