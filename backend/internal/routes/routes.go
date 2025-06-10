package routes

import (
	"fmt"
	"juno-backend/configs"
	"juno-backend/internal/api"
	"juno-backend/internal/auth"
	"juno-backend/internal/middleware"
	"net/http"
	"os"
	"strings"

	"github.com/dgrijalva/jwt-go"
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

	// Add this middleware before your protected routes
	r.Use(debugJWTMiddleware())

	return r
}

// Add this middleware before your protected routes
func debugJWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		fmt.Printf("🔍 Auth Header: %s\n", authHeader)

		if authHeader == "" {
			fmt.Printf("❌ No Authorization header\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No authorization header"})
			c.Abort()
			return
		}

		// Check Bearer format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			fmt.Printf("❌ Invalid Bearer format\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid bearer format"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		fmt.Printf("🔍 Token: %s...\n", tokenString[:50]) // First 50 chars

		// Parse JWT token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil {
			fmt.Printf("❌ JWT Parse Error: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			userID := fmt.Sprintf("%v", claims["user_id"])
			fmt.Printf("✅ Extracted userID: %s\n", userID)
			c.Set("userID", userID)
			c.Next()
		} else {
			fmt.Printf("❌ Invalid token claims\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
		}
	}
}
