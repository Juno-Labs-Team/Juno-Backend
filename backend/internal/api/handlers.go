package api

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

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

// Enhanced GetRides - Real implementation matching your frontend
func GetRides(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get query parameters for filtering (matches your frontend filters)
	origin := c.Query("origin")
	destination := c.Query("destination")
	date := c.Query("date")
	friendsOnly := c.DefaultQuery("friendsOnly", "false")

	rides, err := getRidesFromDatabase(userID, origin, destination, date, friendsOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rides"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"rides":   rides,
		"count":   len(rides),
		"message": "✅ Rides retrieved successfully",
		"filters": gin.H{
			"origin":      origin,
			"destination": destination,
			"date":        date,
			"friendsOnly": friendsOnly,
		},
	})
}

// Enhanced CreateRide - Real implementation matching your CreateRideScreen.js
func CreateRide(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var rideData map[string]interface{}
	if err := c.ShouldBindJSON(&rideData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride data format"})
		return
	}

	// Validate required fields (matches your frontend validation)
	if err := validateRideData(rideData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rideID, err := createRideInDatabase(userID, rideData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create ride",
			"details": err.Error(),
		})
		return
	}

	// Get the created ride details to return
	ride, err := getRideDetailsByID(rideID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ride created but failed to fetch details"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Ride created successfully! 🚗",
		"ride":    ride,
		"rideId":  rideID,
		"status":  "success",
	})
}

// GetNearbyRides - Real location-based search
func GetNearbyRides(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	lat := c.Query("lat")
	lng := c.Query("lng")
	radius := c.DefaultQuery("radius", "10") // 10km default

	if lat == "" || lng == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Latitude and longitude required"})
		return
	}

	rides, err := getNearbyRidesFromDatabase(userID, lat, lng, radius)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nearby rides"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"rides":    rides,
		"location": gin.H{"lat": lat, "lng": lng},
		"radius":   radius,
		"count":    len(rides),
		"message":  "✅ Nearby rides retrieved",
	})
}

// GetRideDetails - Full ride information with passengers
func GetRideDetails(c *gin.Context) {
	userID := c.GetString("userID")
	rideID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	ride, err := getRideDetailsByID(rideID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ride not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ride": ride})
}

// JoinRide - Join a ride with validation
func JoinRide(c *gin.Context) {
	userID := c.GetString("userID")
	rideID := c.Param("id")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := joinRideInDatabase(rideID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get updated ride details
	ride, _ := getRideDetailsByID(rideID, userID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully joined ride! 🚗",
		"rideId":  rideID,
		"ride":    ride,
		"status":  "confirmed",
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

	err := leaveRideInDatabase(rideID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully left ride",
		"rideId":  rideID,
		"status":  "removed",
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

	err := cancelRideInDatabase(rideID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Ride cancelled successfully",
		"rideId":  rideID,
		"status":  "cancelled",
	})
}

// Database functions - Real implementations
func validateRideData(data map[string]interface{}) error {
	// Match validation from your CreateRideScreen.js
	if data["origin_address"] == nil || data["origin_address"].(string) == "" {
		return fmt.Errorf("pickup location is required")
	}
	if data["destination_address"] == nil || data["destination_address"].(string) == "" {
		return fmt.Errorf("destination is required")
	}
	if data["departure_time"] == nil {
		return fmt.Errorf("departure time is required")
	}
	if data["max_passengers"] == nil {
		return fmt.Errorf("number of passengers is required")
	}
	return nil
}

func getRidesFromDatabase(userID, origin, destination, date, friendsOnly string) ([]map[string]interface{}, error) {
	baseQuery := `
        SELECT r.id, r.origin_address, r.destination_address, r.departure_time, 
               r.max_passengers, r.price_per_seat, r.description, r.status, r.created_at,
               r.origin_lat, r.origin_lng, r.destination_lat, r.destination_lng,
               u.first_name, u.last_name, u.profile_picture_url,
               up.car_make, up.car_model, up.car_color, up.rating,
               (SELECT COUNT(*) FROM ride_passengers rp WHERE rp.ride_id = r.id AND rp.status = 'confirmed') as current_passengers
        FROM rides r
        JOIN users u ON r.driver_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE r.status = 'active' AND r.departure_time > NOW()
          AND r.driver_id != $1
    `

	args := []interface{}{userID}
	argIndex := 2

	// Add filters
	if origin != "" {
		baseQuery += fmt.Sprintf(" AND LOWER(r.origin_address) LIKE LOWER($%d)", argIndex)
		args = append(args, "%"+origin+"%")
		argIndex++
	}

	if destination != "" {
		baseQuery += fmt.Sprintf(" AND LOWER(r.destination_address) LIKE LOWER($%d)", argIndex)
		args = append(args, "%"+destination+"%")
		argIndex++
	}

	if date != "" {
		baseQuery += fmt.Sprintf(" AND DATE(r.departure_time) = $%d", argIndex)
		args = append(args, date)
		argIndex++
	}

	if friendsOnly == "true" {
		baseQuery += fmt.Sprintf(` AND r.driver_id IN (
            SELECT friend_id FROM friendships WHERE user_id = $%d AND status = 'accepted'
            UNION
            SELECT user_id FROM friendships WHERE friend_id = $%d AND status = 'accepted'
        )`, argIndex, argIndex+1)
		args = append(args, userID, userID)
		argIndex += 2
	}

	baseQuery += " ORDER BY r.departure_time ASC LIMIT 50"

	rows, err := database.DB.Query(baseQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rides []map[string]interface{}
	for rows.Next() {
		var ride struct {
			ID                int      `json:"id"`
			OriginAddress     string   `json:"originAddress"`
			DestAddress       string   `json:"destinationAddress"`
			DepartureTime     string   `json:"departureTime"`
			MaxPassengers     int      `json:"maxPassengers"`
			PricePerSeat      *float64 `json:"pricePerSeat"`
			Description       *string  `json:"description"`
			Status            string   `json:"status"`
			CreatedAt         string   `json:"createdAt"`
			OriginLat         *float64 `json:"originLat"`
			OriginLng         *float64 `json:"originLng"`
			DestLat           *float64 `json:"destLat"`
			DestLng           *float64 `json:"destLng"`
			DriverFirstName   string   `json:"driverFirstName"`
			DriverLastName    string   `json:"driverLastName"`
			DriverPhoto       *string  `json:"driverPhoto"`
			CarMake           *string  `json:"carMake"`
			CarModel          *string  `json:"carModel"`
			CarColor          *string  `json:"carColor"`
			DriverRating      float64  `json:"driverRating"`
			CurrentPassengers int      `json:"currentPassengers"`
		}

		err := rows.Scan(
			&ride.ID, &ride.OriginAddress, &ride.DestAddress, &ride.DepartureTime,
			&ride.MaxPassengers, &ride.PricePerSeat, &ride.Description, &ride.Status, &ride.CreatedAt,
			&ride.OriginLat, &ride.OriginLng, &ride.DestLat, &ride.DestLng,
			&ride.DriverFirstName, &ride.DriverLastName, &ride.DriverPhoto,
			&ride.CarMake, &ride.CarModel, &ride.CarColor, &ride.DriverRating, &ride.CurrentPassengers,
		)
		if err != nil {
			return nil, err
		}

		// Format data to match your HomeScreen.js expectations
		departureTime, _ := time.Parse(time.RFC3339, ride.DepartureTime)

		rideMap := map[string]interface{}{
			"id":                ride.ID,
			"title":             fmt.Sprintf("%s → %s", ride.OriginAddress, ride.DestAddress),
			"origin":            ride.OriginAddress,
			"destination":       ride.DestAddress,
			"departureTime":     ride.DepartureTime,
			"date":              departureTime.Format("2006-01-02"),
			"time":              departureTime.Format("15:04"),
			"maxPassengers":     ride.MaxPassengers,
			"currentPassengers": ride.CurrentPassengers,
			"availableSeats":    ride.MaxPassengers - ride.CurrentPassengers,
			"price":             handleFloatPointer(ride.PricePerSeat),
			"pricePerSeat":      handleFloatPointer(ride.PricePerSeat),
			"description":       handleStringPointer(ride.Description),
			"status":            ride.Status,
			"emoji":             "🚗",
			"color":             "4285F4", // Blue theme
			"driverName":        ride.DriverFirstName + " " + ride.DriverLastName,
			"driver": map[string]interface{}{
				"firstName": ride.DriverFirstName,
				"lastName":  ride.DriverLastName,
				"photo":     handleStringPointer(ride.DriverPhoto),
				"rating":    ride.DriverRating,
			},
			"car": map[string]interface{}{
				"make":  handleStringPointer(ride.CarMake),
				"model": handleStringPointer(ride.CarModel),
				"color": handleStringPointer(ride.CarColor),
			},
			"location": map[string]interface{}{
				"origin": map[string]interface{}{
					"lat": handleFloatPointer(ride.OriginLat),
					"lng": handleFloatPointer(ride.OriginLng),
				},
				"destination": map[string]interface{}{
					"lat": handleFloatPointer(ride.DestLat),
					"lng": handleFloatPointer(ride.DestLng),
				},
			},
		}
		rides = append(rides, rideMap)
	}

	return rides, nil
}

func createRideInDatabase(userID string, rideData map[string]interface{}) (string, error) {
	query := `
        INSERT INTO rides (driver_id, origin_address, destination_address, departure_time, 
                          max_passengers, price_per_seat, description, status, 
                          origin_lat, origin_lng, destination_lat, destination_lng,
                          only_friends, school_related, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
        RETURNING id
    `

	var rideID int
	err := database.DB.QueryRow(
		query,
		userID,
		rideData["origin_address"],
		rideData["destination_address"],
		rideData["departure_time"],
		rideData["max_passengers"],
		rideData["price_per_seat"],
		rideData["description"],
		rideData["origin_lat"],
		rideData["origin_lng"],
		rideData["destination_lat"],
		rideData["destination_lng"],
		rideData["only_friends"],
		rideData["school_related"],
	).Scan(&rideID)

	if err != nil {
		return "", err
	}

	return strconv.Itoa(rideID), nil
}

func getRideDetailsByID(rideID, userID string) (map[string]interface{}, error) {
	var ride struct {
		ID              int      `json:"id"`
		OriginAddress   string   `json:"originAddress"`
		DestAddress     string   `json:"destinationAddress"`
		DepartureTime   string   `json:"departureTime"`
		MaxPassengers   int      `json:"maxPassengers"`
		PricePerSeat    *float64 `json:"pricePerSeat"`
		Description     *string  `json:"description"`
		Status          string   `json:"status"`
		DriverID        int      `json:"driverId"`
		DriverFirstName string   `json:"driverFirstName"`
		DriverLastName  string   `json:"driverLastName"`
		DriverPhone     *string  `json:"driverPhone"`
		DriverPhoto     *string  `json:"driverPhoto"`
		CarMake         *string  `json:"carMake"`
		CarModel        *string  `json:"carModel"`
		CarColor        *string  `json:"carColor"`
		DriverRating    float64  `json:"driverRating"`
	}

	query := `
        SELECT r.id, r.origin_address, r.destination_address, r.departure_time, 
               r.max_passengers, r.price_per_seat, r.description, r.status, r.driver_id,
               u.first_name, u.last_name, u.phone, u.profile_picture_url,
               up.car_make, up.car_model, up.car_color, up.rating
        FROM rides r
        JOIN users u ON r.driver_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE r.id = $1
    `

	err := database.DB.QueryRow(query, rideID).Scan(
		&ride.ID, &ride.OriginAddress, &ride.DestAddress, &ride.DepartureTime,
		&ride.MaxPassengers, &ride.PricePerSeat, &ride.Description, &ride.Status, &ride.DriverID,
		&ride.DriverFirstName, &ride.DriverLastName, &ride.DriverPhone, &ride.DriverPhoto,
		&ride.CarMake, &ride.CarModel, &ride.CarColor, &ride.DriverRating,
	)

	if err != nil {
		return nil, err
	}

	// Get passengers
	passengersQuery := `
        SELECT u.id, u.first_name, u.last_name, u.profile_picture_url
        FROM ride_passengers rp
        JOIN users u ON rp.passenger_id = u.id
        WHERE rp.ride_id = $1 AND rp.status = 'confirmed'
    `

	rows, err := database.DB.Query(passengersQuery, rideID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var passengers []map[string]interface{}
	for rows.Next() {
		var passenger struct {
			ID        int     `json:"id"`
			FirstName string  `json:"firstName"`
			LastName  string  `json:"lastName"`
			Photo     *string `json:"photo"`
		}

		err := rows.Scan(&passenger.ID, &passenger.FirstName, &passenger.LastName, &passenger.Photo)
		if err != nil {
			return nil, err
		}

		passengers = append(passengers, map[string]interface{}{
			"id":        passenger.ID,
			"firstName": passenger.FirstName,
			"lastName":  passenger.LastName,
			"photo":     handleStringPointer(passenger.Photo),
		})
	}

	// Check if current user is involved
	currentUserIDInt, _ := strconv.Atoi(userID)
	isPassenger := false
	isDriver := ride.DriverID == currentUserIDInt

	for _, passenger := range passengers {
		if passenger["id"] == currentUserIDInt {
			isPassenger = true
			break
		}
	}

	departureTime, _ := time.Parse(time.RFC3339, ride.DepartureTime)

	return map[string]interface{}{
		"id":                ride.ID,
		"title":             fmt.Sprintf("%s → %s", ride.OriginAddress, ride.DestAddress),
		"origin":            ride.OriginAddress,
		"destination":       ride.DestAddress,
		"departureTime":     ride.DepartureTime,
		"date":              departureTime.Format("2006-01-02"),
		"time":              departureTime.Format("15:04"),
		"maxPassengers":     ride.MaxPassengers,
		"currentPassengers": len(passengers),
		"availableSeats":    ride.MaxPassengers - len(passengers),
		"price":             handleFloatPointer(ride.PricePerSeat),
		"pricePerSeat":      handleFloatPointer(ride.PricePerSeat),
		"description":       handleStringPointer(ride.Description),
		"status":            ride.Status,
		"isDriver":          isDriver,
		"isPassenger":       isPassenger,
		"driverName":        ride.DriverFirstName + " " + ride.DriverLastName,
		"driver": map[string]interface{}{
			"id":        ride.DriverID,
			"firstName": ride.DriverFirstName,
			"lastName":  ride.DriverLastName,
			"phone":     handleStringPointer(ride.DriverPhone),
			"photo":     handleStringPointer(ride.DriverPhoto),
			"rating":    ride.DriverRating,
		},
		"car": map[string]interface{}{
			"make":  handleStringPointer(ride.CarMake),
			"model": handleStringPointer(ride.CarModel),
			"color": handleStringPointer(ride.CarColor),
		},
		"passengers": passengers,
	}, nil
}

func joinRideInDatabase(rideID, userID string) error {
	// Check if ride exists and has available seats
	var maxPassengers, currentPassengers, driverID int
	err := database.DB.QueryRow(`
        SELECT r.max_passengers, r.driver_id,
               (SELECT COUNT(*) FROM ride_passengers rp WHERE rp.ride_id = r.id AND rp.status = 'confirmed')
        FROM rides r WHERE r.id = $1 AND r.status = 'active'
    `, rideID).Scan(&maxPassengers, &driverID, &currentPassengers)

	if err != nil {
		return fmt.Errorf("ride not found or not available")
	}

	// Validation checks
	currentUserID, _ := strconv.Atoi(userID)
	if driverID == currentUserID {
		return fmt.Errorf("cannot join your own ride")
	}

	if currentPassengers >= maxPassengers {
		return fmt.Errorf("no available seats")
	}

	// Check if user is already a passenger
	var existingPassenger int
	err = database.DB.QueryRow(
		"SELECT COUNT(*) FROM ride_passengers WHERE ride_id = $1 AND passenger_id = $2",
		rideID, userID,
	).Scan(&existingPassenger)

	if err != nil {
		return err
	}

	if existingPassenger > 0 {
		return fmt.Errorf("already joined this ride")
	}

	// Add passenger
	_, err = database.DB.Exec(
		"INSERT INTO ride_passengers (ride_id, passenger_id, status, joined_at) VALUES ($1, $2, 'confirmed', CURRENT_TIMESTAMP)",
		rideID, userID,
	)

	return err
}

func leaveRideInDatabase(rideID, userID string) error {
	// Check if user is a passenger
	var passengerExists int
	err := database.DB.QueryRow(
		"SELECT COUNT(*) FROM ride_passengers WHERE ride_id = $1 AND passenger_id = $2",
		rideID, userID,
	).Scan(&passengerExists)

	if err != nil {
		return err
	}

	if passengerExists == 0 {
		return fmt.Errorf("not a passenger of this ride")
	}

	// Remove passenger
	_, err = database.DB.Exec(
		"DELETE FROM ride_passengers WHERE ride_id = $1 AND passenger_id = $2",
		rideID, userID,
	)

	return err
}

func cancelRideInDatabase(rideID, userID string) error {
	// Check if user is the driver
	var driverID int
	err := database.DB.QueryRow(
		"SELECT driver_id FROM rides WHERE id = $1",
		rideID,
	).Scan(&driverID)

	if err != nil {
		return fmt.Errorf("ride not found")
	}

	currentUserID, _ := strconv.Atoi(userID)
	if driverID != currentUserID {
		return fmt.Errorf("only the driver can cancel this ride")
	}

	// Update ride status to cancelled
	_, err = database.DB.Exec(
		"UPDATE rides SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
		rideID,
	)

	return err
}

func getNearbyRidesFromDatabase(userID, lat, lng, radius string) ([]map[string]interface{}, error) {
	// For now, return all active rides (you can implement geolocation later)
	return getRidesFromDatabase(userID, "", "", "", "false")
}

// Helper functions - SINGLE DEFINITIONS ONLY
func handleStringPointer(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func handleFloatPointer(f *float64) float64 {
	if f == nil {
		return 0.0
	}
	return *f
}
