package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOauthConfig *oauth2.Config

func init() {
	// Load environment variables in init
	if err := godotenv.Load(); err != nil {
		// Suppress warning for now
	}

	googleOauthConfig = &oauth2.Config{
		RedirectURL:  "http://localhost:3000/auth/google/callback", // Add explicit redirect URL
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes:       []string{"profile", "email"},
		Endpoint:     google.Endpoint,
	}
}

func handleGoogleLogin(c *gin.Context) {
	// Redirect like Passport does in JS
	state := generateStateString()
	url := googleOauthConfig.AuthCodeURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func handleGoogleCallback(c *gin.Context) {
	// Handle GET callback like JS server
	code := c.Query("code")
	if code == "" {
		c.Redirect(http.StatusTemporaryRedirect, "/login") // Match JS failureRedirect
		return
	}

	// Exchange code for token
	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "/login")
		return
	}

	// Get user info from Google
	client := googleOauthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "/login")
		return
	}
	defer resp.Body.Close()

	var profile struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Picture       string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		c.Redirect(http.StatusTemporaryRedirect, "/login")
		return
	}

	// Save or get user - match JS logic exactly
	user, err := saveOrGetUser(profile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Generate JWT like JS server
	jwtToken, err := generateJWT(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	// Match JS server response format exactly
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful!",
		"token":   jwtToken,
		"user": gin.H{
			"id":             user.ID,
			"username":       user.Username,
			"email":          user.Email,
			"firstName":      user.FirstName,
			"lastName":       user.LastName,
			"profilePicture": user.ProfilePicture,
		},
	})
}

func handleLogout(c *gin.Context) {
	// Match JS server response exactly
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func generateJWT(userID int, email string) (string, error) {
	// Match JS server JWT claims exactly
	claims := jwt.MapClaims{
		"userId": userID,
		"email":  email,
		"exp":    time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days like JS
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func generateStateString() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

type User struct {
	ID             int    `json:"id"`
	Username       string `json:"username"`
	Email          string `json:"email"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	ProfilePicture string `json:"profile_picture_url"`
}

func saveOrGetUser(profile struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
}) (*User, error) {
	// Check if user exists by google_id first
	var existingUser User
	err := db.QueryRow("SELECT id, username, email, first_name, last_name, profile_picture_url FROM users WHERE google_id = $1",
		profile.ID).Scan(&existingUser.ID, &existingUser.Username, &existingUser.Email,
		&existingUser.FirstName, &existingUser.LastName, &existingUser.ProfilePicture)

	if err == nil {
		return &existingUser, nil
	}

	// Check by email as fallback
	err = db.QueryRow("SELECT id, username, email, first_name, last_name, profile_picture_url FROM users WHERE email = $1",
		profile.Email).Scan(&existingUser.ID, &existingUser.Username, &existingUser.Email,
		&existingUser.FirstName, &existingUser.LastName, &existingUser.ProfilePicture)

	if err == nil {
		return &existingUser, nil
	}

	// Create new user with google_id
	username := strings.Split(profile.Email, "@")[0]

	var newUser User
	err = db.QueryRow(`
        INSERT INTO users (username, email, first_name, last_name, profile_picture_url, password_hash, google_id)
        VALUES ($1, $2, $3, $4, $5, 'google_oauth', $6)
        RETURNING id, username, email, first_name, last_name, profile_picture_url`,
		username, profile.Email, profile.GivenName, profile.FamilyName, profile.Picture, profile.ID).
		Scan(&newUser.ID, &newUser.Username, &newUser.Email, &newUser.FirstName, &newUser.LastName, &newUser.ProfilePicture)

	if err != nil {
		return nil, err
	}

	return &newUser, nil
}
