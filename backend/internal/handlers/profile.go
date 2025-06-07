package handlers

import (
	"database/sql"
	"juno-backend/internal/database"
	"juno-backend/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func HandleGetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var profile models.UserProfile
	err := database.DB.QueryRow(`
        SELECT 
            u.id, u.username, u.email, u.first_name, u.last_name, 
            COALESCE(u.phone, '') as phone, 
            COALESCE(u.profile_picture_url, '') as profile_picture_url, 
            u.created_at, u.updated_at,
            COALESCE(up.school, 'Freehold High School') as school,
            COALESCE(up.class_year, '') as class_year,
            COALESCE(up.major, '') as major,
            COALESCE(up.has_car, false) as has_car,
            COALESCE(up.car_make, '') as car_make,
            COALESCE(up.car_model, '') as car_model,
            COALESCE(up.car_color, '') as car_color,
            COALESCE(up.car_year, 0) as car_year,
            COALESCE(up.max_passengers, 4) as max_passengers,
            COALESCE(up.bio, '') as bio,
            COALESCE(up.onboarding_completed, false) as onboarding_completed,
            COALESCE(up.onboarding_step, 0) as onboarding_step,
            COALESCE(up.rating, 0.0) as rating,
            COALESCE(up.total_rides_given, 0) as total_rides_given,
            COALESCE(up.total_rides_taken, 0) as total_rides_taken
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1`, userID).Scan(
		&profile.ID, &profile.Username, &profile.Email, &profile.FirstName, &profile.LastName,
		&profile.Phone, &profile.ProfilePicture, &profile.CreatedAt, &profile.UpdatedAt,
		&profile.School, &profile.ClassYear, &profile.Major, &profile.HasCar,
		&profile.CarMake, &profile.CarModel, &profile.CarColor, &profile.CarYear,
		&profile.MaxPassengers, &profile.Bio, &profile.OnboardingCompleted,
		&profile.OnboardingStep, &profile.Rating, &profile.TotalRidesGiven, &profile.TotalRidesTaken)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profile: " + err.Error()})
		}
		return
	}

	// Calculate profile completion percentage
	var completionPercentage int
	database.DB.QueryRow("SELECT calculate_profile_completion($1)", userID).Scan(&completionPercentage)
	profile.ProfileCompletionPercentage = completionPercentage

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile fetched successfully",
		"profile": profile,
	})
}

func HandleUpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Start transaction
	tx, err := database.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Update user table (basic info, phone)
	_, err = tx.Exec(`
        UPDATE users 
        SET first_name = $1, last_name = $2, username = $3, phone = $4, 
            profile_picture_url = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6`,
		req.FirstName, req.LastName, req.Username, req.Phone, req.ProfilePicture, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user info: " + err.Error()})
		return
	}

	// Check if this update completes onboarding
	isOnboardingComplete := req.FirstName != "" && req.LastName != "" &&
		req.School != "" && req.ClassYear != ""

	// Upsert user_profiles table with enhanced onboarding tracking
	_, err = tx.Exec(`
        INSERT INTO user_profiles (
            user_id, school, class_year, major, has_car, car_make, car_model, 
            car_color, car_year, max_passengers, bio, onboarding_completed, 
            onboarding_completed_at, onboarding_step, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
            school = EXCLUDED.school,
            class_year = EXCLUDED.class_year,
            major = EXCLUDED.major,
            has_car = EXCLUDED.has_car,
            car_make = EXCLUDED.car_make,
            car_model = EXCLUDED.car_model,
            car_color = EXCLUDED.car_color,
            car_year = EXCLUDED.car_year,
            max_passengers = EXCLUDED.max_passengers,
            bio = EXCLUDED.bio,
            onboarding_completed = EXCLUDED.onboarding_completed,
            onboarding_completed_at = CASE 
                WHEN EXCLUDED.onboarding_completed = TRUE AND user_profiles.onboarding_completed = FALSE 
                THEN CURRENT_TIMESTAMP 
                ELSE user_profiles.onboarding_completed_at 
            END,
            onboarding_step = EXCLUDED.onboarding_step,
            updated_at = CURRENT_TIMESTAMP`,
		userID, req.School, req.ClassYear, req.Major, req.HasCar,
		req.CarMake, req.CarModel, req.CarColor, req.CarYear, req.MaxPassengers, req.Bio,
		isOnboardingComplete,
		func() interface{} {
			if isOnboardingComplete {
				return time.Now()
			}
			return nil
		}(),
		func() int {
			if isOnboardingComplete {
				return 3
			}
			return 2
		}())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile: " + err.Error()})
		return
	}

	// Update analytics
	_, err = tx.Exec(`
        INSERT INTO profile_analytics (user_id, onboarding_completed_at, last_profile_update)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
            onboarding_completed_at = CASE 
                WHEN $2 IS NOT NULL AND profile_analytics.onboarding_completed_at IS NULL 
                THEN $2 
                ELSE profile_analytics.onboarding_completed_at 
            END,
            last_profile_update = CURRENT_TIMESTAMP`,
		userID,
		func() interface{} {
			if isOnboardingComplete {
				return time.Now()
			}
			return nil
		}())

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update analytics: " + err.Error()})
		return
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Calculate updated completion percentage
	var completionPercentage int
	database.DB.QueryRow("SELECT calculate_profile_completion($1)", userID).Scan(&completionPercentage)

	c.JSON(http.StatusOK, gin.H{
		"success":                       true,
		"message":                       "Profile updated successfully",
		"onboarding_completed":          isOnboardingComplete,
		"profile_completion_percentage": completionPercentage,
	})
}
