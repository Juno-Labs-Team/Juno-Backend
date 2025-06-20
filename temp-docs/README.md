# 🚗 Juno Backend API Documentation

Welcome to the comprehensive documentation for the **Juno Rideshare Backend** - a modern, scalable API built with Go and Gin for university ridesharing applications.

## 📚 Documentation Structure

- [**Getting Started**](./01-getting-started.md) - Setup, installation, and first steps
- [**API Overview**](./02-api-overview.md) - Architecture, design principles, and patterns
- [**Authentication**](./03-authentication.md) - OAuth2, JWT tokens, and security
- [**Database Schema**](./04-database-schema.md) - Complete database structure and relationships
- [**API Endpoints**](./05-api-endpoints.md) - Detailed endpoint documentation
- [**Error Handling**](./06-error-handling.md) - Error codes, responses, and debugging
- [**Deployment**](./07-deployment.md) - Cloud Run deployment and environment setup
- [**Contributing**](./08-contributing.md) - Development guidelines and best practices

## 🎯 Quick Links

| Resource | Description |
|----------|-------------|
| [Health Check](./05-api-endpoints.md#health-check) | System status endpoint |
| [OAuth Flow](./03-authentication.md#oauth-flow) | Google authentication setup |
| [User Profile API](./05-api-endpoints.md#user-profile) | Profile management endpoints |
| [Rides API](./05-api-endpoints.md#rides) | Rideshare core functionality |
| [Friends API](./05-api-endpoints.md#friends) | Social features and connections |

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   React Native  │◄──►│   Go + Gin      │◄──►│   PostgreSQL    │
│                 │    │                 │    │   Cloud SQL     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Key Technologies:**
- **Backend**: Go 1.24 with Gin framework
- **Database**: PostgreSQL (Google Cloud SQL)
- **Authentication**: OAuth2 (Google) + JWT tokens
- **Deployment**: Google Cloud Run
- **CORS**: Configured for cross-origin requests

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd Juno-Backend

# Install dependencies
go mod download

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run locally
go run cmd/server/main.go
```

## 🔧 Environment Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ |
| `JWT_SECRET` | JWT token signing secret | ✅ |
| `DB_HOST` | Database host URL | ✅ |
| `DB_USER` | Database username | ✅ |
| `DB_PASSWORD` | Database password | ✅ |
| `DB_NAME` | Database name | ✅ |
| `PORT` | Server port (default: 8080) | ❌ |

## 📊 API Status

| Feature | Status | Documentation |
|---------|--------|---------------|
| 🔐 Authentication | ✅ Complete | [Auth Guide](./03-authentication.md) |
| 👤 User Profiles | ✅ Complete | [Profile API](./05-api-endpoints.md#user-profile) |
| 🚗 Rides Management | ✅ Complete | [Rides API](./05-api-endpoints.md#rides) |
| 👥 Friends System | ✅ Complete | [Friends API](./05-api-endpoints.md#friends) |
| 📱 Notifications | 🚧 In Progress | Coming Soon |
| ⭐ Reviews & Ratings | 🚧 In Progress | Coming Soon |

## 🌟 Key Features

### Authentication & Security
- Google OAuth2 integration
- JWT token-based authentication
- Secure session management
- CORS configuration

### User Management
- Complete user profiles with onboarding
- School-based user verification
- Profile completion tracking
- Car information management

### Rideshare Core
- Create and manage rides
- Real-time passenger management
- Location-based ride discovery
- Friends-only ride options

### Social Features
- Friend requests and management
- User search functionality
- Username-based friend addition
- Social ride filtering

---

## 🔗 External Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Go Documentation](https://golang.org/doc/)
- [Gin Framework](https://gin-gonic.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Maintained by the Juno Development Team** | Last updated: June 2025
