package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"juno-backend/configs"
	"juno-backend/internal/database"
	"log"
	"net/http"
	"os"
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
	// Validate required config
	if cfg.GoogleClientID == "" {
		log.Fatal("❌ GOOGLE_CLIENT_ID is required")
	}
	if cfg.GoogleClientSecret == "" {
		log.Fatal("❌ GOOGLE_CLIENT_SECRET is required")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("❌ JWT_SECRET is required")
	}

	// Default to localhost for development
	redirectURL := "http://localhost:" + cfg.Port + "/auth/google/callback"

	// Check for Google Cloud Run environment
	if os.Getenv("K_SERVICE") != "" {
		// Running on Cloud Run - use the service URL
		redirectURL = os.Getenv("OAUTH_REDIRECT_URL")
		if redirectURL == "" {
			// Use the known Cloud Run URL from the chat history
			redirectURL = "https://juno-backend-587837548118.us-east4.run.app/auth/google/callback"
			log.Printf("⚠️ Using fallback Cloud Run URL")
		}
	}

	googleOauthConfig = &oauth2.Config{
		RedirectURL:  redirectURL,
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}
	jwtSecret = cfg.JWTSecret

	log.Printf("✅ OAuth configured successfully")
	log.Printf("🔗 OAuth Redirect URL: %s", redirectURL)
}

func HandleGoogleLogin(c *gin.Context) {
	url := googleOauthConfig.AuthCodeURL("state", oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func HandleGoogleCallback(c *gin.Context) {
	log.Printf("🔵 OAuth callback received")

	// Get the authorization code from the callback
	code := c.Query("code")
	if code == "" {
		log.Printf("❌ No authorization code received")
		c.JSON(http.StatusBadRequest, gin.H{"error": "No authorization code received"})
		return
	}

	// Check if OAuth config is initialized
	if googleOauthConfig == nil {
		log.Printf("❌ OAuth config is nil")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuth not configured"})
		return
	}

	// Exchange code for token
	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		log.Printf("❌ Failed to exchange code for token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange code for token"})
		return
	}

	// Check if token is valid
	if token == nil {
		log.Printf("❌ Received nil token from OAuth exchange")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid token received"})
		return
	}

	// Create HTTP client with token
	client := googleOauthConfig.Client(context.Background(), token)
	if client == nil {
		log.Printf("❌ Failed to create OAuth client")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create OAuth client"})
		return
	}

	// Get user info from Google
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		log.Printf("❌ Failed to get user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}

	// Critical nil check that was missing
	if resp == nil {
		log.Printf("❌ Received nil response from Google API")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid response from Google"})
		return
	}
	defer resp.Body.Close()

	// Check if response body is valid
	if resp.Body == nil {
		log.Printf("❌ Response body is nil")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid response body"})
		return
	}

	var userInfo struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		VerifiedEmail bool   `json:"verified_email"`
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("❌ Failed to read response body: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read user info"})
		return
	}

	if err := json.Unmarshal(body, &userInfo); err != nil {
		log.Printf("❌ Failed to parse user info: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user info"})
		return
	}

	// Validate required fields
	if userInfo.Email == "" || userInfo.ID == "" {
		log.Printf("❌ Missing required user info fields")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required user information"})
		return
	}

	// Check database connection
	if database.DB == nil {
		log.Printf("❌ Database connection is nil")
		c.HTML(http.StatusInternalServerError, "", `
            <!DOCTYPE html>
            <html>
            <head><title>Database Error</title></head>
            <body style="font-family: Arial; background: #0a0c1e; color: white; text-align: center; padding: 50px;">
                <h1>🚗 Juno</h1>
                <h2 style="color: #ff6b6b;">Database Connection Error</h2>
                <p>The database is not connected. Please try again in a moment.</p>
                <a href="/auth/google" style="color: #00ffe7;">Try Again</a>
            </body>
            </html>
        `)
		return
	}

	// Test database connection
	if err := database.DB.Ping(); err != nil {
		log.Printf("❌ Database ping failed: %v", err)
		c.HTML(http.StatusInternalServerError, "", `
            <!DOCTYPE html>
            <html>
            <head><title>Database Error</title></head>
            <body style="font-family: Arial; background: #0a0c1e; color: white; text-align: center; padding: 50px;">
                <h1>🚗 Juno</h1>
                <h2 style="color: #ff6b6b;">Database Connection Error</h2>
                <p>Cannot connect to database. Please try again.</p>
                <a href="/auth/google" style="color: #00ffe7;">Try Again</a>
            </body>
            </html>
        `)
		return
	}

	log.Printf("✅ User info received: %s (%s)", userInfo.Email, userInfo.Name)

	// Check if user exists or create new user
	var userID int
	var username string
	err = database.DB.QueryRow("SELECT id, username FROM users WHERE email = $1", userInfo.Email).Scan(&userID, &username)

	if err != nil {
		log.Printf("🆕 Creating new user for email: %s", userInfo.Email)

		// User doesn't exist, create new user
		username = strings.Split(userInfo.Email, "@")[0]

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

		log.Printf("🔤 Using username: %s", username)

		err = database.DB.QueryRow(`
            INSERT INTO users (username, email, google_id, first_name, last_name, profile_picture_url, password_hash) 
            VALUES ($1, $2, $3, $4, $5, $6, 'google_oauth') 
            RETURNING id`,
			username, userInfo.Email, userInfo.ID, userInfo.GivenName, userInfo.FamilyName, userInfo.Picture).Scan(&userID)

		if err != nil {
			log.Printf("❌ Error creating user: %v", err)
			c.HTML(http.StatusInternalServerError, "", `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Juno - Login Error</title>
                    <style>
                        body { font-family: Arial, sans-serif; background: #0a0c1e; color: white; text-align: center; padding: 50px; }
                        .container { max-width: 600px; margin: 0 auto; }
                        .error { color: #ff6b6b; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🚗 Juno</h1>
                        <div class="error">
                            <h2>Database Error</h2>
                            <p>Failed to create user account. Please try again.</p>
                            <p style="font-size: 12px; color: #666;">Error: `+err.Error()+`</p>
                        </div>
                    </div>
                </body>
                </html>
            `)
			return
		}

		log.Printf("✅ Created new user: %s (ID: %d)", username, userID)
	} else {
		log.Printf("✅ Found existing user: %s (ID: %d)", username, userID)
	}

	// Generate JWT token
	if jwtSecret == "" {
		log.Printf("❌ JWT secret is not set")
		c.HTML(http.StatusInternalServerError, "", `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Juno - Configuration Error</title>
				<style>
					body { font-family: Arial, sans-serif; background: #0a0c1e; color: white; text-align: center; padding: 50px; }
					.container { max-width: 600px; margin: 0 auto; }
					.error { color: #ff6b6b; }
				</style>
			</head>
			<body>
				<div class="container">
					<h1>🚗 Juno</h1>
					<div class="error">
						<h2>Configuration Error</h2>
						<p>Server configuration is incomplete. Please contact support.</p>
					</div>
				</div>
			</body>
			</html>
		`)
		return
	}

	claims := &Claims{
		UserID: userID,
		Email:  userInfo.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour * 7)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	tokenString, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(jwtSecret))
	if err != nil {
		log.Printf("❌ Failed to generate JWT: %v", err)
		c.HTML(http.StatusInternalServerError, "", `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Juno - Login Error</title>
				<style>
					body { font-family: Arial, sans-serif; background: #0a0c1e; color: white; text-align: center; padding: 50px; }
					.container { max-width: 600px; margin: 0 auto; }
					.error { color: #ff6b6b; }
				</style>
			</head>
			<body>
				<div class="container">
					<h1>🚗 Juno</h1>
					<div class="error">
						<h2>Login Error</h2>
						<p>Failed to generate authentication token. Please try again.</p>
						<p style="font-size: 12px; color: #666;">Error: `+err.Error()+`</p>
					</div>
				</div>
			</body>
			</html>
		`)
		return
	}

	log.Printf("✅ JWT generated successfully for user %s", username)

	// Safe username display - use email if Given name is empty
	displayName := userInfo.GivenName
	if displayName == "" {
		displayName = strings.Split(userInfo.Email, "@")[0]
	}

	// Return success page with token that user can copy
	c.HTML(http.StatusOK, "", fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<title>Juno - Login Successful</title>
			<style>
				body { 
					font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
					background: linear-gradient(135deg, #0a0c1e 0%%, #1a1a30 100%%); 
					color: white; 
					text-align: center; 
					padding: 20px;
					margin: 0;
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.container { 
					max-width: 700px; 
					margin: 0 auto;
					background: rgba(24, 24, 37, 0.8);
					border-radius: 20px;
					padding: 40px;
					border: 2px solid #00ffe744;
					box-shadow: 0 8px 32px rgba(0, 255, 231, 0.2);
				}
				.success { color: #00ffe7; }
				.logo { font-size: 48px; margin-bottom: 20px; }
				h1 { color: #00ffe7; text-shadow: 0 0 10px #00ffe7; }
				.token-container {
					background: #1e1e1e;
					border: 2px solid #00ffe7;
					border-radius: 15px;
					padding: 20px;
					margin: 20px 0;
					word-break: break-all;
					font-family: monospace;
					font-size: 14px;
					line-height: 1.5;
				}
				.copy-btn {
					background: #00ffe7;
					color: #000;
					border: none;
					padding: 12px 25px;
					border-radius: 25px;
					font-weight: bold;
					cursor: pointer;
					margin: 10px;
					font-size: 16px;
					transition: all 0.3s ease;
				}
				.copy-btn:hover {
					background: #00d4c4;
					box-shadow: 0 4px 15px rgba(0, 255, 231, 0.4);
				}
				.instructions {
					background: rgba(0, 255, 231, 0.1);
					border-radius: 15px;
					padding: 20px;
					margin: 20px 0;
					text-align: left;
				}
				.step {
					margin: 10px 0;
					padding-left: 20px;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="logo">🚗</div>
				<h1>Juno Login Successful!</h1>
				<div class="success">
					<p><strong>Welcome, %s!</strong></p>
					<p>Copy the token below and paste it in the Juno app:</p>
				</div>
				
				<div class="token-container" id="token">%s</div>
				
				<button class="copy-btn" onclick="copyToken()">📋 Copy Token</button>
				
				<div class="instructions">
					<h3>📱 Next Steps:</h3>
					<div class="step">1. Go back to the Juno app</div>
					<div class="step">2. Enable "Dev Mode" on the login screen</div>
					<div class="step">3. Paste the token in the text field</div>
					<div class="step">4. Click "Dev Login"</div>
				</div>
				
				<p style="color: #666; font-size: 12px; margin-top: 30px;">
					You can close this tab after copying the token.
				</p>
			</div>
			
			<script>
				function copyToken() {
					const tokenElement = document.getElementById('token');
					const token = tokenElement.textContent;
					
					navigator.clipboard.writeText(token).then(function() {
						const btn = document.querySelector('.copy-btn');
						btn.textContent = '✅ Copied!';
						btn.style.background = '#4CAF50';
						
						setTimeout(function() {
							btn.textContent = '📋 Copy Token';
							btn.style.background = '#00ffe7';
						}, 2000);
					}, function() {
						// Fallback for older browsers
						tokenElement.select();
						document.execCommand('copy');
						alert('Token copied to clipboard!');
					});
				}
				
				// Auto-select token on page load for easy copying
				window.onload = function() {
					const tokenElement = document.getElementById('token');
					if (window.getSelection) {
						const selection = window.getSelection();
						const range = document.createRange();
						range.selectNodeContents(tokenElement);
						selection.removeAllRanges();
						selection.addRange(range);
					}
				};
			</script>
		</body>
		</html>
	`, displayName, tokenString))
}

func HandleLogout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
