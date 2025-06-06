package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"juno-backend/configs"
	"juno-backend/internal/database"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type GoogleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
	Given   string `json:"given_name"`
	Family  string `json:"family_name"`
}

type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

var (
	googleOauthConfig *oauth2.Config
	jwtSecret         string
)

func InitOAuth(cfg *configs.Config) {
	redirectURL := "http://localhost:" + cfg.Port + "/auth/google/callback"

	// For production, use the Digital Ocean URL
	if cfg.Port == "8080" {
		redirectURL = "https://juno-backend-6eamg.ondigitalocean.app/auth/google/callback"
	}

	googleOauthConfig = &oauth2.Config{
		RedirectURL:  redirectURL,
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}
	jwtSecret = cfg.JWTSecret

	log.Printf("🔗 OAuth Redirect URL: %s", redirectURL)
}

func HandleGoogleLogin(c *gin.Context) {
	url := googleOauthConfig.AuthCodeURL("state", oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func HandleGoogleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code not found"})
		return
	}

	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token"})
		return
	}

	client := googleOauthConfig.Client(context.Background(), token)
	userInfoResp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}
	defer userInfoResp.Body.Close()

	var googleUser GoogleUserInfo
	if err := json.NewDecoder(userInfoResp.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode user info"})
		return
	}

	// Check if user exists or create new user
	var userID int
	var username string
	err = database.DB.QueryRow("SELECT id, username FROM users WHERE email = $1", googleUser.Email).Scan(&userID, &username)

	if err != nil {
		// User doesn't exist, create new user
		username = strings.Split(googleUser.Email, "@")[0]

		// Ensure unique username
		originalUsername := username
		counter := 1
		for {
			var existingID int
			err := database.DB.QueryRow("SELECT id FROM users WHERE username = $1", username).Scan(&existingID)
			if err != nil {
				// Username is available
				break
			}
			username = fmt.Sprintf("%s%d", originalUsername, counter)
			counter++
		}

		err = database.DB.QueryRow(`
            INSERT INTO users (username, email, google_id, first_name, last_name, profile_picture_url, password_hash) 
            VALUES ($1, $2, $3, $4, $5, $6, 'google_oauth') 
            RETURNING id`,
			username, googleUser.Email, googleUser.ID, googleUser.Given, googleUser.Family, googleUser.Picture).Scan(&userID)

		if err != nil {
			log.Printf("Error creating user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		log.Printf("✅ Created new user: %s (ID: %d)", username, userID)
	}

	// Generate JWT token
	claims := &Claims{
		UserID: userID,
		Email:  googleUser.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour * 7)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	tokenString, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// For mobile apps, redirect to a custom scheme or deep link
	// For now, return JSON response with token
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   tokenString,
		"user": gin.H{
			"id":       userID,
			"username": username,
			"email":    googleUser.Email,
			"firstName": googleUser.Given,
			"lastName":  googleUser.Family,
		},
	})
}

func HandleLogout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
