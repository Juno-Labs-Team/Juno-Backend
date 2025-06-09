package auth

import (
	"golang.org/x/oauth2"
)

func GetOAuthConfig() *oauth2.Config {
	return googleOauthConfig
}
