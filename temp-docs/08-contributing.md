# 🤝 Contributing

Welcome to the Juno Backend project! This guide will help you contribute effectively to our rideshare platform backend.

## 🎯 Contributing Philosophy

We welcome contributions that align with our mission of building a **safe**, **reliable**, and **user-friendly** rideshare platform for university students. Our development philosophy emphasizes:

- **🔒 Security First** - User safety and data protection are paramount
- **📱 Mobile-Optimized** - APIs designed for React Native performance
- **🧪 Test-Driven** - Comprehensive testing for reliability
- **📚 Documentation** - Clear documentation for maintainability
- **🌍 Inclusive** - Welcoming to developers of all skill levels

## 🚀 Quick Start for Contributors

### 1. Set Up Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/Juno-Backend.git
cd Juno-Backend

# Install dependencies
go mod download

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the application
go run cmd/server/main.go
```

### 2. Understand the Codebase

```
Juno-Backend/
├── cmd/server/main.go          # Application entry point
├── internal/
│   ├── api/handlers.go         # Business logic handlers
│   ├── auth/handlers.go        # Authentication logic
│   ├── database/connection.go  # Database layer
│   ├── middleware/auth.go      # Request middleware
│   └── routes/routes.go        # Route definitions
├── configs/config.go           # Configuration management
└── temp-docs/                  # Documentation (this folder)
```

### 3. Make Your First Contribution

1. **Pick an Issue** - Look for `good first issue` labels
2. **Create Branch** - `git checkout -b feature/your-feature-name`
3. **Write Code** - Follow our coding standards
4. **Write Tests** - Ensure your code is tested
5. **Submit PR** - Create a pull request with clear description

## 📋 Types of Contributions

### 🐛 Bug Fixes

**What We Need**:
- Fix authentication issues
- Resolve database connection problems
- Correct API response formatting
- Fix error handling edge cases

**How to Contribute**:
1. **Reproduce the bug** locally
2. **Write a test** that fails due to the bug
3. **Fix the bug** while keeping the test passing
4. **Verify the fix** doesn't break existing functionality

**Example Bug Fix**:
```go
// Before: JWT middleware doesn't handle missing token gracefully
func JWTAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization") // Could be empty
        // ... parsing without validation
    }
}

// After: Proper validation and error handling
func JWTAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "User not authenticated"})
            c.Abort()
            return
        }
        // ... rest of validation
    }
}
```

### ✨ New Features

**Current Priority Features**:
- **Push Notifications** - Real-time ride updates
- **Payment Integration** - Stripe/PayPal integration
- **Advanced Search** - Location-based ride filtering
- **Rating System** - User and ride ratings
- **Chat System** - In-app messaging

**Feature Development Process**:
1. **Discuss the feature** in an issue first
2. **Design the API** endpoints and data structures
3. **Update database schema** if needed
4. **Implement backend logic** with proper error handling
5. **Write comprehensive tests** for all scenarios
6. **Update documentation** with new endpoints

**Example Feature Implementation**:
```go
// New feature: Ride ratings
func SubmitRideRating(c *gin.Context) {
    userID := c.GetString("userID")
    rideID := c.Param("id")
    
    var rating struct {
        Score   int    `json:"score" binding:"required,min=1,max=5"`
        Comment string `json:"comment"`
    }
    
    if err := c.ShouldBindJSON(&rating); err != nil {
        c.JSON(400, gin.H{"error": "Invalid rating data"})
        return
    }
    
    // Validate user participated in ride
    if !userParticipatedInRide(userID, rideID) {
        c.JSON(403, gin.H{"error": "User did not participate in this ride"})
        return
    }
    
    // Save rating to database
    err := saveRideRating(userID, rideID, rating.Score, rating.Comment)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to save rating"})
        return
    }
    
    c.JSON(201, gin.H{"message": "Rating submitted successfully"})
}
```

### 📚 Documentation

**Documentation Needs**:
- **API endpoint examples** with request/response samples
- **Code comments** for complex business logic
- **Architecture decisions** and design patterns
- **Troubleshooting guides** for common issues
- **Deployment guides** for different environments

### 🧪 Testing

**Testing Priorities**:
- **Unit tests** for business logic functions
- **Integration tests** for API endpoints
- **Authentication tests** for security verification
- **Database tests** for data integrity
- **Performance tests** for scalability

## 🔧 Development Guidelines

### Code Style Standards

**Go Style Guidelines**:
```go
// ✅ Good: Clear function names and error handling
func CreateRide(c *gin.Context) {
    userID := c.GetString("userID")
    if userID == "" {
        c.JSON(401, gin.H{"error": "User not authenticated"})
        return
    }
    
    var rideData map[string]interface{}
    if err := c.ShouldBindJSON(&rideData); err != nil {
        c.JSON(400, gin.H{"error": "Invalid ride data"})
        return
    }
    
    // Validate ride data
    if err := validateRideData(rideData); err != nil {
        c.JSON(422, gin.H{"error": err.Error()})
        return
    }
    
    // Create ride in database
    rideID, err := createRideInDatabase(userID, rideData)
    if err != nil {
        log.Printf("Failed to create ride: %v", err)
        c.JSON(500, gin.H{"error": "Failed to create ride"})
        return
    }
    
    c.JSON(201, gin.H{"rideId": rideID, "message": "Ride created successfully"})
}

// ❌ Bad: No error handling, unclear variable names
func CreateRide(c *gin.Context) {
    u := c.GetString("userID")
    var d map[string]interface{}
    c.ShouldBindJSON(&d)
    id, _ := createRideInDatabase(u, d)
    c.JSON(201, gin.H{"id": id})
}
```

**Database Query Guidelines**:
```go
// ✅ Good: Parameterized queries, proper error handling
func getRideByID(rideID string) (*Ride, error) {
    var ride Ride
    err := database.DB.QueryRow(`
        SELECT id, driver_id, origin_address, destination_address, 
               departure_time, max_passengers, current_passengers
        FROM rides 
        WHERE id = $1 AND status = 'active'
    `, rideID).Scan(
        &ride.ID, &ride.DriverID, &ride.Origin, &ride.Destination,
        &ride.DepartureTime, &ride.MaxPassengers, &ride.CurrentPassengers,
    )
    
    if err == sql.ErrNoRows {
        return nil, fmt.Errorf("ride not found")
    }
    if err != nil {
        return nil, fmt.Errorf("database error: %v", err)
    }
    
    return &ride, nil
}

// ❌ Bad: SQL injection vulnerability, no error handling
func getRideByID(rideID string) *Ride {
    query := "SELECT * FROM rides WHERE id = " + rideID
    rows, _ := database.DB.Query(query)
    // ... unsafe code
}
```

### API Design Principles

**RESTful Endpoints**:
```
✅ Good API Design:
GET    /api/rides              # List rides
POST   /api/rides              # Create ride
GET    /api/rides/{id}         # Get specific ride
PUT    /api/rides/{id}         # Update ride
DELETE /api/rides/{id}         # Cancel ride
POST   /api/rides/{id}/join    # Join ride (action)

❌ Poor API Design:
GET    /api/getAllRides        # Non-RESTful naming
POST   /api/addNewRide         # Redundant "add new"
GET    /api/ride?id=123        # Should use path parameter
POST   /api/doJoinRide         # Unclear action
```

**Response Format Consistency**:
```go
// ✅ Good: Consistent response structure
type APIResponse struct {
    Data    interface{} `json:"data,omitempty"`
    Message string      `json:"message,omitempty"`
    Error   string      `json:"error,omitempty"`
    Status  int         `json:"status"`
}

// Success response
c.JSON(200, APIResponse{
    Data:    rides,
    Message: "Rides retrieved successfully",
    Status:  200,
})

// Error response
c.JSON(400, APIResponse{
    Error:  "Invalid ride data",
    Status: 400,
})
```

### Security Best Practices

**Input Validation**:
```go
func validateRideData(data map[string]interface{}) error {
    // Required fields
    required := []string{"origin", "destination", "departureTime", "maxPassengers"}
    for _, field := range required {
        if data[field] == nil || data[field] == "" {
            return fmt.Errorf("%s is required", field)
        }
    }
    
    // Validate passenger count
    if maxPassengers, ok := data["maxPassengers"].(float64); ok {
        if maxPassengers < 1 || maxPassengers > 8 {
            return fmt.Errorf("maxPassengers must be between 1 and 8")
        }
    }
    
    // Validate departure time
    if departureStr, ok := data["departureTime"].(string); ok {
        departureTime, err := time.Parse(time.RFC3339, departureStr)
        if err != nil {
            return fmt.Errorf("invalid departure time format")
        }
        if departureTime.Before(time.Now()) {
            return fmt.Errorf("departure time must be in the future")
        }
    }
    
    return nil
}
```

**Authorization Checks**:
```go
func requireRideOwnership(c *gin.Context) {
    userID := c.GetString("userID")
    rideID := c.Param("id")
    
    var driverID string
    err := database.DB.QueryRow(
        "SELECT driver_id FROM rides WHERE id = $1", 
        rideID,
    ).Scan(&driverID)
    
    if err == sql.ErrNoRows {
        c.JSON(404, gin.H{"error": "Ride not found"})
        c.Abort()
        return
    }
    
    if driverID != userID {
        c.JSON(403, gin.H{"error": "Access denied: not ride owner"})
        c.Abort()
        return
    }
    
    c.Next()
}
```

## 🧪 Testing Guidelines

### Unit Testing

**Test Structure**:
```go
func TestValidateRideData(t *testing.T) {
    tests := []struct {
        name        string
        rideData    map[string]interface{}
        expectError bool
        errorMsg    string
    }{
        {
            name: "valid ride data",
            rideData: map[string]interface{}{
                "origin":        "Campus Center",
                "destination":   "Airport",
                "departureTime": "2025-06-20T10:00:00Z",
                "maxPassengers": 4.0,
            },
            expectError: false,
        },
        {
            name: "missing origin",
            rideData: map[string]interface{}{
                "destination":   "Airport",
                "departureTime": "2025-06-20T10:00:00Z",
                "maxPassengers": 4.0,
            },
            expectError: true,
            errorMsg:    "origin is required",
        },
        {
            name: "invalid max passengers",
            rideData: map[string]interface{}{
                "origin":        "Campus Center",
                "destination":   "Airport",
                "departureTime": "2025-06-20T10:00:00Z",
                "maxPassengers": 10.0,
            },
            expectError: true,
            errorMsg:    "maxPassengers must be between 1 and 8",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := validateRideData(tt.rideData)
            
            if tt.expectError {
                assert.Error(t, err)
                assert.Contains(t, err.Error(), tt.errorMsg)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

### Integration Testing

**API Endpoint Testing**:
```go
func TestCreateRideEndpoint(t *testing.T) {
    // Setup test database and router
    setupTestDB()
    router := setupTestRouter()
    
    // Create test user and get JWT token
    userID := createTestUser("test@example.com")
    token := generateTestJWT(userID)
    
    // Test valid ride creation
    rideData := map[string]interface{}{
        "origin":        "Campus Center",
        "destination":   "Airport",
        "departureTime": "2025-06-20T10:00:00Z",
        "maxPassengers": 4,
    }
    
    body, _ := json.Marshal(rideData)
    req := httptest.NewRequest("POST", "/api/rides", bytes.NewBuffer(body))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    
    resp := httptest.NewRecorder()
    router.ServeHTTP(resp, req)
    
    assert.Equal(t, 201, resp.Code)
    
    var response map[string]interface{}
    json.Unmarshal(resp.Body.Bytes(), &response)
    assert.Contains(t, response, "rideId")
    assert.Equal(t, "Ride created successfully", response["message"])
}
```

### Database Testing

**Test Database Setup**:
```go
func setupTestDB() {
    // Use test database
    testDB, err := sql.Open("postgres", "postgresql://test:test@localhost/juno_test?sslmode=disable")
    if err != nil {
        panic(err)
    }
    
    database.DB = testDB
    
    // Run migrations
    runMigrations(testDB)
}

func cleanupTestDB() {
    // Clean up test data
    database.DB.Exec("TRUNCATE rides, users, user_profiles CASCADE")
}

func TestCreateRideInDatabase(t *testing.T) {
    setupTestDB()
    defer cleanupTestDB()
    
    userID := createTestUser("test@example.com")
    
    rideData := map[string]interface{}{
        "origin":        "Campus Center",
        "destination":   "Airport",
        "departureTime": "2025-06-20T10:00:00Z",
        "maxPassengers": 4,
    }
    
    rideID, err := createRideInDatabase(userID, rideData)
    
    assert.NoError(t, err)
    assert.NotEmpty(t, rideID)
    
    // Verify ride was created
    var count int
    database.DB.QueryRow("SELECT COUNT(*) FROM rides WHERE id = $1", rideID).Scan(&count)
    assert.Equal(t, 1, count)
}
```

## 📋 Pull Request Process

### Before Submitting

**Pre-submission Checklist**:
- [ ] **Code follows style guidelines** (run `gofmt` and `golint`)
- [ ] **All tests pass** (`go test ./...`)
- [ ] **New functionality has tests** (aim for >80% coverage)
- [ ] **Documentation is updated** (API docs, code comments)
- [ ] **No hardcoded secrets** or sensitive information
- [ ] **Error handling is comprehensive** and user-friendly
- [ ] **Database changes include migrations** if applicable

### Pull Request Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Screenshots (if applicable)
API response examples or relevant screenshots.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

**What Reviewers Look For**:
1. **Security** - No vulnerabilities or data exposure
2. **Performance** - Efficient database queries and API responses
3. **Maintainability** - Clear, readable, and well-documented code
4. **Testing** - Adequate test coverage and edge case handling
5. **API Design** - Consistent with existing patterns
6. **Error Handling** - Comprehensive and user-friendly

**Response Time Expectations**:
- **Initial review**: Within 2 business days
- **Follow-up reviews**: Within 1 business day
- **Emergency fixes**: Within 4 hours

## 🎯 Issue Guidelines

### Bug Reports

**Bug Report Template**:
```markdown
## Bug Description
Clear and concise description of what the bug is.

## To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
Clear description of what you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- **OS**: [e.g. macOS, Ubuntu]
- **Go version**: [e.g. 1.24]
- **Database**: [e.g. PostgreSQL 14]
- **API endpoint**: [e.g. POST /api/rides]

## Additional Context
- Error logs or screenshots
- Request/response examples
- Any other context about the problem
```

### Feature Requests

**Feature Request Template**:
```markdown
## Feature Description
Clear description of the feature you'd like to see.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
Detailed description of how this feature would work.

## API Design (if applicable)
```
POST /api/new-endpoint
{
  "field": "value"
}
```

## Database Changes (if applicable)
What new tables or fields would be needed?

## Alternative Solutions
Other ways to solve this problem.

## Additional Context
Any other context, mockups, or examples.
```

## 🏷️ Labeling System

| Label | Description | Usage |
|-------|-------------|-------|
| `bug` | Something isn't working | For confirmed bugs |
| `enhancement` | New feature or request | For feature requests |
| `good first issue` | Good for newcomers | Beginner-friendly issues |
| `help wanted` | Extra attention is needed | Complex issues needing help |
| `documentation` | Improvements to docs | Documentation tasks |
| `security` | Security-related issues | High priority security items |
| `performance` | Performance improvements | Optimization tasks |
| `api` | API-related changes | Endpoint modifications |
| `database` | Database-related changes | Schema or query changes |
| `testing` | Testing improvements | Test coverage or test fixes |

## 🌟 Recognition

**Contributors are recognized through**:
- **Changelog mentions** for significant contributions
- **GitHub contributor statistics** for ongoing participation
- **Code review participation** in project decisions
- **Mentorship opportunities** for experienced contributors

## 📞 Getting Help

**Where to Ask Questions**:
- **GitHub Issues** - For bugs, features, and development questions
- **Code Reviews** - For specific implementation feedback
- **Documentation** - Check existing docs first

**Response Time**:
- **General questions**: 1-2 business days
- **Critical bugs**: Same day
- **Feature discussions**: 3-5 business days

## 🎉 Welcome New Contributors!

We're excited to have you contribute to Juno Backend! Start with:

1. **Read the documentation** - Understand the project structure
2. **Set up your development environment** - Get the code running locally
3. **Look for good first issues** - Find an appropriate starting point
4. **Ask questions** - Don't hesitate to seek help when needed
5. **Make your first contribution** - Submit a small but meaningful change

**Remember**: Every contribution, no matter how small, helps make Juno better for university students everywhere. Thank you for being part of our community! 🚗✨

---

**Questions?** Open an issue or reach out to the maintainers. We're here to help!
