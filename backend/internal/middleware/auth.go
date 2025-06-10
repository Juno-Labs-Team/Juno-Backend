package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("🔍 JWT Middleware started\n")

		authHeader := c.GetHeader("Authorization")
		fmt.Printf("🔍 Auth Header: '%s'\n", authHeader)

		if authHeader == "" {
			fmt.Printf("❌ No Authorization header\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		bearerToken := strings.Split(authHeader, " ")
		if len(bearerToken) != 2 || bearerToken[0] != "Bearer" {
			fmt.Printf("❌ Invalid Bearer format. Parts: %v\n", bearerToken)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		tokenString := bearerToken[1]
		fmt.Printf("🔍 Token (first 50 chars): %s...\n", tokenString[:min(50, len(tokenString))])

		// Get JWT secret from environment
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "juno_rideshare_super_secret_key_2025_change_this" // Fallback to match OAuth generation
		}
		fmt.Printf("🔍 Using JWT Secret (first 20 chars): %s...\n", jwtSecret[:min(20, len(jwtSecret))])

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			fmt.Printf("❌ JWT Parse Error: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		if !token.Valid {
			fmt.Printf("❌ Token is not valid\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		// Extract claims properly
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			fmt.Printf("🔍 Token Claims: %+v\n", claims)

			// Your JWT has "user_id" field (from the working OAuth response)
			userID := fmt.Sprintf("%v", claims["user_id"])
			email := fmt.Sprintf("%v", claims["email"])

			fmt.Printf("✅ Extracted userID: '%s', email: '%s'\n", userID, email)

			// Set in context for handlers to use
			c.Set("userID", userID)
			c.Set("email", email)
			c.Next()
		} else {
			fmt.Printf("❌ Invalid token claims\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
		}
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
