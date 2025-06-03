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

	// Use individual components like JS server
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	if port == "" {
		port = "5432"
	}

	// Build connection string with SSL like JS server
	dbURL := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
		host, port, user, password, dbname)

	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatal("Error connecting to database:", err)
	}

	// No output - match JS server (JS doesn't print connection message)
}

func GetDB() *sql.DB {
	return db
}