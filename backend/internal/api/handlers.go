package api

import (
	"net/http"
	"strconv"

	"juno-backend/internal/database"

	"github.com/gin-gonic/gin"
)

// GetProfile - Enhanced profile data for frontend
func GetProfile(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get comprehensive user profile data
	profile, err := getEnhancedProfile(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile - Save profile data from onboarding/edit
func UpdateProfile(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var profileData map[string]interface{}
	if err := c.ShouldBindJSON(&profileData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile data"})
		return
	}

	err := updateEnhancedProfile(userID, profileData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// Return updated profile
	profile, err := getEnhancedProfile(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"profile": profile,
	})
}

// Profile structure for type safety
type ProfileData struct {
	// User table fields
	ID                int     `json:"id"`
	Username          string  `json:"username"`
	Email             string  `json:"email"`
	FirstName         string  `json:"firstName"`
	LastName          string  `json:"lastName"`
	Phone             *string `json:"phone"`
	ProfilePictureURL *string `json:"profilePicture"`

	// User profile fields
	School              string  `json:"school"`
	ClassYear           *string `json:"classYear"`
	Major               *string `json:"major"`
	Bio                 *string `json:"bio"`
	HasCar              bool    `json:"hasCar"`
	CarMake             *string `json:"carMake"`
	CarModel            *string `json:"carModel"`
	CarColor            *string `json:"carColor"`
	CarYear             *int    `json:"carYear"`
	MaxPassengers       int     `json:"maxPassengers"`
	Rating              float64 `json:"averageRating"`
	TotalRidesGiven     int     `json:"totalRidesGiven"`
	TotalRidesTaken     int     `json:"totalRidesTaken"`
	OnboardingCompleted bool    `json:"onboardingCompleted"`
	OnboardingStep      int     `json:"onboardingStep"`
}

// getEnhancedProfile - Fetch rich profile data matching frontend expectations
func getEnhancedProfile(userIDStr string) (map[string]interface{}, error) {
	var profile ProfileData

	// Query both users and user_profiles tables
	err := database.DB.QueryRow(`
        SELECT 
            u.id, u.username, u.email, u.first_name, u.last_name, 
            u.phone, u.profile_picture_url,
            COALESCE(up.school, 'Freehold High School') as school, 
            up.class_year, up.major, up.bio, COALESCE(up.has_car, false) as has_car,
            up.car_make, up.car_model, up.car_color, up.car_year,
            COALESCE(up.max_passengers, 4) as max_passengers, 
            COALESCE(up.rating, 0.0) as rating, 
            COALESCE(up.total_rides_given, 0) as total_rides_given, 
            COALESCE(up.total_rides_taken, 0) as total_rides_taken,
            COALESCE(up.onboarding_completed, false) as onboarding_completed, 
            COALESCE(up.onboarding_step, 0) as onboarding_step
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1
    `, userIDStr).Scan(
		&profile.ID, &profile.Username, &profile.Email, &profile.FirstName, &profile.LastName,
		&profile.Phone, &profile.ProfilePictureURL,
		&profile.School, &profile.ClassYear, &profile.Major, &profile.Bio, &profile.HasCar,
		&profile.CarMake, &profile.CarModel, &profile.CarColor, &profile.CarYear,
		&profile.MaxPassengers, &profile.Rating, &profile.TotalRidesGiven, &profile.TotalRidesTaken,
		&profile.OnboardingCompleted, &profile.OnboardingStep,
	)

	if err != nil {
		return nil, err
	}

	// Calculate profile completion percentage
	completion := calculateProfileCompletion(profile)

	// Calculate total rides and ratings
	numberOfRides := profile.TotalRidesGiven + profile.TotalRidesTaken
	numRatings := 0 // Will implement rating count later

	// Build car object
	var car map[string]interface{}
	if profile.HasCar {
		car = map[string]interface{}{
			"make":  stringOrEmpty(profile.CarMake),
			"model": stringOrEmpty(profile.CarModel),
			"color": stringOrEmpty(profile.CarColor),
			"year":  intOrZero(profile.CarYear),
		}
	} else {
		car = map[string]interface{}{}
	}

	// Return structured profile matching frontend expectations
	return map[string]interface{}{
		"id":                          profile.ID,
		"username":                    profile.Username,
		"email":                       profile.Email,
		"firstName":                   profile.FirstName,
		"lastName":                    profile.LastName,
		"phone":                       stringOrEmpty(profile.Phone),
		"profilePic":                  stringOrEmpty(profile.ProfilePictureURL),
		"school":                      profile.School,
		"classYear":                   stringOrEmpty(profile.ClassYear),
		"major":                       stringOrEmpty(profile.Major),
		"bio":                         stringOrEmpty(profile.Bio),
		"description":                 stringOrEmpty(profile.Bio), // Alias for bio
		"hasCar":                      profile.HasCar,
		"car":                         car,
		"maxPassengers":               profile.MaxPassengers,
		"averageRating":               profile.Rating,
		"numberOfRides":               numberOfRides,
		"numRatings":                  numRatings,
		"profileCompletionPercentage": completion,
		"onboardingCompleted":         profile.OnboardingCompleted,
		"onboardingStep":              profile.OnboardingStep,
		"userMood":                    "neutral", // Default for now
	}, nil
}

// updateEnhancedProfile - Update profile data from frontend
func updateEnhancedProfile(userIDStr string, data map[string]interface{}) error {
	// Update users table
	_, err := database.DB.Exec(`
        UPDATE users SET 
            first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            phone = COALESCE($4, phone),
            profile_picture_url = COALESCE($5, profile_picture_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
    `,
		userIDStr,
		getStringField(data, "firstName"),
		getStringField(data, "lastName"),
		getStringField(data, "phone"),
		getStringField(data, "profilePicture"),
	)

	if err != nil {
		return err
	}

	// Handle car data from nested object
	var carMake, carModel, carColor *string
	var carYear *int
	var hasCar *bool

	if carData, ok := data["car"].(map[string]interface{}); ok {
		carMake = getStringField(carData, "make")
		carModel = getStringField(carData, "model")
		carColor = getStringField(carData, "color")
		carYear = getIntField(carData, "year")
		hasCarBool := (carMake != nil && *carMake != "") ||
			(carModel != nil && *carModel != "") ||
			(carColor != nil && *carColor != "") ||
			(carYear != nil && *carYear > 0)
		hasCar = &hasCarBool
	} else {
		// Fallback to direct fields
		carMake = getStringField(data, "carMake")
		carModel = getStringField(data, "carModel")
		carColor = getStringField(data, "carColor")
		carYear = getIntField(data, "carYear")
		hasCar = getBoolField(data, "hasCar")
	}

	// Update user_profiles table (upsert)
	_, err = database.DB.Exec(`
        INSERT INTO user_profiles (
            user_id, school, class_year, major, bio, has_car,
            car_make, car_model, car_color, car_year, max_passengers
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id) DO UPDATE SET
            school = COALESCE($2, user_profiles.school),
            class_year = COALESCE($3, user_profiles.class_year),
            major = COALESCE($4, user_profiles.major),
            bio = COALESCE($5, user_profiles.bio),
            has_car = COALESCE($6, user_profiles.has_car),
            car_make = COALESCE($7, user_profiles.car_make),
            car_model = COALESCE($8, user_profiles.car_model),
            car_color = COALESCE($9, user_profiles.car_color),
            car_year = COALESCE($10, user_profiles.car_year),
            max_passengers = COALESCE($11, user_profiles.max_passengers),
            updated_at = CURRENT_TIMESTAMP
    `,
		userIDStr,
		getStringField(data, "school"),
		getStringField(data, "classYear"),
		getStringField(data, "major"),
		getStringField(data, "bio"),
		hasCar,
		carMake,
		carModel,
		carColor,
		carYear,
		getIntFieldWithDefault(data, "maxPassengers", 4),
	)

	return err
}

// calculateProfileCompletion - Calculate completion percentage
func calculateProfileCompletion(profile ProfileData) int {
	completion := 30 // Base for having account

	// Add points for filled fields
	if profile.FirstName != "" {
		completion += 10
	}
	if profile.LastName != "" {
		completion += 10
	}
	if profile.Bio != nil && *profile.Bio != "" {
		completion += 15
	}
	if profile.ClassYear != nil && *profile.ClassYear != "" {
		completion += 10
	}
	if profile.Major != nil && *profile.Major != "" {
		completion += 10
	}
	if profile.HasCar {
		completion += 15
		if profile.CarMake != nil && *profile.CarMake != "" {
			completion += 5
		}
		if profile.CarModel != nil && *profile.CarModel != "" {
			completion += 5
		}
	}

	if completion > 100 {
		completion = 100
	}

	return completion
}

// Helper functions
func stringOrEmpty(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func intOrZero(i *int) int {
	if i == nil {
		return 0
	}
	return *i
}

func getStringField(data map[string]interface{}, key string) *string {
	if val, ok := data[key]; ok && val != nil {
		if str, ok := val.(string); ok && str != "" {
			return &str
		}
	}
	return nil
}

func getBoolField(data map[string]interface{}, key string) *bool {
	if val, ok := data[key]; ok && val != nil {
		if b, ok := val.(bool); ok {
			return &b
		}
	}
	return nil
}

func getIntField(data map[string]interface{}, key string) *int {
	if val, ok := data[key]; ok && val != nil {
		switch v := val.(type) {
		case int:
			return &v
		case float64:
			i := int(v)
			return &i
		case string:
			if i, err := strconv.Atoi(v); err == nil {
				return &i
			}
		}
	}
	return nil
}

func getIntFieldWithDefault(data map[string]interface{}, key string, defaultVal int) *int {
	if result := getIntField(data, key); result != nil {
		return result
	}
	return &defaultVal
}

// GetFriends - Get user's friends list
func GetFriends(c *gin.Context) {
	userID := c.GetString("userID")

	// TODO: Fetch friends from database
	c.JSON(http.StatusOK, gin.H{
		"message": "✅ Get friends endpoint working",
		"userID":  userID,
		"friends": []gin.H{},
		"status":  "coming soon",
	})
}

// AddFriend - Add a friend
func AddFriend(c *gin.Context) {
	userID := c.GetString("userID")

	// TODO: Add friend to database
	c.JSON(http.StatusOK, gin.H{
		"message": "✅ Add friend endpoint working",
		"userID":  userID,
		"status":  "coming soon",
	})
}

// GetRides - Get available rides
func GetRides(c *gin.Context) {
	userID := c.GetString("userID")

	// TODO: Fetch rides from database
	c.JSON(http.StatusOK, gin.H{
		"message": "✅ Get rides endpoint working",
		"userID":  userID,
		"rides":   []gin.H{},
		"status":  "coming soon",
	})
}

// CreateRide - Create a new ride
func CreateRide(c *gin.Context) {
	userID := c.GetString("userID")

	// TODO: Create ride in database
	c.JSON(http.StatusOK, gin.H{
		"message": "✅ Create ride endpoint working",
		"userID":  userID,
		"status":  "coming soon",
	})
}

// GetNearbyRides - Get rides near user location
func GetNearbyRides(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get lat/lng from query params
	lat := c.Query("lat")
	lng := c.Query("lng")
	radius := c.DefaultQuery("radius", "10") // 10km default

	// TODO: Implement proper geolocation query with your rides table
	rides, err := getNearbyRidesFromDB(userID, lat, lng, radius)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nearby rides"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"rides":    rides,
		"location": gin.H{"lat": lat, "lng": lng},
		"radius":   radius,
	})
}

// GetRideDetails - Get detailed ride information
func GetRideDetails(c *gin.Context) {
	userID := c.GetString("userID")
	rideID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	ride, err := getRideDetailsFromDB(rideID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ride details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ride": ride})
}

// JoinRide - Join an available ride
func JoinRide(c *gin.Context) {
	userID := c.GetString("userID")
	rideID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := joinRideInDB(rideID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully joined ride",
		"rideId":  rideID,
	})
}

// LeaveRide - Leave a joined ride
func LeaveRide(c *gin.Context) {
	userID := c.GetString("userID")
	rideID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := leaveRideInDB(rideID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully left ride",
		"rideId":  rideID,
	})
}

// CancelRide - Cancel a ride (driver only)
func CancelRide(c *gin.Context) {
	userID := c.GetString("userID")
	rideID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := cancelRideInDB(rideID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Ride cancelled successfully",
		"rideId":  rideID,
	})
}

// Helper functions (implement these with your database schema)
func getNearbyRidesFromDB(userID, lat, lng, radius string) ([]map[string]interface{}, error) {
	// TODO: Implement with PostGIS or distance calculation
	return []map[string]interface{}{}, nil
}

func getRideDetailsFromDB(rideID, userID string) (map[string]interface{}, error) {
	// TODO: Implement with joins to get driver info, passengers, etc.
	return map[string]interface{}{}, nil
}

func joinRideInDB(rideID, userID string) error {
	// TODO: Check available seats, insert into ride_passengers table
	return nil
}

func leaveRideInDB(rideID, userID string) error {
	// TODO: Remove from ride_passengers table
	return nil
}

func cancelRideInDB(rideID, userID string) error {
	// TODO: Check if user is driver, update ride status
	return nil
}
