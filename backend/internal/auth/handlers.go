package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"juno-backend/configs"
	"juno-backend/internal/database"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOAuthConfig *oauth2.Config

// Initialize OAuth configuration
func InitOAuth(cfg *configs.Config) {
	// Build redirect URL based on environment - removed cfg.OAuthRedirectURL reference
	var redirectURL string
	if os.Getenv("K_SERVICE") != "" {
		// Production Cloud Run
		redirectURL = "https://juno-backend-587837548118.us-east4.run.app/auth/google/callback"
	} else {
		// Local development
		redirectURL = "http://localhost:8080/auth/google/callback"
	}

	googleOAuthConfig = &oauth2.Config{
		RedirectURL:  redirectURL,
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		Scopes:       []string{"openid", "profile", "email"},
		Endpoint:     google.Endpoint,
	}
}

// Google OAuth login - redirect to Google
func GoogleLogin(cfg *configs.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Initialize OAuth if not done
		if googleOAuthConfig == nil {
			InitOAuth(cfg)
		}

		// Generate state parameter for security
		state := generateRandomState()

		// Store state in session/cookie (simplified for now)
		c.SetCookie("oauth_state", state, 300, "/", "", false, true)

		// Redirect to Google OAuth
		url := googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
		c.Redirect(http.StatusTemporaryRedirect, url)
	}
}

// Google OAuth callback - handle OAuth response
func GoogleCallback(cfg *configs.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Initialize OAuth if not done
		if googleOAuthConfig == nil {
			InitOAuth(cfg)
		}

		// Verify state parameter
		state := c.Query("state")
		cookieState, err := c.Cookie("oauth_state")
		if err != nil || state != cookieState {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state parameter"})
			return
		}

		// Exchange authorization code for token
		code := c.Query("code")
		if code == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code not found"})
			return
		}

		token, err := googleOAuthConfig.Exchange(context.Background(), code)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange code for token"})
			return
		}

		// Get user info from Google
		userInfo, err := getUserInfoFromGoogle(token)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
			return
		}

		// Create or update user in database
		user, err := createOrUpdateUser(userInfo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create/update user"})
			return
		}

		// Generate JWT token
		jwtToken, err := generateJWTToken(user, cfg.JWTSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate JWT token"})
			return
		}

		// Return success with token
		c.JSON(http.StatusOK, gin.H{
			"message": "✅ OAuth login successful",
			"token":   jwtToken,
			"user":    user,
		})
	}
}

// Get current user info
func GetCurrentUser(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Fetch user from database
	user, err := getUserByID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// Helper functions
func generateRandomState() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return base64.URLEncoding.EncodeToString(bytes)
}

func getUserInfoFromGoogle(token *oauth2.Token) (map[string]interface{}, error) {
	client := googleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var userInfo map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return userInfo, nil
}

func createOrUpdateUser(userInfo map[string]interface{}) (map[string]interface{}, error) {
	// Safely extract required fields
	email, ok := userInfo["email"].(string)
	if !ok || email == "" {
		return nil, fmt.Errorf("email is required")
	}

	googleID, ok := userInfo["id"].(string)
	if !ok || googleID == "" {
		return nil, fmt.Errorf("google ID is required")
	}

	// Handle optional fields safely with proper nil checks
	firstName := ""
	if fn, exists := userInfo["given_name"]; exists && fn != nil {
		if fnStr, ok := fn.(string); ok {
			firstName = fnStr
		}
	}

	lastName := ""
	if ln, exists := userInfo["family_name"]; exists && ln != nil {
		if lnStr, ok := ln.(string); ok {
			lastName = lnStr
		}
	}

	picture := ""
	if pic, exists := userInfo["picture"]; exists && pic != nil {
		if picStr, ok := pic.(string); ok {
			picture = picStr
		}
	}

	// Debug: Print what we're trying to insert
	fmt.Printf("🔍 Creating user with: email=%s, googleID=%s, firstName=%s, lastName=%s\n",
		email, googleID, firstName, lastName)

	// Check if user exists
	var userID int
	var username string
	err := database.DB.QueryRow(`
        SELECT id, username FROM users WHERE email = $1 OR google_id = $2
    `, email, googleID).Scan(&userID, &username)

	if err == sql.ErrNoRows {
		// Create new user - FIXED: Use profile_picture_url instead of profile_picture
		fmt.Printf("🆕 Creating new user...\n")
		err = database.DB.QueryRow(`
            INSERT INTO users (email, google_id, first_name, last_name, profile_picture_url, username, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            RETURNING id, username
        `, email, googleID, firstName, lastName, picture, email).Scan(&userID, &username)

		if err != nil {
			fmt.Printf("❌ Create user error: %v\n", err)
			return nil, fmt.Errorf("failed to create user: %v", err)
		}
		fmt.Printf("✅ User created with ID: %d\n", userID)

		// Create user profile as well
		_, err = database.DB.Exec(`
            INSERT INTO user_profiles (user_id, school, onboarding_completed, onboarding_step)
            VALUES ($1, 'Freehold High School', false, 0)
        `, userID)

		if err != nil {
			fmt.Printf("❌ Create user profile error: %v\n", err)
			return nil, fmt.Errorf("failed to create user profile: %v", err)
		}
		fmt.Printf("✅ User profile created\n")

	} else if err != nil {
		fmt.Printf("❌ Database query error: %v\n", err)
		return nil, fmt.Errorf("database error: %v", err)
	} else {
		// Update existing user - FIXED: Use profile_picture_url
		fmt.Printf("🔄 Updating existing user ID: %d\n", userID)
		_, err = database.DB.Exec(`
            UPDATE users SET 
                google_id = $1, first_name = $2, last_name = $3, 
                profile_picture_url = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `, googleID, firstName, lastName, picture, userID)

		if err != nil {
			fmt.Printf("❌ Update user error: %v\n", err)
			return nil, fmt.Errorf("failed to update user: %v", err)
		}
		fmt.Printf("✅ User updated\n")
	}

	return map[string]interface{}{
		"id":        userID,
		"email":     email,
		"firstName": firstName,
		"lastName":  lastName,
		"username":  username,
		"picture":   picture,
	}, nil
}

func generateJWTToken(user map[string]interface{}, secret string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":    user["id"],
		"email":      user["email"],
		"username":   user["username"],
		"first_name": user["firstName"],
		"last_name":  user["lastName"],
		"exp":        time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
		"iat":        time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func getUserByID(userIDStr string) (map[string]interface{}, error) {
	var user struct {
		ID        int    `json:"id"`
		Email     string `json:"email"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Username  string `json:"username"`
		Picture   string `json:"picture"`
	}

	err := database.DB.QueryRow(`
        SELECT id, email, first_name, last_name, username, profile_picture
        FROM users WHERE id = $1
    `, userIDStr).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Username, &user.Picture)

	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"id":        user.ID,
		"email":     user.Email,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"username":  user.Username,
		"picture":   user.Picture,
	}, nil
}
