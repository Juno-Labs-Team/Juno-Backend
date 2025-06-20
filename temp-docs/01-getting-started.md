# 🚀 Getting Started

This guide will help you set up the Juno Backend for development and understand the project structure.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Go 1.24+** - [Download here](https://golang.org/dl/)
- **PostgreSQL 14+** - For local development
- **Git** - Version control
- **Google Cloud Account** - For OAuth and deployment
- **IDE/Editor** - VS Code recommended with Go extension

## 🏗️ Project Structure

```
Juno-Backend/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── configs/
│   └── config.go                # Configuration management
├── internal/
│   ├── api/
│   │   └── handlers.go          # API endpoint handlers
│   ├── auth/
│   │   └── handlers.go          # Authentication handlers
│   ├── database/
│   │   ├── connection.go        # Database connection
│   │   └── migrations/
│   │       └── schema.sql       # Database schema
│   ├── middleware/
│   │   └── auth.go              # JWT authentication middleware
│   └── routes/
│       └── routes.go            # Route definitions
├── temp-docs/                   # This documentation
├── go.mod                       # Go module definition
├── go.sum                       # Go module checksums
├── Dockerfile                   # Container configuration
└── README.md                    # Project overview
```

## 🔧 Local Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Juno-Backend
```

### 2. Install Dependencies

```bash
go mod download
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=juno_db

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server Configuration
PORT=8080
GIN_MODE=debug
```

### 4. Database Setup

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb juno_db

# Run migrations
psql -d juno_db -f internal/database/migrations/schema.sql
```

#### Option B: Google Cloud SQL (Recommended)

1. Create a Cloud SQL instance in Google Cloud Console
2. Create a database named `juno_db`
3. Run the schema from `internal/database/migrations/schema.sql`
4. Update `.env` with your Cloud SQL connection details

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Application type**: Web application
   - **Authorized redirect URIs**:
     - `http://localhost:8080/auth/google/callback` (development)
     - `https://your-domain.com/auth/google/callback` (production)
5. Copy Client ID and Client Secret to your `.env` file

### 6. Run the Application

```bash
# Development mode
go run cmd/server/main.go

# Or build and run
go build -o juno-backend cmd/server/main.go
./juno-backend
```

You should see output like:

```
🚗 Starting Juno Backend - Clean Build v2
✅ Configuration loaded
✅ Database connected
✅ OAuth initialized
🚀 Server starting on port 8080
🔗 Local URL: http://localhost:8080
🔐 OAuth URL: http://localhost:8080/auth/google
```

## 🧪 Testing the Setup

### 1. Health Check

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "juno-backend",
  "message": "🚗 Juno Backend is running!"
}
```

### 2. OAuth Flow Test

1. Open `http://localhost:8080/auth/google` in your browser
2. Complete Google authentication
3. You should receive a JWT token response

### 3. Protected Endpoint Test

```bash
# First, get a token from OAuth flow, then:
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/profile
```

## 🔍 Development Tools

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "golang.go",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Useful Commands

```bash
# Format code
go fmt ./...

# Run tests
go test ./...

# Check for security issues
go list -json -m all | nancy sleuth

# Update dependencies
go mod tidy
go get -u ./...

# Build for production
CGO_ENABLED=0 GOOS=linux go build -o juno-backend cmd/server/main.go
```

## 📊 Database Management

### Viewing Tables

```sql
-- Connect to database
psql -d juno_db

-- List all tables
\dt

-- View table structure
\d users
\d user_profiles
\d rides
\d friendships
```

### Common Queries

```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- View recent users
SELECT id, email, first_name, last_name, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check ride statistics
SELECT 
  COUNT(*) as total_rides,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_rides,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides
FROM rides;
```

## 🚨 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Database connection failed** | Check if PostgreSQL is running and credentials are correct |
| **OAuth redirect mismatch** | Verify redirect URI in Google Cloud Console matches your URL |
| **JWT token invalid** | Ensure JWT_SECRET is set and consistent |
| **CORS errors** | Check CORS configuration in `routes.go` |
| **Port already in use** | Change PORT in `.env` or kill existing process |

### Debug Mode

Enable detailed logging by setting:

```bash
export GIN_MODE=debug
```

### Log Analysis

The application outputs structured logs:

```
🔍 JWT Middleware started
🔍 Auth Header: 'Bearer eyJ...'
✅ Extracted userID: '123', email: 'user@example.com'
```

## 🎯 Next Steps

1. **Explore the API** - Check out [API Endpoints](./05-api-endpoints.md)
2. **Understand Authentication** - Read [Authentication Guide](./03-authentication.md)
3. **Database Deep Dive** - Study [Database Schema](./04-database-schema.md)
4. **Deploy to Cloud** - Follow [Deployment Guide](./07-deployment.md)

---

**Need help?** Check the [Contributing Guide](./08-contributing.md) or open an issue in the repository.
