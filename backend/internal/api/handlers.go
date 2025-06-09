package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Profile handlers
func GetProfile(c *gin.Context) {
	userID := c.GetString("userID")

	// TODO: Fetch from database
	c.JSON(http.StatusOK, gin.H{
		"message": "✅ Get profile endpoint working",
		"userID":  userID,
		"status":  "coming soon",
	})
}

func UpdateProfile(c *gin.Context) {
	userID := c.GetString("userID")

	// TODO: Update database
	c.JSON(http.StatusOK, gin.H{
		"message": "✅ Update profile endpoint working",
		"userID":  userID,
		"status":  "coming soon",
	})
}

// Friend handlers
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

func AddFriend(c *gin.Context) {
	userID := c.GetString("userID")

	// TODO: Add friend to database
	c.JSON(http.StatusOK, gin.H{
		"message": "✅ Add friend endpoint working",
		"userID":  userID,
		"status":  "coming soon",
	})
}

// Ride handlers
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

func CreateRide(c *gin.Context) {
	userID := c.GetString("userID")

	// TODO: Create ride in database
	c.JSON(http.StatusOK, gin.H{
		"message": "✅ Create ride endpoint working",
		"userID":  userID,
		"status":  "coming soon",
	})
}
