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

	// OAuth routes (no auth required)
	r.GET("/auth/google", auth.GoogleLogin(cfg))
	r.GET("/auth/google/callback", auth.GoogleCallback(cfg))

	// Protected routes (require JWT)
	protected := r.Group("/")
	protected.Use(middleware.JWTAuthMiddleware())
	{
		// Auth endpoints
		protected.GET("/auth/me", auth.GetCurrentUser)

		// API endpoints (working functions only)
		protected.GET("/api/profile", api.GetProfile)
		protected.PUT("/api/profile", api.UpdateProfile)
		protected.GET("/api/friends", api.GetFriends)
		protected.POST("/api/friends", api.AddFriend)

		// All rides endpoints - fully implemented
		protected.GET("/api/rides", api.GetRides)               // ✅ Enhanced with filtering
		protected.POST("/api/rides", api.CreateRide)            // ✅ Enhanced with full details
		protected.GET("/api/rides/nearby", api.GetNearbyRides)  // ✅ Location-based search
		protected.GET("/api/rides/:id", api.GetRideDetails)     // ✅ Full ride details + passengers
		protected.POST("/api/rides/:id/join", api.JoinRide)     // ✅ Join ride with validation
		protected.DELETE("/api/rides/:id/leave", api.LeaveRide) // ✅ Leave ride functionality
		protected.POST("/api/rides/:id/cancel", api.CancelRide) // ✅ Cancel ride (driver only)
	}

	return r
}
