package handlers

import (
	"juno-backend/internal/database"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Notification struct {
	ID        int    `json:"id"`
	UserID    int    `json:"userId"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	Type      string `json:"type"` // ride_request, ride_update, friend_request
	Read      bool   `json:"read"`
	CreatedAt string `json:"createdAt"`
}

// Get user notifications
func HandleGetNotifications(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	rows, err := database.DB.Query(`
        SELECT id, user_id, title, message, type, read, created_at
        FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 50`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}
	defer rows.Close()

	var notifications []Notification
	for rows.Next() {
		var notif Notification
		err := rows.Scan(&notif.ID, &notif.UserID, &notif.Title, &notif.Message,
			&notif.Type, &notif.Read, &notif.CreatedAt)
		if err != nil {
			continue
		}
		notifications = append(notifications, notif)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Notifications fetched",
		"notifications": notifications,
	})
}

// Mark notification as read
func HandleMarkNotificationRead(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	notifID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	_, err = database.DB.Exec(`
        UPDATE notifications 
        SET read = true 
        WHERE id = $1 AND user_id = $2`, notifID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// Helper function to create notifications (used by other handlers)
func CreateNotification(userID int, title, message, notifType string) error {
	_, err := database.DB.Exec(`
        INSERT INTO notifications (user_id, title, message, type) 
        VALUES ($1, $2, $3, $4)`, userID, title, message, notifType)
	return err
}
