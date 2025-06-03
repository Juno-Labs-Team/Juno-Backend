package database

import (
	"database/sql"
	"fmt"
	"juno-backend/configs"
	"log"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB(cfg *configs.Config) {
	var err error

	dbURL := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)

	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}

	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)

	if err = DB.Ping(); err != nil {
		log.Fatal("Error pinging database:", err)
	}

	log.Println("✅ Connected to PostgreSQL database")
}

func GetDB() *sql.DB {
	return DB
}
