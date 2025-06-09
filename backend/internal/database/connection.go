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
		// Production: Use Unix socket for Cloud SQL
		dbURL = fmt.Sprintf("host=/cloudsql/juno-rideshare-461800:us-east4:juno-production-db user=%s password=%s dbname=%s sslmode=disable",
			cfg.DBUser, cfg.DBPassword, cfg.DBName)
		log.Printf("🔗 Using Cloud SQL socket (production)")
	} else {
		// Local development: Use direct IP from .env file
		dbURL = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
			cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName)
		log.Printf("🔗 Using direct IP: %s:%s", cfg.DBHost, cfg.DBPort)
	}

	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// Set connection pool settings
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)

	if err = DB.Ping(); err != nil {
		log.Fatalf("❌ Failed to ping database: %v", err)
	}

	log.Printf("✅ Database connected successfully")
}

func GetDB() *sql.DB {
	return DB
}
