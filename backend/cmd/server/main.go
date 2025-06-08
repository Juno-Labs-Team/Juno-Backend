package main

import (
	"juno-backend/configs"
	"juno-backend/internal/database"
	"juno-backend/internal/routes"
	"log"
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

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8080" // Digital Ocean default
	}

	log.Printf("🚀 Server running on port %s", port)
	log.Printf("🔗 Google OAuth: https://juno-backend-6eamg.ondigitalocean.app/auth/google")
	r.Run(":" + port)
}
