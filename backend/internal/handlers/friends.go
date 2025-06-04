package handlers

import (
	"juno-backend/internal/database"
	"juno-backend/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Send friend request
func HandleSendFriendRequest(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	friendID, err := strconv.Atoi(c.Param("friendId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friend ID"})
		return
	}

	if userID == friendID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot send friend request to yourself"})
		return
	}

	// Check if friendship already exists
	var existingID int
	err = database.DB.QueryRow(`
        SELECT id FROM friendships 
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
		userID, friendID).Scan(&existingID)

	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Friendship request already exists"})
		return
	}

	// Create friend request
	_, err = database.DB.Exec(`
        INSERT INTO friendships (user_id, friend_id, status) 
        VALUES ($1, $2, 'pending')`,
		userID, friendID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send friend request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request sent successfully"})
}

// Accept friend request
func HandleAcceptFriendRequest(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	friendshipID, err := strconv.Atoi(c.Param("friendshipId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friendship ID"})
		return
	}

	// Update friendship status to accepted
	result, err := database.DB.Exec(`
        UPDATE friendships 
        SET status = 'accepted' 
        WHERE id = $1 AND friend_id = $2 AND status = 'pending'`,
		friendshipID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept friend request"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Friend request not found or already processed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request accepted"})
}

// Get friends list
func HandleGetFriends(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	rows, err := database.DB.Query(`
        SELECT 
            u.id, u.username, u.email, u.first_name, u.last_name, u.profile_picture_url,
            COALESCE(up.school, '') as school,
            COALESCE(up.class_year, '') as class_year,
            COALESCE(up.has_car, false) as has_car,
            COALESCE(up.car_make, '') as car_make,
            COALESCE(up.car_model, '') as car_model
        FROM friendships f
        JOIN users u ON (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END) = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'`,
		userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch friends"})
		return
	}
	defer rows.Close()

	var friends []models.FriendUser
	for rows.Next() {
		var friend models.FriendUser
		err := rows.Scan(
			&friend.ID, &friend.Username, &friend.Email, &friend.FirstName, &friend.LastName,
			&friend.ProfilePicture, &friend.School, &friend.ClassYear, &friend.HasCar,
			&friend.CarMake, &friend.CarModel)

		if err != nil {
			continue
		}
		friend.FriendshipStatus = "accepted"
		friends = append(friends, friend)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Friends fetched successfully",
		"friends": friends,
	})
}

// Get pending friend requests
func HandleGetFriendRequests(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	rows, err := database.DB.Query(`
        SELECT 
            f.id, f.user_id, f.friend_id, f.status, f.created_at,
            u.first_name, u.last_name, u.email, u.username
        FROM friendships f
        JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = $1 AND f.status = 'pending'
        ORDER BY f.created_at DESC`,
		userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch friend requests"})
		return
	}
	defer rows.Close()

	var requests []models.FriendRequest
	for rows.Next() {
		var req models.FriendRequest
		err := rows.Scan(
			&req.ID, &req.RequesterID, &req.RequesteeID, &req.Status, &req.CreatedAt,
			&req.RequesterName, &req.RequesterName, &req.RequesteeEmail, &req.RequesterName)

		if err != nil {
			continue
		}
		requests = append(requests, req)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Friend requests fetched successfully",
		"requests": requests,
	})
}

// Search users (for adding friends)
func HandleSearchUsers(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query required"})
		return
	}

	rows, err := database.DB.Query(`
        SELECT 
            u.id, u.username, u.email, u.first_name, u.last_name, u.profile_picture_url,
            COALESCE(up.school, '') as school,
            COALESCE(up.class_year, '') as class_year,
            COALESCE(up.has_car, false) as has_car,
            COALESCE(up.car_make, '') as car_make,
            COALESCE(up.car_model, '') as car_model,
            COALESCE(f.status, 'none') as friendship_status
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN friendships f ON (
            (f.user_id = $1 AND f.friend_id = u.id) OR 
            (f.friend_id = $1 AND f.user_id = u.id)
        )
        WHERE u.id != $1 
        AND (
            u.first_name ILIKE $2 OR 
            u.last_name ILIKE $2 OR 
            u.username ILIKE $2 OR 
            u.email ILIKE $2
        )
        LIMIT 20`,
		userID, "%"+query+"%")

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users"})
		return
	}
	defer rows.Close()

	var users []models.FriendUser
	for rows.Next() {
		var user models.FriendUser
		err := rows.Scan(
			&user.ID, &user.Username, &user.Email, &user.FirstName, &user.LastName,
			&user.ProfilePicture, &user.School, &user.ClassYear, &user.HasCar,
			&user.CarMake, &user.CarModel, &user.FriendshipStatus)

		if err != nil {
			continue
		}
		users = append(users, user)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Users found",
		"users":   users,
	})
}
