package models

import "time"

type Ride struct {
	ID                   int       `json:"id" db:"id"`
	DriverID             int       `json:"driverId" db:"driver_id"`
	Title                string    `json:"title" db:"title"`
	Description          string    `json:"description" db:"description"`
	PickupLocation       string    `json:"pickupLocation" db:"pickup_location"`
	PickupLatitude       float64   `json:"pickupLatitude" db:"pickup_latitude"`
	PickupLongitude      float64   `json:"pickupLongitude" db:"pickup_longitude"`
	Destination          string    `json:"destination" db:"destination"`
	DestinationLatitude  float64   `json:"destinationLatitude" db:"destination_latitude"`
	DestinationLongitude float64   `json:"destinationLongitude" db:"destination_longitude"`
	DepartureTime        time.Time `json:"departureTime" db:"departure_time"`
	MaxPassengers        int       `json:"maxPassengers" db:"max_passengers"`
	CurrentPassengers    int       `json:"currentPassengers" db:"current_passengers"`
	IsRecurring          bool      `json:"isRecurring" db:"is_recurring"`
	RecurrencePattern    string    `json:"recurrencePattern" db:"recurrence_pattern"`
	Status               string    `json:"status" db:"status"`
	CreatedAt            time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt            time.Time `json:"updatedAt" db:"updated_at"`

	// Additional fields for API responses
	DriverName     string `json:"driverName"`
	DriverEmail    string `json:"driverEmail"`
	AvailableSpots int    `json:"availableSpots"`
	IsDriver       bool   `json:"isDriver"`
	IsPassenger    bool   `json:"isPassenger"`
}

type CreateRideRequest struct {
	Title                string    `json:"title" binding:"required"`
	Description          string    `json:"description"`
	PickupLocation       string    `json:"pickupLocation" binding:"required"`
	PickupLatitude       float64   `json:"pickupLatitude"`
	PickupLongitude      float64   `json:"pickupLongitude"`
	Destination          string    `json:"destination" binding:"required"`
	DestinationLatitude  float64   `json:"destinationLatitude"`
	DestinationLongitude float64   `json:"destinationLongitude"`
	DepartureTime        time.Time `json:"departureTime" binding:"required"`
	MaxPassengers        int       `json:"maxPassengers" binding:"required,min=1,max=8"`
	IsRecurring          bool      `json:"isRecurring"`
	RecurrencePattern    string    `json:"recurrencePattern"`
}

type RideRequest struct {
	ID          int       `json:"id" db:"id"`
	RideID      int       `json:"rideId" db:"ride_id"`
	PassengerID int       `json:"passengerId" db:"passenger_id"`
	Status      string    `json:"status" db:"status"` // pending, accepted, declined
	Message     string    `json:"message" db:"message"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`

	// Additional fields for API responses
	PassengerName  string `json:"passengerName"`
	PassengerEmail string `json:"passengerEmail"`
	RideTitle      string `json:"rideTitle"`
}
