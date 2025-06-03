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
		// Suppress warning for now
	}

	// Set Gin to release mode to reduce warnings
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
	InitDB()

	// Routes to match JS server exactly
	setupRoutes(r)
	
	// Debug: Print registered routes
	for _, route := range r.Routes() {
		log.Printf("Route registered: %s %s", route.Method, route.Path)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000" // Match JS server default
	}

	// Match JS server output exactly
	log.Printf("🚀 Server running on port %s", port)
	r.Run(":" + port)
}

func setupRoutes(r *gin.Engine) {
	// Root route - match JS server exactly
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "API is on"})
	})

	// Debug route - match JS server format
	r.GET("/debug/db", handleDebugDB)

	// Auth routes - match JS server structure
	auth := r.Group("/auth")
	{
		auth.GET("/google", handleGoogleLogin)
		auth.GET("/google/callback", handleGoogleCallback) // GET route like JS
		auth.POST("/logout", handleLogout)
	}
}