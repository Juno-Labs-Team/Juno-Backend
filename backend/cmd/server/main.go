package main

import (
	"juno-backend/configs"
	"juno-backend/internal/database"
	"juno-backend/internal/routes"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load config
	cfg := configs.Load()

	// Set Gin mode based on environment
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS configuration - allow your frontend domains
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:19006", "https://yourdomain.com"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Initialize database
	database.InitDB(cfg)

	// Setup routes
	routes.SetupRoutes(r, cfg)

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8080" // Digital Ocean default
	}

	log.Printf("🚀 Server running on port %s", port)
	log.Printf("🔗 Google OAuth: http://localhost:%s/auth/google", port)
	r.Run(":" + port)
}
