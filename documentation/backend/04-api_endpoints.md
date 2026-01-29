# API Endpoints

This document describes all API endpoints available in the Fantasy F1 Backend system, including request/response formats, authentication requirements, and error handling.

---

## API Structure

### Base URL

```
Development: http://localhost:8000/api/v1
Production: https://api.fantasyf1.com/api/v1
```

### Authentication

Most endpoints require authentication via JWT bearer token:

```bash
Authorization: Bearer <access_token>
```

### Response Format

All responses follow a consistent format:

**Success Response**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  }
}
```

### HTTP Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate username)
- `422 Unprocessable Entity` - Semantic errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Authentication Endpoints

### Register User

Register a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "is_verified": false,
    "created_at": "2026-01-08T12:00:00Z"
  }
}
```

**Validation Rules:**
- username: 3-50 characters, alphanumeric and underscores only
- email: Valid email format
- password: Minimum 8 characters, at least one uppercase, one lowercase, one number
- full_name: Optional, max 100 characters

---

### Login

Authenticate user and receive JWT tokens.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe"
    }
  }
}
```

**Validation Rules:**
- Can login with username OR email
- Password must match stored hash

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1800
  }
}
```

---

### Me

Get current user information.

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "is_active": true,
    "is_verified": true,
    "role": "user",
    "created_at": "2026-01-08T12:00:00Z",
    "last_login_at": "2026-01-08T20:30:00Z"
  }
}
```

---

## User Endpoints

### Get User

Get user profile by ID.

**Endpoint:** `GET /users/{user_id}`

**Authentication:** Optional (public for own profile, admin for others)

**Path Parameters:**
- `user_id` (integer) - User ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "full_name": "John Doe",
    "is_active": true,
    "created_at": "2026-01-08T12:00:00Z",
    "teams_count": 2,
    "created_leagues_count": 1
  }
}
```

---

### Update User

Update user profile.

**Endpoint:** `PATCH /users/me`

**Authentication:** Required

**Request Body:**
```json
{
  "full_name": "Johnathan Doe",
  "email": "newemail@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "newemail@example.com",
    "full_name": "Johnathan Doe",
    "is_active": true,
    "updated_at": "2026-01-08T21:00:00Z"
  }
}
```

**Notes:**
- Cannot update username after registration
- Email changes require verification (future enhancement)

---

## Driver Endpoints

### List Drivers

Get list of all drivers with optional filtering.

**Endpoint:** `GET /drivers`

**Authentication:** Optional

**Query Parameters:**
- `status` (string, optional) - Filter by status: active, retired, reserve
- `team` (string, optional) - Filter by team name
- `sort` (string, optional) - Sort field: name, price, total_points, average_points
- `order` (string, optional) - Sort order: asc, desc (default: desc)
- `limit` (integer, optional) - Max results (default: 50, max: 100)
- `offset` (integer, optional) - Pagination offset (default: 0)

**Example Request:**
```
GET /drivers?status=active&sort=total_points&order=desc&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "id": 1,
        "name": "Max Verstappen",
        "team_name": "Red Bull Racing",
        "number": 1,
        "country": "Netherlands",
        "price": 25.5,
        "total_points": 456.5,
        "average_points": 38.04,
        "status": "active",
        "championships": 3,
        "wins": 45,
        "podiums": 85
      }
    ],
    "total": 20,
    "page": 0,
    "limit": 10
  }
}
```

---

### Get Driver

Get driver details by ID.

**Endpoint:** `GET /drivers/{driver_id}`

**Authentication:** Optional

**Path Parameters:**
- `driver_id` (integer) - Driver ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Max Verstappen",
    "team_name": "Red Bull Racing",
    "number": 1,
    "country": "Netherlands",
    "date_of_birth": "1997-09-30T00:00:00Z",
    "price": 25.5,
    "total_points": 456.5,
    "average_points": 38.04,
    "status": "active",
    "championships": 3,
    "wins": 45,
    "podiums": 85,
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

## Race Endpoints

### List Races

Get list of all races with optional filtering.

**Endpoint:** `GET /races`

**Authentication:** Optional

**Query Parameters:**
- `status` (string, optional) - Filter by status: upcoming, in_progress, completed, cancelled
- `country` (string, optional) - Filter by country
- `year` (integer, optional) - Filter by year
- `sort` (string, optional) - Sort field: race_date, round_number, name
- `order` (string, optional) - Sort order: asc, desc (default: desc)
- `limit` (integer, optional) - Max results (default: 50, max: 100)
- `offset` (integer, optional) - Pagination offset (default: 0)

**Example Request:**
```
GET /races?status=upcoming&sort=race_date&order=asc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "races": [
      {
        "id": 1,
        "name": "Saudi Arabian Grand Prix",
        "circuit_name": "Jeddah Corniche Circuit",
        "country": "Saudi Arabia",
        "city": "Jeddah",
        "round_number": 2,
        "race_date": "2026-02-22T14:00:00Z",
        "qualifying_date": "2026-02-21T14:00:00Z",
        "laps": 50,
        "status": "upcoming",
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 24,
    "page": 0,
    "limit": 50
  }
}
```

---

### Get Race

Get race details by ID.

**Endpoint:** `GET /races/{race_id}`

**Authentication:** Optional

**Path Parameters:**
- `race_id` (integer) - Race ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Saudi Arabian Grand Prix",
    "circuit_name": "Jeddah Corniche Circuit",
    "country": "Saudi Arabia",
    "city": "Jeddah",
    "round_number": 2,
    "race_date": "2026-02-22T14:00:00Z",
    "qualifying_date": "2026-02-21T14:00:00Z",
    "laps": 50,
    "status": "completed",
    "created_at": "2026-01-01T00:00:00Z",
    "results_count": 20
  }
}
```

---

### Get Race Results

Get results for a specific race.

**Endpoint:** `GET /races/{race_id}/results`

**Authentication:** Optional

**Path Parameters:**
- `race_id` (integer) - Race ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "race_id": 1,
    "race_name": "Saudi Arabian Grand Prix",
    "race_date": "2026-02-22T14:00:00Z",
    "results": [
      {
        "id": 1,
        "driver_id": 1,
        "driver_name": "Max Verstappen",
        "driver_number": 1,
        "team_name": "Red Bull Racing",
        "position": 1,
        "grid_position": 1,
        "laps_completed": 50,
        "points_earned": 25.0,
        "fastest_lap": true,
        "fastest_lap_time": "1:30.245",
        "time_delta": null,
        "dnf": false,
        "dnf_reason": null
      }
    ]
  }
}
```

**Note:** Returns empty array if race hasn't completed yet.

---

## League Endpoints

### List Leagues

Get list of all leagues with optional filtering.

**Endpoint:** `GET /leagues`

**Authentication:** Optional

**Query Parameters:**
- `is_private` (boolean, optional) - Filter by privacy status
- `search` (string, optional) - Search in name and description
- `sort` (string, optional) - Sort field: created_at, name
- `order` (string, optional) - Sort order: asc, desc (default: desc)
- `limit` (integer, optional) - Max results (default: 50, max: 100)
- `offset` (integer, optional) - Pagination offset (default: 0)

**Example Request:**
```
GET /leagues?is_private=false&sort=created_at&order=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "leagues": [
      {
        "id": 1,
        "name": "Formula One Fantasy League",
        "description": "The ultimate F1 fantasy competition!",
        "code": "F1FAN",
        "creator_id": 1,
        "creator_username": "admin",
        "max_teams": 20,
        "is_private": false,
        "scoring_system": "standard",
        "teams_count": 15,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 0,
    "limit": 50
  }
}
```

---

### Create League

Create a new league.

**Endpoint:** `POST /leagues`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "My Awesome League",
  "description": "Join my fantasy F1 league!",
  "is_private": true,
  "max_teams": 10,
  "scoring_system": "standard"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "My Awesome League",
    "description": "Join my fantasy F1 league!",
    "code": "ABCD12",
    "creator_id": 1,
    "max_teams": 10,
    "is_private": true,
    "scoring_system": "standard",
    "teams_count": 0,
    "created_at": "2026-01-08T15:00:00Z"
  }
}
```

**Validation Rules:**
- name: 3-100 characters, required
- description: Optional, max 500 characters
- is_private: Default true
- max_teams: 2-100, default 20
- scoring_system: Must be valid system name

---

### Get League

Get league details by ID.

**Endpoint:** `GET /leagues/{league_id}`

**Authentication:** Optional

**Path Parameters:**
- `league_id` (integer) - League ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Formula One Fantasy League",
    "description": "The ultimate F1 fantasy competition!",
    "code": "F1FAN",
    "creator_id": 1,
    "creator_username": "admin",
    "max_teams": 20,
    "is_private": false,
    "scoring_system": "standard",
    "teams_count": 15,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-08T12:00:00Z"
  }
}
```

---

### Update League

Update league details.

**Endpoint:** `PATCH /leagues/{league_id}`

**Authentication:** Required

**Authorization:** League creator or admin only

**Path Parameters:**
- `league_id` (integer) - League ID

**Request Body:**
```json
{
  "description": "Updated description",
  "max_teams": 25
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Formula One Fantasy League",
    "description": "Updated description",
    "code": "F1FAN",
    "creator_id": 1,
    "max_teams": 25,
    "is_private": false,
    "scoring_system": "standard",
    "teams_count": 15,
    "updated_at": "2026-01-08T21:00:00Z"
  }
}
```

---

## Team Endpoints

### List Teams

Get list of teams with optional filtering.

**Endpoint:** `GET /teams`

**Authentication:** Required for user-specific teams, optional for public teams

**Query Parameters:**
- `league_id` (integer, optional) - Filter by league
- `user_id` (integer, optional) - Filter by user (own teams only)
- `sort` (string, optional) - Sort field: total_points, created_at, name
- `order` (string, optional) - Sort order: asc, desc (default: desc)
- `limit` (integer, optional) - Max results (default: 50, max: 100)
- `offset` (integer, optional) - Pagination offset (default: 0)

**Example Request:**
```
GET /teams?league_id=1&sort=total_points&order=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "datta": {
    "teams": [
      {
        "id": 1,
        "name": "Speed Demons",
        "user_id": 1,
        "username": "john_doe",
        "league_id": 1,
        "league_name": "Formula One Fantasy League",
        "total_points": 456.5,
        "budget_spent": 92.5,
        "rank": 1,
        "is_active": true,
        "drivers": [
          {
            "driver_id": 1,
            "driver_name": "Max Verstappen",
            "driver_number": 1,
            "team_name": "Red Bull Racing",
            "price": 25.5,
            "is_captain": true
          }
        ],
        "created_at": "2026-01-08T12:00:00Z"
      }
    ],
    "total": 15,
    "page": 0,
    "limit": 50
  }
}
```

---

### Create Team

Create a new team in a league.

**Endpoint:** `POST /teams`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Speed Demons",
  "league_id": 1,
  "driver_ids": [1, 2, 3, 4, 5],
  "captain_id": 1
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Speed Demons",
    "user_id": 1,
    "league_id": 1,
    "total_points": 0.0,
    "budget_spent": 100.0,
    "rank": null,
    "is_active": true,
    "drivers": [
      {
        "driver_id": 1,
        "driver_name": "Max Verstappen",
        "is_captain": true
      }
    ],
    "created_at": "2026-01-08T15:00:00Z"
  }
}
```

**Validation Rules:**
- Must select exactly 5 drivers
- Total driver prices must not exceed budget (100 million)
- captain_id must be one of the selected driver_ids
- Cannot select more than 2 drivers from the same team
- Cannot create more than 1 team per league per user

---

### Get Team

Get team details by ID.

**Endpoint:** `GET /teams/{team_id}`

**Authentication:** Optional (public)

**Path Parameters:**
- `team_id` (integer) - Team ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Speed Demons",
    "user_id": 1,
    "username": "john_doe",
    "league_id": 1,
    "league_name": "Formula One Fantasy League",
    "total_points": 456.5,
    "budget_spent": 92.5,
    "rank": 1,
    "is_active": true,
    "drivers": [
      {
        "driver_id": 1,
        "driver_name": "Max Verstappen",
        "driver_number": 1,
        "team_name": "Red Bull Racing",
        "price": 25.5,
        "total_points": 89.0,
        "is_captain": true
      },
      {
        "driver_id": 2,
        "driver_name": "Lewis Hamilton",
        "driver_number": 44,
        "team_name": "Mercedes",
        "price": 22.0,
        "total_points": 67.5,
        "is_captain": false
      }
    ],
    "created_at": "2026-01-08T12:00:00Z",
    "updated_at": "2026-01-08T20:00:00Z"
  }
}
```

---

### Update Team

Update team driver selections.

**Endpoint:** `PATCH /teams/{team_id}`

**Authentication:** Required

**Authorization:** Team owner only

**Path Parameters:**
- `team_id` (integer) - Team ID

**Request Body:**
```json
{
  "driver_ids": [1, 3, 4, 6, 7],
  "captain_id": 3
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Speed Demons",
    "user_id": 1,
    "league_id": 1,
    "total_points": 456.5,
    "budget_spent": 95.0,
    "drivers": [
      {
        "driver_id": 1,
        "driver_name": "Max Verstappen",
        "is_captain": false
      },
      {
        "driver_id": 3,
        "driver_name": "Charles Leclerc",
        "is_captain": true
      }
    ],
    "updated_at": "2026-01-08T22:00:00Z"
  }
}
```

**Validation Rules:**
- Must select exactly 5 drivers
- Total driver prices must not exceed budget
- captain_id must be one of the selected driver_ids
- Team scheduling restrictions apply (future enhancement)

---

## Leaderboard Endpoints

### Get League Leaderboard

Get leaderboard for a league.

**Endpoint:** `GET /leagues/{league_id}/leaderboard`

**Authentication:** Optional

**Path Parameters:**
- `league_id` (integer) - League ID

**Query Parameters:**
- `race_id` (integer, optional) - Get leaderboard for specific race, or overall if not provided

**Example Request:**
```
GET /leagues/1/leaderboard
GET /leagues/1/leaderboard?race_id=5
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "league_id": 1,
    "league_name": "Formula One Fantasy League",
    "race_id": null,
    "race_name": null,
    "leaderboard": [
      {
        "rank": 1,
        "team_id": 1,
        "team_name": "Speed Demons",
        "username": "john_doe",
        "total_points": 456.5,
        "change_in_rank": 0
      },
      {
        "rank": 2,
        "team_id": 2,
        "team_name": "Racing Academy",
        "username": "jane_smith",
        "total_points": 442.0,
        "change_in_rank": 1
      }
    ],
    "updated_at": "2026-01-08T20:00:00Z"
  }
}
```

---

## Notification Endpoints

### List Notifications

Get notifications for current user.

**Endpoint:** `GET /notifications`

**Authentication:** Required

**Query Parameters:**
- `is_read` (boolean, optional) - Filter by read status
- `limit` (integer, optional) - Max results (default: 50, max: 100)
- `offset` (integer, optional) - Pagination offset (default: 0)

**Example Request:**
```
GET /notifications?is_read=false
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "race_finished",
        "title": "Saudi Arabian Grand Prix Results",
        "message": "The race results are now available. Check your updated scores!",
        "is_read": false,
        "link": "/races/1/results",
        "created_at": "2026-02-22T16:00:00Z"
      }
    ],
    "total": 5,
    "unread_count": 2
  }
}
```

---

### Mark Notification as Read

Mark notification as read.

**Endpoint:** `PATCH /notifications/{notification_id}/read`

**Authentication:** Required

**Path Parameters:**
- `notification_id` (integer) - Notification ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_read": true,
    "read_at": "2026-01-08T22:30:00Z"
  }
}
```

---

### Mark All Notifications as Read

Mark all notifications as read for current user.

**Endpoint:** `POST /notifications/read-all`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "marked_count": 15
  }
}
```

---

## Error Responses

### Validation Error (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "username",
        "message": "Username must be between 3 and 50 characters"
      },
      {
        "field": "password",
        "message": "Password must contain at least one uppercase letter"
      }
    ]
  }
}
```

### Authentication Error (401)

```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid or expired token"
  }
}
```

### Permission Error (403)

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_ERROR",
    "message": "You do not have permission to access this resource"
  }
}
```

### Not Found Error (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### Conflict Error (409)

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Username already exists",
    "details": {
      "field": "username",
      "value": "john_doe"
    }
  }
}
```

### Rate Limit Error (429)

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "reset": "2026-01-08T23:00:00Z"
    }
  }
}
```

### Internal Server Error (500)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

### Default Limits

- **Unauthenticated**: 100 requests per hour
- **Authenticated**: 1000 requests per hour
- **Authenticated (Premium)**: 5000 requests per hour

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 2026-01-08T23:00:00Z
```

---

## Pagination

### Pagination Parameters

- `limit` - Number of items per page (default: 50, max: 100)
- `offset` - Number of items to skip (default: 0)

### Alternative Pagination (page-based)

- `page` - Page number (default: 0)
- `page_size` - Items per page (default: 50, max: 100)

Both pagination methods are supported.

### Pagination Response

```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "page": 0,
    "has_more": true
  }
}
```

---

## Related Documentation

- [Architecture Overview](architecture.md) - API layer architecture
- [Data Models](data_models.md) - Database models behind endpoints
- [Authentication](authentication.md) - JWT authentication details
- [Business Logic](business_logic.md) - Service layer implementation
- [Security](security.md) - Security best practices