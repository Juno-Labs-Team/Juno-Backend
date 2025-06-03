package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func handleDebugDB(c *gin.Context) {
	// Get users data like JS server
	usersQuery := `SELECT id, username, first_name, last_name, email, created_at FROM users`
	usersRows, err := db.Query(usersQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer usersRows.Close()

	var users []map[string]interface{}
	for usersRows.Next() {
		var id int
		var username, firstName, lastName, email, createdAt interface{}

		err := usersRows.Scan(&id, &username, &firstName, &lastName, &email, &createdAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		user := map[string]interface{}{
			"id":         id,
			"username":   username,
			"first_name": firstName,
			"last_name":  lastName,
			"email":      email,
			"created_at": createdAt,
		}
		users = append(users, user)
	}

	// Get table names like JS server
	tablesQuery := `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name`

	tablesRows, err := db.Query(tablesQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tablesRows.Close()

	var tables []string
	for tablesRows.Next() {
		var tableName string
		err := tablesRows.Scan(&tableName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		tables = append(tables, tableName)
	}

	// Match JS server response format exactly
	c.JSON(http.StatusOK, gin.H{
		"message":    "Database status",
		"tables":     tables,
		"users":      users,
		"totalUsers": len(users),
	})
}

func handleGetUser(c *gin.Context) {
	// Get user ID from context (set by JWT middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Fetch user from database
	var user struct {
		ID            int    `json:"id"`
		Username      string `json:"username"`
		Email         string `json:"email"`
		FirstName     string `json:"firstName"`
		LastName      string `json:"lastName"`
		ProfilePicture string `json:"profilePicture"`
	}

	err := db.QueryRow(`
		SELECT id, username, email, first_name, last_name, profile_picture_url 
		FROM users WHERE id = $1`, userID).Scan(
		&user.ID, &user.Username, &user.Email, &user.FirstName, &user.LastName, &user.ProfilePicture)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User fetched successfully",
		"user":    user,
	})
}

func handleCreateRide(c *gin.Context) {
	// Get user ID from context (set by JWT middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var ride struct {
		Title               string  `json:"title" binding:"required"`
		Description         string  `json:"description"`
		PickupLocation      string  `json:"pickupLocation" binding:"required"`
		PickupLatitude      float64 `json:"pickupLatitude"`
		PickupLongitude     float64 `json:"pickupLongitude"`
		Destination         string  `json:"destination" binding:"required"`
		DestinationLatitude float64 `json:"destinationLatitude"`
		DestinationLongitude float64 `json:"destinationLongitude"`
		DepartureTime       string  `json:"departureTime" binding:"required"`
		MaxPassengers       int     `json:"maxPassengers"`
		IsRecurring         bool    `json:"isRecurring"`
		RecurrencePattern   string  `json:"recurrencePattern"`
	}

	if err := c.ShouldBindJSON(&ride); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Insert ride into database
	var rideID int
	err := db.QueryRow(`
		INSERT INTO rides (
			driver_id, title, description, pickup_location, pickup_latitude, pickup_longitude,
			destination, destination_latitude, destination_longitude, departure_time,
			max_passengers, is_recurring, recurrence_pattern
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id`,
		userID, ride.Title, ride.Description, ride.PickupLocation, ride.PickupLatitude, ride.PickupLongitude,
		ride.Destination, ride.DestinationLatitude, ride.DestinationLongitude, ride.DepartureTime,
		ride.MaxPassengers, ride.IsRecurring, ride.RecurrencePattern,
	).Scan(&rideID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ride: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Ride created successfully",
		"rideID": rideID,
	})
}

func handleGetRides(c *gin.Context) {
	// TODO: Implement get rides
	c.JSON(http.StatusOK, gin.H{"message": "Get rides endpoint"})
}