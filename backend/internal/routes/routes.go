package routes

import (
	"juno-backend/configs"
	"juno-backend/internal/api"
	"juno-backend/internal/auth"
	"juno-backend/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(cfg *configs.Config) *gin.Engine {
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"*"},
		AllowCredentials: true,
	}))

	// Health check endpoint (no auth required)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "juno-backend",
			"message": "🚗 Juno Backend is running!",
		})
	})

	// Initialize OAuth before setting up routes
	auth.InitOAuth(cfg)

	// OAuth routes (no auth required) - Fix function calls by passing cfg
	r.GET("/auth/google", auth.GoogleLogin(cfg))
	r.GET("/auth/google/callback", auth.GoogleCallback(cfg))

	// Protected routes (require JWT)
	protected := r.Group("/")
	protected.Use(middleware.JWTAuthMiddleware())
	{
		// Auth endpoints
		protected.GET("/auth/me", auth.GetCurrentUser)

		// API endpoints
		protected.GET("/api/profile", api.GetProfile)
		protected.PUT("/api/profile", api.UpdateProfile)
		protected.GET("/api/friends", api.GetFriends)
		protected.POST("/api/friends", api.AddFriend)
		protected.GET("/api/rides", api.GetRides)
		protected.POST("/api/rides", api.CreateRide)
	}

	return r
}
