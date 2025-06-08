package handlers

import (
	"juno-backend/internal/database"
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

	var rideData struct {
		Origin         string  `json:"origin" binding:"required"`
		Destination    string  `json:"destination" binding:"required"`
		DepartureTime  string  `json:"departureTime" binding:"required"`
		AvailableSeats int     `json:"availableSeats" binding:"required"`
		Price          float64 `json:"price"`
		Notes          string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&rideData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var rideID int
	err := database.DB.QueryRow(`
		INSERT INTO rides (driver_id, origin, destination, departure_time, available_seats, price, notes, status) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') 
		RETURNING id`,
		userID, rideData.Origin, rideData.Destination, rideData.DepartureTime,
		rideData.AvailableSeats, rideData.Price, rideData.Notes).Scan(&rideID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ride"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
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

	// Use userID to get user's rides
	rows, err := database.DB.Query(`
		SELECT id, driver_id, origin, destination, departure_time, available_seats, status 
		FROM rides 
		WHERE driver_id = $1 OR id IN (
			SELECT ride_id FROM ride_participants WHERE user_id = $1
		)
		ORDER BY departure_time ASC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rides"})
		return
	}
	defer rows.Close()

	var rides []map[string]interface{}
	for rows.Next() {
		var ride map[string]interface{} = make(map[string]interface{})
		var id, driverID, availableSeats int
		var origin, destination, status string
		var departureTime string

		err := rows.Scan(&id, &driverID, &origin, &destination, &departureTime, &availableSeats, &status)
		if err != nil {
			continue
		}

		ride["id"] = id
		ride["driverId"] = driverID
		ride["origin"] = origin
		ride["destination"] = destination
		ride["departureTime"] = departureTime
		ride["availableSeats"] = availableSeats
		ride["status"] = status

		rides = append(rides, ride)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Rides retrieved successfully",
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

	rideIDStr := c.Param("rideId")
	rideID, err := strconv.Atoi(rideIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride ID"})
		return
	}

	// Check if ride exists and has available seats
	var availableSeats int
	var driverID int
	err = database.DB.QueryRow("SELECT available_seats, driver_id FROM rides WHERE id = $1 AND status = 'active'", rideID).Scan(&availableSeats, &driverID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ride not found or inactive"})
		return
	}

	// Check if user is the driver
	if driverID == userID.(int) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot join your own ride"})
		return
	}

	// Check if user already joined
	var existingID int
	err = database.DB.QueryRow("SELECT id FROM ride_participants WHERE ride_id = $1 AND user_id = $2", rideID, userID).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already joined this ride"})
		return
	}

	if availableSeats <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No available seats"})
		return
	}

	// Add user to ride
	_, err = database.DB.Exec("INSERT INTO ride_participants (ride_id, user_id, status) VALUES ($1, $2, 'confirmed')", rideID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join ride"})
		return
	}

	// Update available seats
	_, err = database.DB.Exec("UPDATE rides SET available_seats = available_seats - 1 WHERE id = $1", rideID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ride"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully joined ride",
		"rideId":  rideID,
	})
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

// Get nearby rides
func HandleGetNearbyRides(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get rides that user hasn't joined and isn't driving
	rows, err := database.DB.Query(`
		SELECT r.id, r.driver_id, r.origin, r.destination, r.departure_time, r.available_seats, r.price, u.username 
		FROM rides r
		JOIN users u ON r.driver_id = u.id
		WHERE r.status = 'active' 
		AND r.available_seats > 0 
		AND r.driver_id != $1
		AND r.id NOT IN (
			SELECT ride_id FROM ride_participants WHERE user_id = $1
		)
		ORDER BY r.departure_time ASC
		LIMIT 20
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch nearby rides"})
		return
	}
	defer rows.Close()

	var rides []map[string]interface{}
	for rows.Next() {
		var ride map[string]interface{} = make(map[string]interface{})
		var id, driverID, availableSeats int
		var origin, destination, departureTime, driverUsername string
		var price float64

		err := rows.Scan(&id, &driverID, &origin, &destination, &departureTime, &availableSeats, &price, &driverUsername)
		if err != nil {
			continue
		}

		ride["id"] = id
		ride["driverId"] = driverID
		ride["driverUsername"] = driverUsername
		ride["origin"] = origin
		ride["destination"] = destination
		ride["departureTime"] = departureTime
		ride["availableSeats"] = availableSeats
		ride["price"] = price

		rides = append(rides, ride)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Nearby rides retrieved successfully",
		"rides":   rides,
	})
}

// Get ride details
func HandleGetRideDetails(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	rideIDStr := c.Param("rideId")
	rideID, err := strconv.Atoi(rideIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride ID"})
		return
	}

	var ride map[string]interface{} = make(map[string]interface{})
	var id, driverID, availableSeats int
	var origin, destination, status, driverUsername string
	var departureTime string
	var price float64

	err = database.DB.QueryRow(`
		SELECT r.id, r.driver_id, r.origin, r.destination, r.departure_time, 
		       r.available_seats, r.price, r.status, u.username 
		FROM rides r
		JOIN users u ON r.driver_id = u.id
		WHERE r.id = $1
	`, rideID).Scan(&id, &driverID, &origin, &destination, &departureTime, 
		&availableSeats, &price, &status, &driverUsername)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ride not found"})
		return
	}

	ride["id"] = id
	ride["driverId"] = driverID
	ride["driverUsername"] = driverUsername
	ride["origin"] = origin
	ride["destination"] = destination
	ride["departureTime"] = departureTime
	ride["availableSeats"] = availableSeats
	ride["price"] = price
	ride["status"] = status
	ride["isDriver"] = driverID == userID.(int)
	// Check if user is a passenger
	var passengerExists int
	database.DB.QueryRow("SELECT COUNT(*) FROM ride_participants WHERE ride_id = $1 AND user_id = $2", 
		rideID, userID).Scan(&passengerExists)
	ride["isPassenger"] = passengerExists > 0

	c.JSON(http.StatusOK, gin.H{
		"message": "Ride details retrieved successfully",
		"ride":    ride,
	})
}

// Leave a ride
func HandleLeaveRide(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	rideIDStr := c.Param("rideId")
	rideID, err := strconv.Atoi(rideIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride ID"})
		return
	}

	// Remove user from ride participants
	result, err := database.DB.Exec("DELETE FROM ride_participants WHERE ride_id = $1 AND user_id = $2", 
		rideID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave ride"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "You are not a participant in this ride"})
		return
	}

	// Update available seats
	_, err = database.DB.Exec("UPDATE rides SET available_seats = available_seats + 1 WHERE id = $1", rideID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ride capacity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully left the ride",
	})
}

// Cancel a ride (driver only)
func HandleCancelRide(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	rideIDStr := c.Param("rideId")
	rideID, err := strconv.Atoi(rideIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ride ID"})
		return
	}

	// Update ride status to cancelled (only if user is the driver)
	result, err := database.DB.Exec("UPDATE rides SET status = 'cancelled' WHERE id = $1 AND driver_id = $2", 
		rideID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel ride"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only cancel your own rides"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Ride cancelled successfully",
	})
}
