package configs

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	JWTSecret          string
	GoogleClientID     string
	GoogleClientSecret string
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		Port:               getEnv("PORT", "3000"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		DBHost:             os.Getenv("DB_HOST"),
		DBPort:             getEnv("DB_PORT", "5432"),
		DBUser:             os.Getenv("DB_USER"),
		DBPassword:         os.Getenv("DB_PASSWORD"),
		DBName:             os.Getenv("DB_NAME"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
