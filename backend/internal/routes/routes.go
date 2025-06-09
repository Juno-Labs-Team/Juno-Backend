package routes

import (
	"juno-backend/configs"
	"juno-backend/internal/api"
	"juno-backend/internal/auth"
	"juno-backend/internal/middleware"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(cfg *configs.Config) *gin.Engine {
	r := gin.Default()

	// CORS configuration for your frontend
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Will restrict this later
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		AllowCredentials: true,
	}))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "juno-backend",
			"message": "🚗 Juno Backend is running!",
		})
	})

	// Auth routes (OAuth + JWT) - No auth required
	authGroup := r.Group("/auth")
	{
		authGroup.GET("/google", auth.GoogleLogin(cfg))
		authGroup.GET("/google/callback", auth.GoogleCallback(cfg))
		authGroup.GET("/me", auth.GetCurrentUser)
	}

	// Protected API routes - Auth required
	apiGroup := r.Group("/api")
	apiGroup.Use(middleware.AuthRequired(cfg.JWTSecret))
	{
		// Profile endpoints
		apiGroup.GET("/profile", api.GetProfile)
		apiGroup.PUT("/profile", api.UpdateProfile)

		// Friend endpoints
		apiGroup.GET("/friends", api.GetFriends)
		apiGroup.POST("/friends", api.AddFriend)

		// Ride endpoints
		apiGroup.GET("/rides", api.GetRides)
		apiGroup.POST("/rides", api.CreateRide)
	}

	return r
}
