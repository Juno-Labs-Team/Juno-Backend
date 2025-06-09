package handlers

import (
	"juno-backend/internal/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleDebugDB(c *gin.Context) {
	rows, err := database.DB.Query("SELECT id, username, first_name, last_name, email, created_at FROM users")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id int
		var username, firstName, lastName, email, createdAt string

		err := rows.Scan(&id, &username, &firstName, &lastName, &email, &createdAt)
		if err != nil {
			continue
		}

		users = append(users, map[string]interface{}{
			"id":        id,
			"username":  username,
			"firstName": firstName,
			"lastName":  lastName,
			"email":     email,
			"createdAt": createdAt,
		})
	}

	// Get table count
	tablesRows, err := database.DB.Query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    `)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tablesRows.Close()

	var tables []string
	for tablesRows.Next() {
		var tableName string
		if err := tablesRows.Scan(&tableName); err == nil {
			tables = append(tables, tableName)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Database status",
		"tables":     tables,
		"users":      users,
		"totalUsers": len(users),
	})
}
