# 🔐 Authentication

Complete guide to the Juno Backend authentication system, including OAuth2 integration, JWT tokens, and security best practices.

## 🎯 Authentication Overview

Juno uses a modern authentication system combining:

- **Google OAuth2** - Secure third-party authentication
- **JWT Tokens** - Stateless session management
- **Middleware Protection** - Route-level security
- **User Context** - Request-scoped user information

## 🔄 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as Google OAuth

    U->>F: Open App
    F->>B: GET /auth/google
    B->>G: Redirect to Google
    G->>U: Login Form
    U->>G: Enter Credentials
    G->>B: GET /auth/google/callback?code=...
    B->>G: Exchange code for user info
    G->>B: User profile data
    B->>B: Create/Update user in DB
    B->>B: Generate JWT token
    B->>F: Return JWT token
    F->>F: Store token
    F->>B: API calls with Bearer token
    B->>B: Validate JWT
    B->>F: Protected resource
```

## 🚀 Quick Start

### 1. Google OAuth Setup

1. **Create Google Cloud Project**
   ```bash
   # Go to Google Cloud Console
   # https://console.cloud.google.com/
   ```

2. **Enable APIs**
   - Google+ API
   - OAuth2 API

3. **Create OAuth Credentials**
   ```
   Application Type: Web Application
   Authorized Redirect URIs:
   - http://localhost:8080/auth/google/callback (dev)
   - https://your-domain.com/auth/google/callback (prod)
   ```

4. **Environment Setup**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   JWT_SECRET=your_super_secret_jwt_key
   ```

### 2. Testing Authentication

```bash
# 1. Start OAuth flow
curl http://localhost:8080/auth/google
# This redirects to Google

# 2. After completing OAuth, you get a JWT token
# Use it for protected endpoints:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/profile
```

## 🔧 Implementation Details

### OAuth Configuration

**File**: `internal/auth/handlers.go`

```go
func InitOAuth(cfg *configs.Config) {
    var redirectURL string
    
    if os.Getenv("K_SERVICE") != "" {
        // Production Cloud Run
        redirectURL = "https://juno-backend-587837548118.us-east4.run.app/auth/google/callback"
    } else {
        // Local development
        redirectURL = "http://localhost:8080/auth/google/callback"
    }

    googleOAuthConfig = &oauth2.Config{
        RedirectURL:  redirectURL,
        ClientID:     cfg.GoogleClientID,
        ClientSecret: cfg.GoogleClientSecret,
        Scopes:       []string{"openid", "profile", "email"},
        Endpoint:     google.Endpoint,
    }
}
```

### OAuth Endpoints

#### `GET /auth/google` - Start OAuth Flow

**Purpose**: Redirects user to Google OAuth consent screen

**Implementation**:
```go
func GoogleLogin(cfg *configs.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Generate security state
        state := generateRandomState()
        c.SetCookie("oauth_state", state, 300, "/", "", false, true)
        
        // Redirect to Google
        url := googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
        c.Redirect(http.StatusTemporaryRedirect, url)
    }
}
```

**Response**: HTTP 302 redirect to Google OAuth

#### `GET /auth/google/callback` - Handle OAuth Response

**Purpose**: Exchanges OAuth code for user information and creates JWT token

**Query Parameters**:
- `code` - Authorization code from Google
- `state` - Security state parameter

**Implementation**:
```go
func GoogleCallback(cfg *configs.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Verify state parameter
        state := c.Query("state")
        cookieState, _ := c.Cookie("oauth_state")
        if state != cookieState {
            c.JSON(400, gin.H{"error": "Invalid state parameter"})
            return
        }
        
        // 2. Exchange code for token
        code := c.Query("code")
        token, err := googleOAuthConfig.Exchange(context.Background(), code)
        
        // 3. Get user info from Google
        userInfo, err := getUserInfoFromGoogle(token)
        
        // 4. Create/update user in database
        user, err := createOrUpdateUser(userInfo)
        
        // 5. Generate JWT token
        jwtToken, err := generateJWTToken(user, cfg.JWTSecret)
        
        // 6. Return success response
        c.JSON(200, gin.H{
            "message": "✅ OAuth login successful",
            "token":   jwtToken,
            "user":    user,
        })
    }
}
```

**Success Response**:
```json
{
  "message": "✅ OAuth login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "user@example.com",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

## 🎫 JWT Token System

### Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": 123,
    "email": "user@example.com",
    "username": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "exp": 1719734400,
    "iat": 1719129600
  },
  "signature": "..."
}
```

### Token Generation

```go
func generateJWTToken(user map[string]interface{}, secret string) (string, error) {
    claims := jwt.MapClaims{
        "user_id":    user["id"],
        "email":      user["email"],
        "username":   user["username"],
        "first_name": user["firstName"],
        "last_name":  user["lastName"],
        "exp":        time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
        "iat":        time.Now().Unix(),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}
```

### Token Validation

**File**: `internal/middleware/auth.go`

```go
func JWTAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Extract token from header
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"error": "User not authenticated"})
            c.Abort()
            return
        }

        // 2. Parse Bearer token
        bearerToken := strings.Split(authHeader, " ")
        if len(bearerToken) != 2 || bearerToken[0] != "Bearer" {
            c.JSON(401, gin.H{"error": "User not authenticated"})
            c.Abort()
            return
        }

        tokenString := bearerToken[1]

        // 3. Validate token
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
            }
            return []byte(jwtSecret), nil
        })

        if err != nil || !token.Valid {
            c.JSON(401, gin.H{"error": "User not authenticated"})
            c.Abort()
            return
        }

        // 4. Extract user information
        if claims, ok := token.Claims.(jwt.MapClaims); ok {
            userID := fmt.Sprintf("%v", claims["user_id"])
            email := fmt.Sprintf("%v", claims["email"])

            // 5. Set context for handlers
            c.Set("userID", userID)
            c.Set("email", email)
            c.Next()
        } else {
            c.JSON(401, gin.H{"error": "User not authenticated"})
            c.Abort()
        }
    }
}
```

## 👤 User Management

### User Creation/Update

When a user authenticates via Google OAuth, the system:

1. **Checks if user exists** by email or Google ID
2. **Creates new user** if not found
3. **Updates existing user** with latest Google data
4. **Creates user profile** with default values

```go
func createOrUpdateUser(userInfo map[string]interface{}) (map[string]interface{}, error) {
    email := userInfo["email"].(string)
    googleID := userInfo["id"].(string)
    firstName := userInfo["given_name"].(string)
    lastName := userInfo["family_name"].(string)
    picture := userInfo["picture"].(string)

    var userID int
    var username string
    
    // Check if user exists
    err := database.DB.QueryRow(`
        SELECT id, username FROM users WHERE email = $1 OR google_id = $2
    `, email, googleID).Scan(&userID, &username)

    if err == sql.ErrNoRows {
        // Create new user
        err = database.DB.QueryRow(`
            INSERT INTO users (email, google_id, first_name, last_name, profile_picture_url, username, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            RETURNING id, username
        `, email, googleID, firstName, lastName, picture, email).Scan(&userID, &username)

        // Create user profile
        _, err = database.DB.Exec(`
            INSERT INTO user_profiles (user_id, school, onboarding_completed, onboarding_step)
            VALUES ($1, 'Freehold High School', false, 0)
        `, userID)
    } else {
        // Update existing user
        _, err = database.DB.Exec(`
            UPDATE users SET 
                google_id = $1, first_name = $2, last_name = $3, 
                profile_picture_url = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
        `, googleID, firstName, lastName, picture, userID)
    }

    return map[string]interface{}{
        "id":        userID,
        "email":     email,
        "firstName": firstName,
        "lastName":  lastName,
        "username":  username,
        "picture":   picture,
    }, nil
}
```

## 🛡️ Security Features

### State Parameter Protection

Prevents CSRF attacks during OAuth flow:

```go
func generateRandomState() string {
    bytes := make([]byte, 32)
    rand.Read(bytes)
    return base64.URLEncoding.EncodeToString(bytes)
}
```

### Token Expiration

- **Default Expiry**: 7 days
- **Refresh Strategy**: Re-authenticate via OAuth
- **Validation**: Every protected request

### HTTPS Enforcement

Production configuration enforces HTTPS:

```go
// Production URLs use HTTPS
if os.Getenv("K_SERVICE") != "" {
    redirectURL = "https://juno-backend-587837548118.us-east4.run.app/auth/google/callback"
}
```

## 🔍 Protected Endpoints

### Using Authentication

All protected endpoints require JWT token in header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Accessing User Context

In protected handlers, access user information:

```go
func GetProfile(c *gin.Context) {
    userID := c.GetString("userID")    // From JWT claims
    email := c.GetString("email")      // From JWT claims
    
    if userID == "" {
        c.JSON(401, gin.H{"error": "User not authenticated"})
        return
    }
    
    // Use userID to fetch user data...
}
```

### Current User Endpoint

**`GET /auth/me`** - Get current user information

```go
func GetCurrentUser(c *gin.Context) {
    userID := c.GetString("userID")
    
    user, err := getUserByID(userID)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to fetch user"})
        return
    }

    c.JSON(200, gin.H{"user": user})
}
```

## 🚪 Logout

**`POST /auth/logout`** - Logout user

```go
func Logout(c *gin.Context) {
    userID := c.GetString("userID")
    
    // Log the logout event
    fmt.Printf("🚪 User %s logging out\n", userID)
    
    // In production, you might:
    // 1. Add token to blacklist
    // 2. Clear server-side sessions
    // 3. Log analytics event
    
    c.JSON(200, gin.H{
        "message":  "Logged out successfully 👋",
        "status":   "success",
        "redirect": "/login",
    })
}
```

## 📱 Frontend Integration

### React Native Setup

```javascript
// Store token after OAuth
const storeToken = async (token) => {
  await AsyncStorage.setItem('juno_token', token);
};

// Add token to API requests
const apiCall = async (endpoint, options = {}) => {
  const token = await AsyncStorage.getItem('juno_token');
  
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

// Check authentication status
const isAuthenticated = async () => {
  const token = await AsyncStorage.getItem('juno_token');
  if (!token) return false;
  
  try {
    const response = await apiCall('/auth/me');
    return response.ok;
  } catch {
    return false;
  }
};
```

### OAuth Flow in React Native

```javascript
// Start OAuth flow
const handleGoogleLogin = () => {
  const oauthUrl = `${API_BASE_URL}/auth/google`;
  
  // Open OAuth URL in WebView or browser
  Linking.openURL(oauthUrl);
};

// Handle OAuth callback (deep link)
const handleOAuthCallback = (url) => {
  // Extract token from callback URL or
  // Make additional API call to get token
  const token = extractTokenFromUrl(url);
  storeToken(token);
  
  // Navigate to authenticated app
  navigation.navigate('Main');
};
```

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Invalid state parameter** | CSRF protection triggered | Clear cookies and retry |
| **Authorization code not found** | OAuth callback missing code | Check Google OAuth setup |
| **Failed to exchange code** | Invalid client credentials | Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` |
| **JWT token invalid** | Wrong secret or expired token | Check `JWT_SECRET` consistency |
| **User not authenticated** | Missing or invalid Bearer token | Include `Authorization: Bearer <token>` header |

### Debug Mode

Enable detailed authentication logging:

```bash
export GIN_MODE=debug
```

Look for log messages:
```
🔍 JWT Middleware started
🔍 Auth Header: 'Bearer eyJ...'
✅ Extracted userID: '123', email: 'user@example.com'
```

### Token Inspection

Decode JWT tokens at [jwt.io](https://jwt.io/) for debugging:

```json
{
  "user_id": 123,
  "email": "user@example.com",
  "exp": 1719734400,
  "iat": 1719129600
}
```

## 🎯 Best Practices

### Security

- ✅ **Always use HTTPS** in production
- ✅ **Validate state parameter** in OAuth flow
- ✅ **Set secure cookie flags** for production
- ✅ **Use strong JWT secrets** (32+ characters)
- ✅ **Implement token refresh** for long-lived sessions

### Performance

- ✅ **Cache user profiles** after authentication
- ✅ **Use connection pooling** for database
- ✅ **Minimize JWT payload** size
- ✅ **Implement proper logging** for monitoring

### Development

- ✅ **Use environment variables** for all secrets
- ✅ **Test OAuth flow** thoroughly
- ✅ **Handle edge cases** (network errors, invalid tokens)
- ✅ **Document API changes** affecting authentication

---

**Next**: Explore the [Database Schema](./04-database-schema.md) to understand data relationships.
