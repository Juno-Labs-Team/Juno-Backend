package main

import (
	"juno-backend/configs"
	"juno-backend/internal/database"
	"juno-backend/internal/routes"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load config
	cfg := configs.Load()

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:19006"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Initialize database
	database.InitDB(cfg)

	// Setup routes
	routes.SetupRoutes(r, cfg)

	// Start server
	log.Printf("🚀 Server running on port %s", cfg.Port)
	log.Printf("🔗 Google OAuth: http://localhost:%s/auth/google", cfg.Port)
	r.Run(":" + cfg.Port)
}
