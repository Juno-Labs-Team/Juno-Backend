package auth

import (
	"log"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var config *oauth2.Config

func InitOAuth() {
    clientID := os.Getenv("GOOGLE_CLIENT_ID")
    clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
    redirectURL := os.Getenv("OAUTH_REDIRECT_URL")
    
    if clientID == "" || clientSecret == "" {
        log.Fatal("❌ Missing required OAuth environment variables")
    }
    
    if redirectURL == "" {
        redirectURL = "https://juno-backend-587837548118.us-east4.run.app/auth/google/callback"
    }

    config = &oauth2.Config{
        ClientID:     clientID,
        ClientSecret: clientSecret,
        RedirectURL:  redirectURL,
        Scopes: []string{
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        },
        Endpoint: google.Endpoint,
    }

    log.Printf("🔑 OAuth configured with redirect URL: %s", redirectURL)
}

func GetOAuthConfig() *oauth2.Config {
    return config
}