package database

import (
	"database/sql"
	"fmt"
	"juno-backend/configs"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB(cfg *configs.Config) {
	var err error
	var dbURL string
	// Check if running on Google Cloud Run
	if os.Getenv("K_SERVICE") != "" {
		// Use Unix socket for Cloud SQL Proxy connection
		socketPath := fmt.Sprintf("/cloudsql/%s/.s.PGSQL.5432", cfg.DBHost)
		dbURL = fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=disable",
			socketPath, // Full socket path for Cloud SQL
			cfg.DBUser,
			cfg.DBPassword,
			cfg.DBName)
		log.Printf("🔗 Using Cloud SQL socket: %s", socketPath)
	} else {
		// Use TCP connection for local development with Cloud SQL
		dbURL = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
			cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)
		log.Printf("🔗 Using TCP connection to: %s:%s", cfg.DBHost, cfg.DBPort)
	}

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
