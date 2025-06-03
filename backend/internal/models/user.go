package models

import "time"

type User struct {
	ID             int       `json:"id" db:"id"`
	Username       string    `json:"username" db:"username"`
	Email          string    `json:"email" db:"email"`
	GoogleID       string    `json:"googleId" db:"google_id"`
	FirstName      string    `json:"firstName" db:"first_name"`
	LastName       string    `json:"lastName" db:"last_name"`
	Phone          string    `json:"phone" db:"phone"`
	ProfilePicture string    `json:"profilePicture" db:"profile_picture_url"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time `json:"updatedAt" db:"updated_at"`
}

type UserProfile struct {
	User
	School        string `json:"school" db:"school"`
	ClassYear     string `json:"classYear" db:"class_year"`
	Major         string `json:"major" db:"major"`
	HasCar        bool   `json:"hasCar" db:"has_car"`
	CarMake       string `json:"carMake" db:"car_make"`
	CarModel      string `json:"carModel" db:"car_model"`
	CarColor      string `json:"carColor" db:"car_color"`
	MaxPassengers int    `json:"maxPassengers" db:"max_passengers"`
	Bio           string `json:"bio" db:"bio"`
}

type UpdateProfileRequest struct {
	School        string `json:"school"`
	ClassYear     string `json:"classYear"`
	Major         string `json:"major"`
	HasCar        bool   `json:"hasCar"`
	CarMake       string `json:"carMake"`
	CarModel      string `json:"carModel"`
	CarColor      string `json:"carColor"`
	MaxPassengers int    `json:"maxPassengers"`
	Bio           string `json:"bio"`
	Phone         string `json:"phone"`
}
