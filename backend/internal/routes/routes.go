package routes

import (
	"juno-backend/configs"
	"juno-backend/internal/auth"
	"juno-backend/internal/handlers"

	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(cfg *configs.Config) *gin.Engine {
	// Set Gin mode based on environment
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default() // CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:8080",
			"http://localhost:19006",
			"https://juno-backend-587837548118.us-east4.run.app", // Current Cloud Run URL
			"https://juno-backend-6eamg.ondigitalocean.app",      // Keep old DigitalOcean backend URL
			"https://your-frontend-app.ondigitalocean.app",       // Your DigitalOcean frontend URL
			"exp://*",
			"*",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Initialize OAuth
	auth.InitOAuth(cfg)

	// Root route
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Juno Rideshare API is running! 🚗"})
	})

	// Debug routes
	r.GET("/debug/db", handlers.HandleDebugDB)

	// Auth routes
	authGroup := r.Group("/auth")
	{
		authGroup.GET("/google", auth.HandleGoogleLogin)
		authGroup.GET("/google/callback", auth.HandleGoogleCallback)
		authGroup.POST("/logout", auth.HandleLogout)
	}

	// Protected routes
	protected := r.Group("/api")
	protected.Use(auth.JWTAuthMiddleware())
	{ // Profile routes
		protected.GET("/profile", handlers.HandleGetProfile)
		protected.PUT("/profile", handlers.HandleUpdateProfile)

		// Friends routes
		protected.GET("/friends", handlers.HandleGetFriends)
		protected.GET("/friends/requests", handlers.HandleGetFriendRequests)
		protected.POST("/friends/request/:friendId", handlers.HandleSendFriendRequest)
		protected.POST("/friends/accept/:friendId", handlers.HandleAcceptFriend)
		protected.POST("/friends/reject/:friendId", handlers.HandleRejectFriend)
		protected.DELETE("/friends/:friendId", handlers.HandleRemoveFriend)
		protected.GET("/users/search", handlers.HandleSearchUsers)
		// Rides routes
		protected.GET("/rides", handlers.HandleGetRides)
		protected.POST("/rides", handlers.HandleCreateRide)
		protected.GET("/rides/nearby", handlers.HandleGetNearbyRides)
		protected.GET("/rides/:rideId", handlers.HandleGetRideDetails)
		protected.POST("/rides/:rideId/join", handlers.HandleJoinRide)
		protected.DELETE("/rides/:rideId/leave", handlers.HandleLeaveRide)
		protected.POST("/rides/:rideId/cancel", handlers.HandleCancelRide)
	}

	return r
}
