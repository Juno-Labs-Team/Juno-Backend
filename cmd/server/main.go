package main

import (
	"juno-backend/configs"
	"juno-backend/internal/auth"
	"juno-backend/internal/database"
	"juno-backend/internal/routes"
	"log"
	"os"
)

func main() {
	log.Printf("🚗 Starting Juno Backend - Clean Build v2")

	// Load your existing .env configuration
	cfg := configs.Load()
	log.Printf("✅ Configuration loaded")

	// Connect to your existing Cloud SQL database
	database.InitDB(cfg)
	log.Printf("✅ Database connected")

	// Initialize OAuth configuration
	auth.InitOAuth(cfg)
	log.Printf("✅ OAuth initialized")

	// Setup clean routes
	router := routes.SetupRoutes(cfg)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	if os.Getenv("K_SERVICE") != "" {
		log.Printf("🔗 change the production URL")
		log.Printf("🔐 change OAUTH (IMMEDIATELY)")
	} else {
		log.Printf("🔗 Local URL: http://localhost:%s", port)
		log.Printf("🔐 OAuth URL: http://localhost:%s/auth/google", port)
	}

	router.Run(":" + port)
}
