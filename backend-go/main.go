package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }

    r := gin.Default()

    // CORS configuration
    r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:3000", "http://localhost:19006"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        AllowCredentials: true,
    }))

    // Initialize database
    InitDB()

    // Routes
    setupRoutes(r)

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    log.Printf("Server starting on port %s", port)
    r.Run(":" + port)
}

func setupRoutes(r *gin.Engine) {
    // Debug routes
    r.GET("/debug/db", handleDebugDB)

    // Auth routes
    auth := r.Group("/auth")
    {
        auth.GET("/google", handleGoogleLogin)
        auth.POST("/google/callback", handleGoogleCallback)
        auth.POST("/logout", handleLogout)
    }

    // Protected routes (add middleware later)
    api := r.Group("/api")
    {
        api.GET("/user", handleGetUser)
        api.POST("/rides", handleCreateRide)
        api.GET("/rides", handleGetRides)
    }
}