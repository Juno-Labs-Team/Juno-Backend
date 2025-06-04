package handlers

import (
	"encoding/json"
	"fmt"
	"juno-backend/internal/database"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

type GeocodeResponse struct {
	Results []struct {
		Geometry struct {
			Location struct {
				Lat float64 `json:"lat"`
				Lng float64 `json:"lng"`
			} `json:"location"`
		} `json:"geometry"`
		FormattedAddress string `json:"formatted_address"`
	} `json:"results"`
	Status string `json:"status"`
}

type DistanceResponse struct {
	Rows []struct {
		Elements []struct {
			Distance struct {
				Text  string `json:"text"`
				Value int    `json:"value"`
			} `json:"distance"`
			Duration struct {
				Text  string `json:"text"`
				Value int    `json:"value"`
			} `json:"duration"`
			Status string `json:"status"`
		} `json:"elements"`
	} `json:"rows"`
	Status string `json:"status"`
}

// Convert address to coordinates
func HandleGeocodeAddress(c *gin.Context) {
	address := c.Query("address")
	if address == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Address required"})
		return
	}

	apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Google Maps API not configured"})
		return
	}

	geocodeURL := fmt.Sprintf("https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s",
		url.QueryEscape(address), apiKey)

	resp, err := http.Get(geocodeURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Geocoding request failed"})
		return
	}
	defer resp.Body.Close()

	var result GeocodeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse geocoding response"})
		return
	}

	if result.Status != "OK" || len(result.Results) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Address not found"})
		return
	}

	location := result.Results[0]
	c.JSON(http.StatusOK, gin.H{
		"address":   location.FormattedAddress,
		"latitude":  location.Geometry.Location.Lat,
		"longitude": location.Geometry.Location.Lng,
	})
}

// Calculate distance and time between two locations
func HandleCalculateDistance(c *gin.Context) {
	origin := c.Query("origin")
	destination := c.Query("destination")

	if origin == "" || destination == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Origin and destination required"})
		return
	}

	apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Google Maps API not configured"})
		return
	}

	distanceURL := fmt.Sprintf("https://maps.googleapis.com/maps/api/distancematrix/json?origins=%s&destinations=%s&key=%s",
		url.QueryEscape(origin), url.QueryEscape(destination), apiKey)

	resp, err := http.Get(distanceURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Distance calculation failed"})
		return
	}
	defer resp.Body.Close()

	var result DistanceResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse distance response"})
		return
	}

	if result.Status != "OK" || len(result.Rows) == 0 || len(result.Rows[0].Elements) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Could not calculate distance"})
		return
	}

	element := result.Rows[0].Elements[0]
	if element.Status != "OK" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Route not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"distance": gin.H{
			"text":  element.Distance.Text,
			"value": element.Distance.Value, // meters
		},
		"duration": gin.H{
			"text":  element.Duration.Text,
			"value": element.Duration.Value, // seconds
		},
	})
}

// Find nearby rides based on pickup/destination proximity
func HandleFindNearbyRides(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	pickupLat := c.Query("pickup_lat")
	pickupLng := c.Query("pickup_lng")
	radius := c.DefaultQuery("radius", "10") // km

	if pickupLat == "" || pickupLng == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pickup coordinates required"})
		return
	}

	// Find rides within radius using Haversine formula
	query := `
        SELECT 
            r.id, r.driver_id, r.title, r.pickup_location, r.destination,
            r.departure_time, r.max_passengers, r.current_passengers,
            r.pickup_latitude, r.pickup_longitude,
            u.first_name, u.last_name,
            -- Calculate distance using Haversine formula
            (6371 * acos(cos(radians($2)) * cos(radians(r.pickup_latitude)) * 
            cos(radians(r.pickup_longitude) - radians($3)) + 
            sin(radians($2)) * sin(radians(r.pickup_latitude)))) AS distance_km
        FROM rides r
        JOIN users u ON r.driver_id = u.id
        WHERE r.status = 'active' 
        AND r.departure_time > NOW()
        AND r.driver_id != $1
        AND r.driver_id IN (
            SELECT CASE 
                WHEN f.user_id = $1 THEN f.friend_id 
                ELSE f.user_id 
            END
            FROM friendships f 
            WHERE (f.user_id = $1 OR f.friend_id = $1) 
            AND f.status = 'accepted'
        )
        HAVING distance_km <= $4
        ORDER BY distance_km ASC, r.departure_time ASC
        LIMIT 20`

	rows, err := database.DB.Query(query, userID, pickupLat, pickupLng, radius)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search nearby rides"})
		return
	}
	defer rows.Close()

	var rides []map[string]interface{}
	for rows.Next() {
		var ride map[string]interface{} = make(map[string]interface{})
		var id, driverID, maxPass, currentPass int
		var title, pickup, dest, firstName, lastName string
		var departureTime time.Time
		var pickupLat, pickupLng, distance float64

		err := rows.Scan(&id, &driverID, &title, &pickup, &dest, &departureTime,
			&maxPass, &currentPass, &pickupLat, &pickupLng, &firstName, &lastName, &distance)
		if err != nil {
			continue
		}

		ride["id"] = id
		ride["title"] = title
		ride["pickupLocation"] = pickup
		ride["destination"] = dest
		ride["departureTime"] = departureTime
		ride["availableSpots"] = maxPass - currentPass
		ride["driverName"] = firstName + " " + lastName
		ride["distanceKm"] = fmt.Sprintf("%.1f km", distance)

		rides = append(rides, ride)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Nearby rides found",
		"rides":   rides,
	})
}
