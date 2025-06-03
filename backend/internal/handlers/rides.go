package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleCreateRide(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Create ride endpoint - coming soon"})
}

func HandleGetRides(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Get rides endpoint - coming soon"})
}
