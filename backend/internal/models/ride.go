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
}
