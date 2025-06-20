# 🌐 API Endpoints

Comprehensive documentation for all Juno Backend API endpoints, including request/response formats, authentication requirements, and usage examples.

## 📋 Quick Reference

| Category | Endpoints | Authentication |
|----------|-----------|----------------|
| [**Health**](#health-check) | `GET /health` | ❌ None |
| [**Authentication**](#authentication-endpoints) | `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/me`, `POST /auth/logout` | ⚡ Mixed |
| [**User Profile**](#user-profile-endpoints) | `GET /api/profile`, `PUT /api/profile` | ✅ JWT |
| [**Rides**](#rides-endpoints) | `GET /api/rides`, `POST /api/rides`, `GET /api/rides/nearby`, etc. | ✅ JWT |
| [**Friends**](#friends-endpoints) | `GET /api/friends`, `POST /api/friends`, `GET /api/users/search` | ✅ JWT |

## 🏠 Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://juno-backend-587837548118.us-east4.run.app`

## 🔐 Authentication

Protected endpoints require JWT token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ❤️ Health Check

### `GET /health`

Check if the API server is running and healthy.

**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "service": "juno-backend",
  "message": "🚗 Juno Backend is running!"
}
```

**Example**:
```bash
curl http://localhost:8080/health
```

---

## 🔐 Authentication Endpoints

### `GET /auth/google`

Initiate Google OAuth flow. Redirects user to Google consent screen.

**Authentication**: None required

**Response**: HTTP 302 redirect to Google OAuth

**Example**:
```bash
curl -I http://localhost:8080/auth/google
# HTTP/1.1 302 Found
# Location: https://accounts.google.com/oauth2/auth?client_id=...
```

### `GET /auth/google/callback`

Handle OAuth callback from Google. Exchanges authorization code for JWT token.

**Authentication**: None required

**Query Parameters**:
- `code` (required) - Authorization code from Google
- `state` (required) - Security state parameter

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

**Error Response**:
```json
{
  "error": "Invalid state parameter"
}
```

### `GET /auth/me`

Get current authenticated user information.

**Authentication**: JWT required

**Response**:
```json
{
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

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/auth/me
```

### `POST /auth/logout`

Logout the current user.

**Authentication**: JWT required

**Response**:
```json
{
  "message": "Logged out successfully 👋",
  "status": "success",
  "redirect": "/login"
}
```

**Example**:
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/auth/logout
```

---

## 👤 User Profile Endpoints

### `GET /api/profile`

Get comprehensive user profile information.

**Authentication**: JWT required

**Response**:
```json
{
  "id": 123,
  "username": "user@example.com",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "profilePic": "https://lh3.googleusercontent.com/...",
  "school": "Freehold High School",
  "classYear": "2025",
  "major": "Computer Science",
  "bio": "Love ridesharing and meeting new people!",
  "description": "Love ridesharing and meeting new people!",
  "hasCar": true,
  "car": {
    "make": "Toyota",
    "model": "Camry",
    "color": "Blue",
    "year": 2020
  },
  "maxPassengers": 4,
  "averageRating": 4.8,
  "numberOfRides": 25,
  "numRatings": 20,
  "profileCompletionPercentage": 85,
  "onboardingCompleted": true,
  "onboardingStep": 5,
  "userMood": "neutral"
}
```

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/profile
```

### `PUT /api/profile`

Update user profile information.

**Authentication**: JWT required

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "school": "Freehold High School",
  "classYear": "2025",
  "major": "Computer Science",
  "bio": "Updated bio text",
  "hasCar": true,
  "car": {
    "make": "Honda",
    "model": "Civic",
    "color": "Red",
    "year": 2021
  },
  "maxPassengers": 3,
  "onboardingCompleted": true,
  "onboardingStep": 5
}
```

**Response**:
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": 123,
    "username": "user@example.com",
    // ... full profile data with updates
  }
}
```

**Example**:
```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"firstName":"John","lastName":"Doe","bio":"Updated bio"}' \
     http://localhost:8080/api/profile
```

---

## 🚗 Rides Endpoints

### `GET /api/rides`

Get list of rides with optional filtering.

**Authentication**: JWT required

**Query Parameters**:
- `origin` (optional) - Filter by origin location
- `destination` (optional) - Filter by destination location
- `date` (optional) - Filter by departure date (YYYY-MM-DD)
- `friendsOnly` (optional) - Show only rides from friends ("true"/"false")

**Response**:
```json
[
  {
    "id": 456,
    "driverId": 123,
    "driverName": "John Doe",
    "driverRating": 4.8,
    "driverPicture": "https://lh3.googleusercontent.com/...",
    "origin": "Campus Center",
    "destination": "Newark Airport",
    "departureTime": "2025-06-20T10:00:00Z",
    "estimatedArrival": "2025-06-20T11:30:00Z",
    "maxPassengers": 4,
    "currentPassengers": 2,
    "availableSeats": 2,
    "pricePerSeat": 15.00,
    "description": "Direct route to airport, no stops",
    "carInfo": "Blue 2020 Toyota Camry",
    "onlyFriends": false,
    "autoAccept": true,
    "isUserDriver": false,
    "isUserPassenger": false,
    "canJoin": true
  }
]
```

**Example**:
```bash
# Get all rides
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/rides

# Filter by destination and friends only
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:8080/api/rides?destination=airport&friendsOnly=true"
```

### `POST /api/rides`

Create a new ride offering.

**Authentication**: JWT required

**Request Body**:
```json
{
  "origin": "Campus Center",
  "destination": "Newark Airport",
  "departureTime": "2025-06-20T10:00:00Z",
  "maxPassengers": 4,
  "pricePerSeat": 15.00,
  "description": "Direct route to airport, no stops",
  "onlyFriends": false,
  "autoAccept": true,
  "specialRequirements": "No smoking, please"
}
```

**Response**:
```json
{
  "message": "Ride created successfully",
  "rideId": "456",
  "ride": {
    "id": 456,
    "driverId": 123,
    "driverName": "John Doe",
    "origin": "Campus Center",
    "destination": "Newark Airport",
    "departureTime": "2025-06-20T10:00:00Z",
    "maxPassengers": 4,
    "currentPassengers": 0,
    "pricePerSeat": 15.00,
    "description": "Direct route to airport, no stops",
    "status": "active",
    "created": "2025-06-19T15:30:00Z"
  }
}
```

**Validation Rules**:
- `origin` and `destination` are required
- `departureTime` must be in the future
- `maxPassengers` must be between 1 and 8
- `pricePerSeat` must be non-negative

**Example**:
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "origin": "Campus Center",
       "destination": "Newark Airport",
       "departureTime": "2025-06-20T10:00:00Z",
       "maxPassengers": 4,
       "pricePerSeat": 15.00
     }' \
     http://localhost:8080/api/rides
```

### `GET /api/rides/nearby`

Get rides near user's location.

**Authentication**: JWT required

**Query Parameters**:
- `lat` (optional) - Latitude for search center
- `lng` (optional) - Longitude for search center
- `radius` (optional) - Search radius in kilometers (default: 10)

**Response**: Same format as `GET /api/rides`

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:8080/api/rides/nearby?lat=40.7128&lng=-74.0060&radius=5"
```

### `GET /api/rides/{id}`

Get detailed information about a specific ride.

**Authentication**: JWT required

**Path Parameters**:
- `id` (required) - Ride ID

**Response**:
```json
{
  "id": 456,
  "driverId": 123,
  "driverName": "John Doe",
  "driverRating": 4.8,
  "driverPicture": "https://lh3.googleusercontent.com/...",
  "driverPhone": "+1234567890",
  "origin": "Campus Center",
  "destination": "Newark Airport",
  "departureTime": "2025-06-20T10:00:00Z",
  "estimatedArrival": "2025-06-20T11:30:00Z",
  "maxPassengers": 4,
  "currentPassengers": 2,
  "pricePerSeat": 15.00,
  "description": "Direct route to airport, no stops",
  "carInfo": "Blue 2020 Toyota Camry",
  "passengers": [
    {
      "id": 789,
      "name": "Jane Smith",
      "picture": "https://lh3.googleusercontent.com/...",
      "rating": 4.9,
      "status": "accepted",
      "joinedAt": "2025-06-19T14:00:00Z"
    }
  ],
  "isUserDriver": false,
  "isUserPassenger": false,
  "userPassengerStatus": null,
  "canJoin": true,
  "canCancel": false
}
```

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/rides/456
```

### `POST /api/rides/{id}/join`

Join a ride as a passenger.

**Authentication**: JWT required

**Path Parameters**:
- `id` (required) - Ride ID

**Request Body** (optional):
```json
{
  "message": "Looking forward to the ride!"
}
```

**Response**:
```json
{
  "message": "Successfully joined the ride",
  "status": "accepted",
  "ride": {
    "id": 456,
    "currentPassengers": 3,
    // ... updated ride details
  }
}
```

**Error Responses**:
```json
// Ride is full
{
  "error": "Ride is at maximum capacity"
}

// Already a passenger
{
  "error": "User is already a passenger on this ride"
}

// User is the driver
{
  "error": "Driver cannot join their own ride"
}
```

**Example**:
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message": "Looking forward to the ride!"}' \
     http://localhost:8080/api/rides/456/join
```

### `DELETE /api/rides/{id}/leave`

Leave a ride as a passenger.

**Authentication**: JWT required

**Path Parameters**:
- `id` (required) - Ride ID

**Response**:
```json
{
  "message": "Successfully left the ride",
  "ride": {
    "id": 456,
    "currentPassengers": 2,
    // ... updated ride details
  }
}
```

**Example**:
```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/rides/456/leave
```

### `POST /api/rides/{id}/cancel`

Cancel a ride (driver only).

**Authentication**: JWT required

**Path Parameters**:
- `id` (required) - Ride ID

**Request Body** (optional):
```json
{
  "reason": "Car broke down, sorry!"
}
```

**Response**:
```json
{
  "message": "Ride cancelled successfully",
  "ride": {
    "id": 456,
    "status": "cancelled",
    "cancelledAt": "2025-06-19T16:00:00Z",
    // ... updated ride details
  }
}
```

**Example**:
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Emergency came up"}' \
     http://localhost:8080/api/rides/456/cancel
```

---

## 👥 Friends Endpoints

### `GET /api/friends`

Get list of user's friends.

**Authentication**: JWT required

**Response**:
```json
[
  {
    "id": 789,
    "firstName": "Jane",
    "lastName": "Smith",
    "username": "jane.smith",
    "profilePicture": "https://lh3.googleusercontent.com/...",
    "school": "Freehold High School",
    "classYear": "2025",
    "rating": 4.9,
    "totalRides": 15,
    "friendshipDate": "2025-05-15T12:00:00Z",
    "isOnline": true,
    "mutualFriends": 3
  }
]
```

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/friends
```

### `POST /api/friends`

Send friend request by user ID.

**Authentication**: JWT required

**Request Body**:
```json
{
  "friendId": 789
}
```

**Alternative**:
```json
{
  "userId": 789
}
```

**Response**:
```json
{
  "message": "Friend request sent successfully",
  "status": "pending",
  "friend": {
    "id": 789,
    "firstName": "Jane",
    "lastName": "Smith",
    "username": "jane.smith",
    "profilePicture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Error Responses**:
```json
// User not found
{
  "error": "User not found"
}

// Already friends
{
  "error": "Users are already friends"
}

// Pending request exists
{
  "error": "Friend request already pending"
}
```

**Example**:
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"friendId": 789}' \
     http://localhost:8080/api/friends
```

### `POST /api/friends/username`

Send friend request by username.

**Authentication**: JWT required

**Request Body**:
```json
{
  "username": "jane.smith"
}
```

**Response**: Same as `POST /api/friends`

**Example**:
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"username": "jane.smith"}' \
     http://localhost:8080/api/friends/username
```

### `GET /api/friends/requests`

Get pending friend requests.

**Authentication**: JWT required

**Response**:
```json
{
  "incoming": [
    {
      "id": 101,
      "senderId": 456,
      "senderName": "Bob Johnson",
      "senderUsername": "bob.johnson",
      "senderPicture": "https://lh3.googleusercontent.com/...",
      "senderSchool": "Freehold High School",
      "requestDate": "2025-06-19T10:00:00Z",
      "mutualFriends": 2
    }
  ],
  "outgoing": [
    {
      "id": 102,
      "recipientId": 654,
      "recipientName": "Alice Wilson",
      "recipientUsername": "alice.wilson",
      "recipientPicture": "https://lh3.googleusercontent.com/...",
      "requestDate": "2025-06-18T15:30:00Z"
    }
  ]
}
```

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/friends/requests
```

### `GET /api/users/search`

Search for users by name or username.

**Authentication**: JWT required

**Query Parameters**:
- `q` (required) - Search query (name or username)
- `limit` (optional) - Maximum results (default: 20)

**Response**:
```json
[
  {
    "id": 789,
    "firstName": "Jane",
    "lastName": "Smith",
    "username": "jane.smith",
    "profilePicture": "https://lh3.googleusercontent.com/...",
    "school": "Freehold High School",
    "classYear": "2025",
    "rating": 4.9,
    "mutualFriends": 3,
    "friendshipStatus": "none", // "none", "pending", "friends", "blocked"
    "canSendRequest": true
  }
]
```

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:8080/api/users/search?q=jane&limit=10"
```

---

## 📊 Response Status Codes

| Code | Description | When Used |
|------|-------------|-----------|
| **200** | OK | Successful GET, PUT requests |
| **201** | Created | Successful POST requests (creation) |
| **204** | No Content | Successful DELETE requests |
| **400** | Bad Request | Invalid request data or parameters |
| **401** | Unauthorized | Missing or invalid authentication |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists or conflict |
| **422** | Unprocessable Entity | Validation errors |
| **500** | Internal Server Error | Server-side errors |

## 🚨 Error Response Format

All error responses follow this structure:

```json
{
  "error": "Human-readable error message",
  "details": {
    "field": "specific_field",
    "code": "ERROR_CODE",
    "message": "Detailed explanation"
  },
  "status": 400,
  "timestamp": "2025-06-19T16:00:00Z"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request data validation failed |
| `AUTHENTICATION_REQUIRED` | JWT token missing or invalid |
| `PERMISSION_DENIED` | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## 🔄 Pagination

Some endpoints support pagination using query parameters:

**Parameters**:
- `page` - Page number (1-based, default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response includes pagination metadata**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🎯 Rate Limiting

API rate limits (future implementation):

- **Authenticated users**: 1000 requests/hour
- **Unauthenticated**: 100 requests/hour
- **Burst limit**: 50 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1719734400
```

## 🔍 Testing Examples

### Complete OAuth + API Flow

```bash
#!/bin/bash

# 1. Start OAuth flow (manual step in browser)
echo "Visit: http://localhost:8080/auth/google"

# 2. After OAuth, extract token (from callback response)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Test authenticated endpoints
echo "Testing profile endpoint..."
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/profile

echo "Testing rides endpoint..."
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/rides

echo "Creating a ride..."
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "origin": "Campus",
       "destination": "Airport",
       "departureTime": "2025-06-20T10:00:00Z",
       "maxPassengers": 4
     }' \
     http://localhost:8080/api/rides
```

### Postman Collection

Import this collection for testing:

```json
{
  "info": {
    "name": "Juno Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [{"key": "token", "value": "{{jwt_token}}"}]
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/profile"
      }
    },
    {
      "name": "Get Rides",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/rides"
      }
    }
  ],
  "variable": [
    {"key": "base_url", "value": "http://localhost:8080"},
    {"key": "jwt_token", "value": "YOUR_JWT_TOKEN_HERE"}
  ]
}
```

---

**Next**: Learn about [Error Handling](./06-error-handling.md) patterns and debugging techniques.
