package handlers

import (
	"juno-backend/internal/database"
	"juno-backend/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Create a new ride
func HandleCreateRide(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateRideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	// Verify user has car info in profile
	var hasCar bool
	err := database.DB.QueryRow(`
		SELECT COALESCE(has_car, false) 
		FROM user_profiles 
		WHERE user_id = $1`, userID).Scan(&hasCar)

	if err != nil || !hasCar {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Driver must have car information in profile"})
		return
	}

	// Create the ride
	var rideID int
	err = database.DB.QueryRow(`
		INSERT INTO rides (
			driver_id, title, description, pickup_location, pickup_latitude, pickup_longitude,
			destination, destination_latitude, destination_longitude, departure_time, 
			max_passengers, is_recurring, recurrence_pattern, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active')
		RETURNING id`,
		userID, req.Title, req.Description, req.PickupLocation, req.PickupLatitude, req.PickupLongitude,
		req.Destination, req.DestinationLatitude, req.DestinationLongitude, req.DepartureTime,
		req.MaxPassengers, req.IsRecurring, req.RecurrencePattern).Scan(&rideID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ride: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Ride created successfully",
		"rideId":  rideID,
	})
}

// Get available rides (friends only)
func HandleGetRides(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	rows, err := database.DB.Query(`
		SELECT 
			r.id, r.driver_id, r.title, r.description, r.pickup_location, 
			r.destination, r.departure_time, r.max_passengers, r.current_passengers,
			r.status, r.created_at,
			u.first_name, u.last_name, u.email,
			(r.max_passengers - r.current_passengers) as available_spots,
			(r.driver_id = $1) as is_driver,
			CASE WHEN rr.id IS NOT NULL THEN true ELSE false END as is_passenger
		FROM rides r
		JOIN users u ON r.driver_id = u.id
		LEFT JOIN ride_requests rr ON r.id = rr.ride_id AND rr.passenger_id = $1 AND rr.status = 'accepted'
		WHERE r.status = 'active' 
		AND r.departure_time > NOW()
		AND (
			r.driver_id = $1 OR  -- User's own rides
			r.driver_id IN (     -- Friends' rides
				SELECT CASE 
					WHEN f.user_id = $1 THEN f.friend_id 
					ELSE f.user_id 
				END
				FROM friendships f 
				WHERE (f.user_id = $1 OR f.friend_id = $1) 
				AND f.status = 'accepted'
			)
		)
		ORDER BY r.departure_time ASC`,
		userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rides: " + err.Error()})
		return
	}
	defer rows.Close()

	var rides []models.Ride
	for rows.Next() {
		var ride models.Ride
		err := rows.Scan(
			&ride.ID, &ride.DriverID, &ride.Title, &ride.Description, &ride.PickupLocation,
			&ride.Destination, &ride.DepartureTime, &ride.MaxPassengers, &ride.CurrentPassengers,
			&ride.Status, &ride.CreatedAt, &ride.DriverName, &ride.DriverName, &ride.DriverEmail,
			&ride.AvailableSpots, &ride.IsDriver, &ride.IsPassenger)

		if err != nil {
			continue
		}
		rides = append(rides, ride)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Rides fetched successfully",
		"rides":   rides,
	})
}

// Request to join a ride
func HandleJoinRide(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	rideID, err := strconv.Atoi(c.Param("rideId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride ID"})
		return
	}

	var req struct {
		Message string `json:"message"`
	}
	c.ShouldBindJSON(&req)

	// Check if ride exists and has space
	var driverID, maxPassengers, currentPassengers int
	err = database.DB.QueryRow(`
		SELECT driver_id, max_passengers, current_passengers 
		FROM rides 
		WHERE id = $1 AND status = 'active'`, rideID).Scan(&driverID, &maxPassengers, &currentPassengers)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ride not found"})
		return
	}

	if driverID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot join your own ride"})
		return
	}

	if currentPassengers >= maxPassengers {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ride is full"})
		return
	}

	// Check if already requested
	var existingID int
	err = database.DB.QueryRow(`
		SELECT id FROM ride_requests 
		WHERE ride_id = $1 AND passenger_id = $2`, rideID, userID).Scan(&existingID)

	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Already requested to join this ride"})
		return
	}

	// Create ride request
	_, err = database.DB.Exec(`
	INSERT INTO ride_requests (ride_id, passenger_id, message, status) 
	VALUES ($1, $2, $3, 'pending')`,
		rideID, userID, req.Message)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to request ride"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ride request sent successfully"})
}

// Accept/decline ride request (for drivers)
func HandleUpdateRideRequest(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	requestID, err := strconv.Atoi(c.Param("requestId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=accepted declined"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Verify user is the driver for this ride request
	var rideID, driverID int
	err = database.DB.QueryRow(`
		SELECT rr.ride_id, r.driver_id 
		FROM ride_requests rr
		JOIN rides r ON rr.ride_id = r.id
		WHERE rr.id = $1`, requestID).Scan(&rideID, &driverID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ride request not found"})
		return
	}

	if driverID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this request"})
		return
	}

	// Update request status
	_, err = database.DB.Exec(`
		UPDATE ride_requests 
		SET status = $1 
		WHERE id = $2`, req.Status, requestID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request"})
		return
	}

	// If accepted, increment current passengers
	if req.Status == "accepted" {
		_, err = database.DB.Exec(`
			UPDATE rides 
			SET current_passengers = current_passengers + 1 
			WHERE id = $1`, rideID)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ride capacity"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Ride request " + req.Status + " successfully",
	})
}
