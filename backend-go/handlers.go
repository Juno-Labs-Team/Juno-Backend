package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func handleDebugDB(c *gin.Context) {
    var count int
    err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "message":    "Database connection successful",
        "user_count": count,
    })
}

func handleGetUser(c *gin.Context) {
    // TODO: Implement JWT middleware to get user from token
    c.JSON(http.StatusOK, gin.H{"message": "Get user endpoint"})
}

func handleCreateRide(c *gin.Context) {
    // TODO: Implement ride creation
    c.JSON(http.StatusOK, gin.H{"message": "Create ride endpoint"})
}

func handleGetRides(c *gin.Context) {
    // TODO: Implement get rides
    c.JSON(http.StatusOK, gin.H{"message": "Get rides endpoint"})
}