package handlers

import (
	"juno-backend/internal/database"
	"juno-backend/internal/models"
	"net/http"

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
            u.profile_picture_url, u.created_at, u.updated_at,
            COALESCE(up.school, '') as school,
            COALESCE(up.class_year, '') as class_year,
            COALESCE(up.major, '') as major,
            COALESCE(up.has_car, false) as has_car,
            COALESCE(up.car_make, '') as car_make,
            COALESCE(up.car_model, '') as car_model,
            COALESCE(up.car_color, '') as car_color,
            COALESCE(up.max_passengers, 0) as max_passengers,
            COALESCE(up.bio, '') as bio
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1`, userID).Scan(
		&profile.ID, &profile.Username, &profile.Email, &profile.FirstName, &profile.LastName,
		&profile.Phone, &profile.ProfilePicture, &profile.CreatedAt, &profile.UpdatedAt,
		&profile.School, &profile.ClassYear, &profile.Major, &profile.HasCar,
		&profile.CarMake, &profile.CarModel, &profile.CarColor, &profile.MaxPassengers, &profile.Bio)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profile: " + err.Error()})
		return
	}

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

	// Update user table (phone)
	_, err := database.DB.Exec(`UPDATE users SET phone = $1 WHERE id = $2`, req.Phone, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user info: " + err.Error()})
		return
	}

	// Upsert user_profiles table
	_, err = database.DB.Exec(`
        INSERT INTO user_profiles (user_id, school, class_year, major, has_car, car_make, car_model, car_color, max_passengers, bio, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
            school = EXCLUDED.school,
            class_year = EXCLUDED.class_year,
            major = EXCLUDED.major,
            has_car = EXCLUDED.has_car,
            car_make = EXCLUDED.car_make,
            car_model = EXCLUDED.car_model,
            car_color = EXCLUDED.car_color,
            max_passengers = EXCLUDED.max_passengers,
            bio = EXCLUDED.bio,
            updated_at = CURRENT_TIMESTAMP`,
		userID, req.School, req.ClassYear, req.Major, req.HasCar,
		req.CarMake, req.CarModel, req.CarColor, req.MaxPassengers, req.Bio)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
	})
}
