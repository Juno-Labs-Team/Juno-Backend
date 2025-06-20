# 🚨 Error Handling

Comprehensive guide to error handling, debugging, and troubleshooting in the Juno Backend API.

## 🎯 Error Handling Philosophy

The Juno Backend follows these error handling principles:

- **🔍 Transparency** - Clear, actionable error messages
- **🏷️ Consistency** - Standardized error format across all endpoints
- **🛡️ Security** - No sensitive information in error responses
- **📊 Logging** - Comprehensive error logging for debugging
- **🔄 Recovery** - Graceful degradation and recovery suggestions

## 📋 Error Response Format

All error responses follow this consistent structure:

```json
{
  "error": "Human-readable error message",
  "details": {
    "field": "specific_field_name",
    "code": "ERROR_CODE",
    "message": "Detailed technical explanation"
  },
  "status": 400,
  "timestamp": "2025-06-19T16:00:00Z",
  "path": "/api/profile",
  "method": "PUT"
}
```

### Error Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | User-friendly error message |
| `details` | object | Technical details for debugging |
| `details.field` | string | Specific field that caused the error |
| `details.code` | string | Machine-readable error code |
| `details.message` | string | Technical explanation |
| `status` | number | HTTP status code |
| `timestamp` | string | ISO 8601 timestamp |
| `path` | string | API endpoint path |
| `method` | string | HTTP method |

## 📊 HTTP Status Codes

### 2xx Success Codes

| Code | Name | Usage |
|------|------|-------|
| **200** | OK | Successful GET, PUT requests |
| **201** | Created | Resource successfully created |
| **204** | No Content | Successful DELETE, empty response |

### 4xx Client Error Codes

| Code | Name | When Used | Example |
|------|------|-----------|---------|
| **400** | Bad Request | Invalid request syntax or data | Missing required fields |
| **401** | Unauthorized | Authentication required | Missing JWT token |
| **403** | Forbidden | Access denied | User not ride owner |
| **404** | Not Found | Resource doesn't exist | Ride ID not found |
| **409** | Conflict | Resource conflict | Already joined ride |
| **422** | Unprocessable Entity | Validation errors | Invalid email format |
| **429** | Too Many Requests | Rate limiting | API rate limit exceeded |

### 5xx Server Error Codes

| Code | Name | When Used | Example |
|------|------|-----------|---------|
| **500** | Internal Server Error | Unexpected server error | Database connection failed |
| **502** | Bad Gateway | Upstream service error | OAuth service unavailable |
| **503** | Service Unavailable | Service temporarily down | Database maintenance |
| **504** | Gateway Timeout | Request timeout | Slow database query |

## 🔍 Error Categories

### Authentication Errors

#### Missing JWT Token

```json
{
  "error": "User not authenticated",
  "details": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authorization header with Bearer token is required"
  },
  "status": 401,
  "timestamp": "2025-06-19T16:00:00Z",
  "path": "/api/profile"
}
```

**Causes**:
- Missing `Authorization` header
- Invalid Bearer token format
- Empty token value

**Solutions**:
```bash
# ✅ Correct format
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ❌ Wrong formats
curl -H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Missing "Bearer"
curl -H "Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."        # Wrong header name
```

#### Invalid JWT Token

```json
{
  "error": "User not authenticated",
  "details": {
    "code": "INVALID_TOKEN",
    "message": "JWT token is invalid or expired"
  },
  "status": 401,
  "timestamp": "2025-06-19T16:00:00Z"
}
```

**Common Causes**:
- Token has expired (7-day expiry)
- Token signature is invalid
- JWT secret mismatch
- Malformed token

**Debug Steps**:
1. **Check token expiry** at [jwt.io](https://jwt.io/)
2. **Verify JWT secret** matches server configuration
3. **Re-authenticate** via OAuth flow

### Validation Errors

#### Missing Required Fields

```json
{
  "error": "Validation failed",
  "details": {
    "field": "origin",
    "code": "FIELD_REQUIRED",
    "message": "Origin address is required for ride creation"
  },
  "status": 422,
  "timestamp": "2025-06-19T16:00:00Z",
  "path": "/api/rides",
  "method": "POST"
}
```

#### Invalid Field Format

```json
{
  "error": "Validation failed",
  "details": {
    "field": "departureTime",
    "code": "INVALID_FORMAT",
    "message": "Departure time must be in ISO 8601 format (e.g., 2025-06-20T10:00:00Z)"
  },
  "status": 422,
  "timestamp": "2025-06-19T16:00:00Z"
}
```

#### Business Rule Violations

```json
{
  "error": "Validation failed",
  "details": {
    "field": "departureTime",
    "code": "INVALID_VALUE",
    "message": "Departure time must be in the future"
  },
  "status": 422,
  "timestamp": "2025-06-19T16:00:00Z"
}
```

### Resource Errors

#### Resource Not Found

```json
{
  "error": "Resource not found",
  "details": {
    "code": "RIDE_NOT_FOUND",
    "message": "Ride with ID 999 does not exist"
  },
  "status": 404,
  "timestamp": "2025-06-19T16:00:00Z",
  "path": "/api/rides/999"
}
```

#### Permission Denied

```json
{
  "error": "Access denied",
  "details": {
    "code": "PERMISSION_DENIED",
    "message": "Only the ride driver can cancel this ride"
  },
  "status": 403,
  "timestamp": "2025-06-19T16:00:00Z"
}
```

#### Resource Conflict

```json
{
  "error": "Resource conflict",
  "details": {
    "code": "ALREADY_JOINED",
    "message": "User is already a passenger on this ride"
  },
  "status": 409,
  "timestamp": "2025-06-19T16:00:00Z"
}
```

### Database Errors

#### Connection Failed

```json
{
  "error": "Database error",
  "details": {
    "code": "DB_CONNECTION_FAILED",
    "message": "Unable to connect to database"
  },
  "status": 500,
  "timestamp": "2025-06-19T16:00:00Z"
}
```

#### Query Timeout

```json
{
  "error": "Database error",
  "details": {
    "code": "DB_QUERY_TIMEOUT",
    "message": "Database query timed out"
  },
  "status": 500,
  "timestamp": "2025-06-19T16:00:00Z"
}
```

## 🛠️ Error Handling Implementation

### Go Error Handling Patterns

**Input Validation**:
```go
func validateRideData(data map[string]interface{}) error {
    // Check required fields
    required := []string{"origin", "destination", "departureTime"}
    
    for _, field := range required {
        if data[field] == nil || data[field] == "" {
            return &ValidationError{
                Field:   field,
                Code:    "FIELD_REQUIRED",
                Message: fmt.Sprintf("%s is required", field),
            }
        }
    }
    
    // Validate departure time format and value
    if departureStr, ok := data["departureTime"].(string); ok {
        departureTime, err := time.Parse(time.RFC3339, departureStr)
        if err != nil {
            return &ValidationError{
                Field:   "departureTime",
                Code:    "INVALID_FORMAT",
                Message: "Departure time must be in ISO 8601 format",
            }
        }
        
        if departureTime.Before(time.Now()) {
            return &ValidationError{
                Field:   "departureTime",
                Code:    "INVALID_VALUE",
                Message: "Departure time must be in the future",
            }
        }
    }
    
    return nil
}
```

**Custom Error Types**:
```go
type ValidationError struct {
    Field   string
    Code    string
    Message string
}

func (e *ValidationError) Error() string {
    return e.Message
}

type AuthError struct {
    Code    string
    Message string
}

func (e *AuthError) Error() string {
    return e.Message
}

type DatabaseError struct {
    Code    string
    Message string
    Query   string
}

func (e *DatabaseError) Error() string {
    return e.Message
}
```

**Error Response Helper**:
```go
func handleError(c *gin.Context, err error) {
    errorResponse := gin.H{
        "timestamp": time.Now().Format(time.RFC3339),
        "path":      c.Request.URL.Path,
        "method":    c.Request.Method,
    }
    
    switch e := err.(type) {
    case *ValidationError:
        errorResponse["error"] = "Validation failed"
        errorResponse["details"] = gin.H{
            "field":   e.Field,
            "code":    e.Code,
            "message": e.Message,
        }
        errorResponse["status"] = 422
        c.JSON(422, errorResponse)
        
    case *AuthError:
        errorResponse["error"] = "Authentication failed"
        errorResponse["details"] = gin.H{
            "code":    e.Code,
            "message": e.Message,
        }
        errorResponse["status"] = 401
        c.JSON(401, errorResponse)
        
    case *DatabaseError:
        // Log sensitive details server-side only
        log.Printf("Database error: %s, Query: %s", e.Message, e.Query)
        
        errorResponse["error"] = "Database error"
        errorResponse["details"] = gin.H{
            "code":    e.Code,
            "message": "An internal database error occurred",
        }
        errorResponse["status"] = 500
        c.JSON(500, errorResponse)
        
    default:
        // Generic server error
        log.Printf("Unexpected error: %v", err)
        errorResponse["error"] = "Internal server error"
        errorResponse["details"] = gin.H{
            "code":    "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
        }
        errorResponse["status"] = 500
        c.JSON(500, errorResponse)
    }
}
```

## 🔍 Debugging Techniques

### Server-Side Logging

**Log Levels**:
```go
import "log"

// Info: Normal operation
log.Printf("✅ User %s created ride %s", userID, rideID)

// Warning: Potential issues
log.Printf("⚠️ User %s attempted to join full ride %s", userID, rideID)

// Error: Actual problems
log.Printf("❌ Database error in CreateRide: %v", err)

// Debug: Development details
if os.Getenv("GIN_MODE") == "debug" {
    log.Printf("🔍 JWT claims: %+v", claims)
}
```

**Structured Logging**:
```go
import "encoding/json"

type LogEntry struct {
    Level     string                 `json:"level"`
    Message   string                 `json:"message"`
    UserID    string                 `json:"user_id,omitempty"`
    RideID    string                 `json:"ride_id,omitempty"`
    Error     string                 `json:"error,omitempty"`
    Timestamp time.Time              `json:"timestamp"`
    Context   map[string]interface{} `json:"context,omitempty"`
}

func logError(level, message string, err error, context map[string]interface{}) {
    entry := LogEntry{
        Level:     level,
        Message:   message,
        Timestamp: time.Now(),
        Context:   context,
    }
    
    if err != nil {
        entry.Error = err.Error()
    }
    
    jsonBytes, _ := json.Marshal(entry)
    log.Println(string(jsonBytes))
}
```

### Request Tracing

**Middleware for Request Logging**:
```go
func RequestLoggingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        
        // Log request
        log.Printf("→ %s %s from %s", c.Request.Method, c.Request.URL.Path, c.ClientIP())
        
        c.Next()
        
        // Log response
        duration := time.Since(start)
        log.Printf("← %s %s [%d] %v", c.Request.Method, c.Request.URL.Path, c.Writer.Status(), duration)
    }
}
```

**Correlation IDs**:
```go
func CorrelationMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        correlationID := c.GetHeader("X-Correlation-ID")
        if correlationID == "" {
            correlationID = generateUUID()
        }
        
        c.Set("correlationID", correlationID)
        c.Header("X-Correlation-ID", correlationID)
        c.Next()
    }
}
```

### Database Query Debugging

**Query Logging**:
```go
func queryWithLogging(query string, args ...interface{}) (*sql.Rows, error) {
    start := time.Now()
    
    if os.Getenv("GIN_MODE") == "debug" {
        log.Printf("🔍 SQL Query: %s", query)
        log.Printf("🔍 SQL Args: %+v", args)
    }
    
    rows, err := database.DB.Query(query, args...)
    
    duration := time.Since(start)
    if err != nil {
        log.Printf("❌ SQL Error (%v): %v", duration, err)
    } else {
        log.Printf("✅ SQL Success (%v)", duration)
    }
    
    return rows, err
}
```

## 🧪 Testing Error Scenarios

### Unit Tests for Error Handling

```go
func TestCreateRide_ValidationErrors(t *testing.T) {
    tests := []struct {
        name         string
        rideData     map[string]interface{}
        expectedCode string
        expectedField string
    }{
        {
            name:          "missing origin",
            rideData:      map[string]interface{}{"destination": "Airport"},
            expectedCode:  "FIELD_REQUIRED",
            expectedField: "origin",
        },
        {
            name:          "invalid departure time",
            rideData:      map[string]interface{}{
                "origin": "Campus",
                "destination": "Airport",
                "departureTime": "invalid-date",
            },
            expectedCode:  "INVALID_FORMAT",
            expectedField: "departureTime",
        },
        {
            name:          "past departure time",
            rideData:      map[string]interface{}{
                "origin": "Campus",
                "destination": "Airport",
                "departureTime": "2020-01-01T10:00:00Z",
            },
            expectedCode:  "INVALID_VALUE",
            expectedField: "departureTime",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := validateRideData(tt.rideData)
            
            assert.Error(t, err)
            
            if validationErr, ok := err.(*ValidationError); ok {
                assert.Equal(t, tt.expectedCode, validationErr.Code)
                assert.Equal(t, tt.expectedField, validationErr.Field)
            } else {
                t.Errorf("Expected ValidationError, got %T", err)
            }
        })
    }
}
```

### Integration Tests for API Errors

```go
func TestAPI_AuthenticationErrors(t *testing.T) {
    router := setupTestRouter()
    
    tests := []struct {
        name           string
        authHeader     string
        expectedStatus int
        expectedCode   string
    }{
        {
            name:           "missing auth header",
            authHeader:     "",
            expectedStatus: 401,
            expectedCode:   "AUTHENTICATION_REQUIRED",
        },
        {
            name:           "invalid token format",
            authHeader:     "InvalidToken",
            expectedStatus: 401,
            expectedCode:   "AUTHENTICATION_REQUIRED",
        },
        {
            name:           "expired token",
            authHeader:     "Bearer " + generateExpiredToken(),
            expectedStatus: 401,
            expectedCode:   "INVALID_TOKEN",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest("GET", "/api/profile", nil)
            if tt.authHeader != "" {
                req.Header.Set("Authorization", tt.authHeader)
            }
            
            resp := httptest.NewRecorder()
            router.ServeHTTP(resp, req)
            
            assert.Equal(t, tt.expectedStatus, resp.Code)
            
            var errorResponse map[string]interface{}
            json.Unmarshal(resp.Body.Bytes(), &errorResponse)
            
            details := errorResponse["details"].(map[string]interface{})
            assert.Equal(t, tt.expectedCode, details["code"])
        })
    }
}
```

## 🔧 Monitoring and Alerting

### Health Check Endpoint

```go
func HealthCheck(c *gin.Context) {
    status := gin.H{
        "status":    "healthy",
        "service":   "juno-backend",
        "timestamp": time.Now().Format(time.RFC3339),
        "version":   os.Getenv("APP_VERSION"),
    }
    
    // Check database connectivity
    if err := database.DB.Ping(); err != nil {
        status["status"] = "unhealthy"
        status["database"] = "disconnected"
        c.JSON(503, status)
        return
    }
    
    status["database"] = "connected"
    c.JSON(200, status)
}
```

### Error Metrics

```go
var (
    errorCounter = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "api_errors_total",
            Help: "Total number of API errors",
        },
        []string{"endpoint", "status_code", "error_code"},
    )
)

func recordError(endpoint string, statusCode int, errorCode string) {
    errorCounter.WithLabelValues(endpoint, fmt.Sprintf("%d", statusCode), errorCode).Inc()
}
```

## 🎯 Best Practices

### Error Message Guidelines

**✅ Good Error Messages**:
- **Clear**: "Email address is required"
- **Specific**: "Departure time must be in the future"
- **Actionable**: "Ride is full. Try another ride or contact the driver"

**❌ Bad Error Messages**:
- **Vague**: "Something went wrong"
- **Technical**: "SQL error: relation 'users' does not exist"
- **Exposing**: "Database password incorrect"

### Security Considerations

**Don't Expose**:
- Database schema details
- Internal file paths
- Stack traces in production
- Authentication secrets
- User data from other users

**Do Include**:
- Request validation errors
- Business rule violations
- User-friendly explanations
- Suggested next steps

### Performance Impact

**Error Handling Performance**:
- ✅ **Fast validation** - Check common errors first
- ✅ **Efficient logging** - Use structured logging
- ✅ **Appropriate detail** - More detail in development
- ❌ **Avoid expensive operations** - Don't query database for error messages

## 🚨 Emergency Procedures

### Production Error Response

1. **Immediate Response**
   - Acknowledge the issue
   - Provide estimated resolution time
   - Set up monitoring for similar issues

2. **Investigation**
   - Check server logs
   - Review error metrics
   - Identify root cause

3. **Resolution**
   - Apply hotfix if critical
   - Update error handling
   - Document the incident

### Error Recovery

**Automatic Recovery**:
```go
func retryWithBackoff(operation func() error, maxRetries int) error {
    for i := 0; i < maxRetries; i++ {
        if err := operation(); err == nil {
            return nil
        }
        
        // Exponential backoff
        time.Sleep(time.Duration(math.Pow(2, float64(i))) * time.Second)
    }
    
    return fmt.Errorf("operation failed after %d retries", maxRetries)
}
```

**Graceful Degradation**:
```go
func GetRidesWithFallback(c *gin.Context) {
    // Try primary method
    rides, err := getRidesFromDatabase(userID)
    if err == nil {
        c.JSON(200, rides)
        return
    }
    
    // Fallback to cached data
    if cachedRides := getRidesFromCache(userID); cachedRides != nil {
        c.Header("X-Data-Source", "cache")
        c.JSON(200, cachedRides)
        return
    }
    
    // Return empty list with warning
    c.Header("X-Warning", "Database temporarily unavailable")
    c.JSON(200, []interface{}{})
}
```

---

**Next**: Learn about [Deployment](./07-deployment.md) strategies and production setup.
