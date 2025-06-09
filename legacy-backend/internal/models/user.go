package models

import "time"

type User struct {
	ID             int       `json:"id" db:"id"`
	Username       string    `json:"username" db:"username"`
	Email          string    `json:"email" db:"email"`
	GoogleID       string    `json:"googleId,omitempty" db:"google_id"`
	FirstName      string    `json:"firstName" db:"first_name"`
	LastName       string    `json:"lastName" db:"last_name"`
	Phone          string    `json:"phone" db:"phone"`
	ProfilePicture string    `json:"profilePicture" db:"profile_picture_url"`
	EmailVerified  bool      `json:"emailVerified" db:"email_verified"`
	IsActive       bool      `json:"isActive" db:"is_active"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time `json:"updatedAt" db:"updated_at"`
}

type UserProfile struct {
	User
	School                      string  `json:"school" db:"school"`
	ClassYear                   string  `json:"classYear" db:"class_year"`
	Major                       string  `json:"major" db:"major"`
	HasCar                      bool    `json:"hasCar" db:"has_car"`
	CarMake                     string  `json:"carMake" db:"car_make"`
	CarModel                    string  `json:"carModel" db:"car_model"`
	CarColor                    string  `json:"carColor" db:"car_color"`
	CarYear                     int     `json:"carYear" db:"car_year"`
	MaxPassengers               int     `json:"maxPassengers" db:"max_passengers"`
	Bio                         string  `json:"bio" db:"bio"`
	Rating                      float64 `json:"rating" db:"rating"`
	TotalRidesGiven             int     `json:"totalRidesGiven" db:"total_rides_given"`
	TotalRidesTaken             int     `json:"totalRidesTaken" db:"total_rides_taken"`
	OnboardingCompleted         bool    `json:"onboardingCompleted" db:"onboarding_completed"`
	OnboardingStep              int     `json:"onboardingStep" db:"onboarding_step"`
	ProfileCompletionPercentage int     `json:"profileCompletionPercentage"`
}

type UpdateProfileRequest struct {
	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	Username       string `json:"username"`
	Phone          string `json:"phone"`
	ProfilePicture string `json:"profilePicture"`
	School         string `json:"school"`
	ClassYear      string `json:"classYear"`
	Major          string `json:"major"`
	HasCar         bool   `json:"hasCar"`
	CarMake        string `json:"carMake"`
	CarModel       string `json:"carModel"`
	CarColor       string `json:"carColor"`
	CarYear        int    `json:"carYear"`
	MaxPassengers  int    `json:"maxPassengers"`
	Bio            string `json:"bio"`
}

// Friend Models
type Friendship struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"userId" db:"user_id"`
	FriendID  int       `json:"friendId" db:"friend_id"`
	Status    string    `json:"status" db:"status"` // pending, accepted, blocked
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}

type FriendRequest struct {
	ID             int       `json:"id" db:"id"`
	RequesterID    int       `json:"requesterId" db:"user_id"`
	RequesteeID    int       `json:"requesteeId" db:"friend_id"`
	Status         string    `json:"status" db:"status"`
	RequesterName  string    `json:"requesterName"`
	RequesteeEmail string    `json:"requesteeEmail"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
}

type FriendUser struct {
	User
	FriendshipStatus string `json:"friendshipStatus"`
	School           string `json:"school"`
	ClassYear        string `json:"classYear"`
	HasCar           bool   `json:"hasCar"`
	CarMake          string `json:"carMake"`
	CarModel         string `json:"carModel"`
}
