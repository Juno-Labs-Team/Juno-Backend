package main

import (
	"juno-backend/configs"
	"juno-backend/internal/database"
	"juno-backend/internal/routes"
	"log"
	"os"
)

func main() {
	// Load config
	cfg := configs.Load()

	// Initialize database
	log.Printf("🔌 Initializing database...")
	database.InitDB(cfg)

	// Setup routes (this now includes CORS and OAuth initialization)
	log.Printf("🛣️ Setting up routes...")
	r := routes.SetupRoutes(cfg)

	// Determine port
	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.Port
		if port == "" {
			port = "8080"
		}
	}

	log.Printf("🚀 Server running on port %s", port)

	// Log different URLs based on environment
	if os.Getenv("K_SERVICE") != "" {
		log.Printf("🌐 Running on Google Cloud Run")
		log.Printf("🔗 OAuth URL: https://[your-service-url]/auth/google")
	} else {
		log.Printf("🔗 OAuth URL: http://localhost:%s/auth/google", port)
	}

	r.Run(":" + port)
}
