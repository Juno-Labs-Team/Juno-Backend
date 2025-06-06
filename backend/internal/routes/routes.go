package routes

import (
	"juno-backend/configs"
	"juno-backend/internal/auth"
	"juno-backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, cfg *configs.Config) {
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
	{
		// Profile routes
		protected.GET("/profile", handlers.HandleGetProfile)
		protected.PUT("/profile", handlers.HandleUpdateProfile)

		// Friends routes
		protected.GET("/friends", handlers.HandleGetFriends)
		protected.GET("/friends/requests", handlers.HandleGetFriendRequests)
		protected.POST("/friends/request/:friendId", handlers.HandleSendFriendRequest)
		protected.POST("/friends/accept/:friendshipId", handlers.HandleAcceptFriendRequest)
		protected.GET("/users/search", handlers.HandleSearchUsers) // Add this route

		// Ride routes - Add these missing routes
		protected.GET("/rides", handlers.HandleGetRides)
		protected.POST("/rides", handlers.HandleCreateRide)
		protected.POST("/rides/:rideId/join", handlers.HandleJoinRide)
		protected.GET("/rides/nearby", handlers.HandleGetNearbyRides)

		// Notification routes
		protected.GET("/notifications", handlers.HandleGetNotifications)
		protected.POST("/notifications/:id/read", handlers.HandleMarkNotificationRead)
	}
}
