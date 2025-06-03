package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var db *sql.DB

func InitDB() {
    var err error
    
    // Use your existing Digital Ocean PostgreSQL connection
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        // Fallback to individual components
        host := os.Getenv("DB_HOST")
        port := os.Getenv("DB_PORT")
        user := os.Getenv("DB_USER")
        password := os.Getenv("DB_PASSWORD")
        dbname := os.Getenv("DB_NAME")
        
        if port == "" {
            port = "5432"
        }
        
        dbURL = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
            host, port, user, password, dbname)
    }

    db, err = sql.Open("postgres", dbURL)
    if err != nil {
        log.Fatal("Failed to open database connection:", err)
    }

    if err = db.Ping(); err != nil {
        log.Fatal("Failed to ping database:", err)
    }

    log.Println("Successfully connected to database")
}

func GetDB() *sql.DB {
    return db
}