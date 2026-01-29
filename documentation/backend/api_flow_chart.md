# API Flow Chart - Fantasy F1 Backend

This document provides a comprehensive breakdown of all API calls organized by service, categorized by authentication requirements.

**Authentication Levels:**
- 🔓 **No Authentication** - Public access (with rate limiting for sensitive operations)
- 🔐 **Authentication Required** - User must be logged in with valid JWT token
- 🔒 **Authentication + Membership Required** - User must be logged in AND be a member of the specific resource (league, constructor, etc.)

---

## Services Overview

The Fantasy F1 Backend consists of the following services:

1. **Authentication Service** - User registration, login, token management
2. **User Service** - User profile management
3. **Driver Service** - Driver information and statistics
4. **Race Service** - Race information, calendar, and results
5. **League Service** - League creation, management, and settings
6. **Constructor Service** - User's team/constructor management
7. **Draft Service** - Weekly driver drafting mechanics
8. **Scoring/Leaderboard Service** - Points calculation and rankings
9. **Notification Service** - User notifications and alerts

---

## Authentication Service

### Service Overview
Handles user authentication, registration, and JWT token management.

### API Endpoints

| Method | Endpoint | Auth Level | Description | Rate Limit |
|--------|----------|------------|-------------|------------|
| POST | `/auth/register` | 🔓 No Auth | Register a new user account | 10/hour (IP) |
| POST | `/auth/login` | 🔓 No Auth | Authenticate user and receive tokens | 30/hour (IP) |
| POST | `/auth/refresh` | 🔓 No Auth* | Refresh access token using refresh token | 100/hour (IP) |
| GET | `/auth/me` | 🔐 Auth Required | Get current user information | Standard |

*Note: Refresh endpoint requires valid refresh token but not authentication header

### Detailed Flow

#### 🔓 POST /auth/register
**Purpose:** Create new user account

**No Authentication Required** (High Security Level)
- Stricter rate limiting: 10 requests per hour per IP
- Additional security measures:
  - Email validation pattern enforcement
  - Password complexity requirements (min 8 chars, uppercase, lowercase, number)
  - Username validation (3-50 chars, alphanumeric + underscores)
  - CAPTCHA recommendation (future enhancement)
  - IP-based blocking for repeated failures

**Request Routes:**
```
Client (New User)
    ↓ POST /auth/register
🔓 Rate Limiter (10/hour per IP)
    ↓ Validation
AuthService.register()
    → Check username uniqueness
    → Check email uniqueness
    → Hash password (bcrypt)
    → Create User record
    → Return user data
```

**Response:** 201 Created with user profile

---

#### 🔓 POST /auth/login
**Purpose:** Authenticate user and receive JWT tokens

**No Authentication Required** (High Security Level)
- Rate limiting: 30 requests per hour per IP
- Security features:
  - Username OR email login
  - Password verification against hash
  - Failed login attempt tracking
  - IP-based blocking for multiple failures
  - JWT token generation (access + refresh)

**Request Routes:**
```
Client
    ↓ POST /auth/login
🔓 Rate Limiter (30/hour per IP)
    ↓ Validation
AuthService.login()
    → Find user by username/email
    → Verify password hash
    → Generate access token (15 min)
    → Generate refresh token (7 days)
    → Track last login
    → Return tokens + user data
```

**Response:** 200 OK with access_token, refresh_token, and user profile

---

#### 🔓 POST /auth/refresh
**Purpose:** Get new access token using refresh token

**No Authentication Required** (Token-based only)
- Rate limiting: 100 requests per hour per IP
- Includes refresh token in request body (not header)
- Validates refresh token signature and expiration

**Request Routes:**
```
Client
    ↓ POST /auth/refresh (refresh_token in body)
🔓 Rate Limiter (100/hour per IP)
    ↓ Token Validation
AuthService.refresh()
    → Verify refresh token signature
    → Check token expiration
    → Generate new access token
    → Return access token
```

**Response:** 200 OK with new access_token

---

#### 🔐 GET /auth/me
**Purpose:** Get current authenticated user's information

**Authentication Required**
- Requires valid JWT access token in Authorization header
- Returns user's profile, verification status, and metadata

**Request Routes:**
```
Client
    ↓ Authorization: Bearer <access_token>
🔐 JWT Middleware
    → Verify token signature
    → Extract user_id from token
    → Check token expiration
    → Inject current_user into request
    ↓
AuthService.get_current_user()
    → Return user profile
```

**Response:** 200 OK with complete user profile

---

## User Service

### Service Overview
Manages user profiles, account updates, and user searches.

### API Endpoints

| Method | Endpoint | Auth Level | Description | Access Control |
|--------|----------|------------|-------------|----------------|
| GET | `/users/{user_id}` | 🔓/🔐 Optional | Get user profile by ID | Public (basic), Full (own profile/auth) |
| GET | `/users/search` | 🔐 Auth Required | Search users by username/email | Authenticated users only |
| PATCH | `/users/me` | 🔐 Auth Required | Update own user profile | User's own profile only |
| GET | `/users/me/constructors` | 🔐 Auth Required | Get all user's constructors | User's own data only |
| GET | `/users/me/leagues` | 🔐 Auth Required | Get leagues user created | User's own data only |

### Detailed Flow

#### 🔓/🔐 GET /users/{user_id}
**Purpose:** Get user profile information

**Authentication:** Optional
- 🔓 **Public Access:** Basic profile information (username, full_name, is_active, created_at)
- 🔐 **Full Access:** Additional details if authenticated (email, is_verified, role, last_login_at)
- 🔒 **Admin Access:** Full profile access regardless of ownership

**Request Routes:**
```
Client
    ↓ GET /users/{user_id}
[Optional: Authorization: Bearer <token>]
    ↓
UserService.get_user()
    → Check if authenticated
    → Check if admin (if authenticated)
    → Check if requesting own profile (if authenticated)
    → Return appropriate level of detail
```

**Public Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "full_name": "John Doe",
  "is_active": true,
  "created_at": "2026-01-08T12:00:00Z"
}
```

**Authenticated Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": true,
  "role": "user",
  "last_login_at": "2026-01-08T20:30:00Z",
  "created_at": "2026-01-08T12:00:00Z"
}
```

---

#### 🔐 GET /users/search
**Purpose:** Search for users by username or email

**Authentication Required**
- Allows authenticated users to search for other users
- Useful for inviting users to leagues
- Results limited and rate limited

**Request Routes:**
```
Client (Authenticated)
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓ GET /users/search?q=john
UserService.search()
    → Search by username (ilike)
    → Search by email (ilike)
    → Limit results (default 10)
    → Return matching users
```

**Response:** 200 OK with array of user profiles

---

#### 🔐 PATCH /users/me
**Purpose:** Update current user's profile

**Authentication Required** (User's own profile only)
- User can only update their own profile
- Cannot update username (immutable)
- Email changes require verification (future)
- Full name and other fields can be updated

**Request Routes:**
```
Client (Authenticated)
    ↓ PATCH /users/me
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
UserService.update_user()
    → Validate user is updating own profile
    → Check username is not being changed
    → Update allowed fields only
    → Return updated profile
```

**Response:** 200 OK with updated user profile

---

#### 🔐 GET /users/me/constructors
**Purpose:** Get all authenticated user's constructors across all leagues

**Authentication Required** (User's own data only)
- Returns list of all constructors user owns
- Includes league information, team names, points
- Useful for dashboard overview

**Request Routes:**
```
Client (Authenticated)
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
UserService.get_user_constructors()
    → Query constructors by user_id
    → Join with league data
    → Return constructor list
```

**Response:** 200 OK with array of constructors

---

#### 🔐 GET /users/me/leagues
**Purpose:** Get all leagues created by authenticated user

**Authentication Required** (User's own data only)
- Returns list of leagues user created
- Includes member counts and league settings
- Useful for league management dashboard

**Request Routes:**
```
Client (Authenticated)
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
UserService.get_leagues_created_by_user()
    → Query leagues by creator_id
    → Count teams per league
    → Return league list
```

**Response:** 200 OK with array of leagues

---

## Driver Service

### Service Overview
Provides driver information, statistics, and rankings. Data is read-only for most users.

### API Endpoints

| Method | Endpoint | Auth Level | Description | Access Control |
|--------|----------|------------|-------------|----------------|
| GET | `/drivers` | 🔓 No Auth | List all drivers with filtering | Public access |
| GET | `/drivers/{driver_id}` | 🔓 No Auth | Get specific driver details | Public access |
| GET | `/drivers/active` | 🔓 No Auth | Get all active drivers | Public access |
| GET | `/drivers/rankings` | 🔓 No Auth | Get drivers ranked by points | Public access |
| GET | `/drivers/search` | 🔓 No Auth | Search drivers by name | Public access |
| GET | `/drivers/team/{team_name}` | 🔓 No Auth | Get drivers by real F1 team | Public access |

### Detailed Flow

#### 🔓 GET /drivers
**Purpose:** List all drivers with optional filtering

**No Authentication Required**
- Public access to driver information
- Supports filtering: status, team, sorting
- Pagination supported

**Request Routes:**
```
Client
    ↓ GET /drivers?status=active&sort=total_points
🔓 Public Access
No authentication required
    ↓
DriverService.list_drivers()
    → Apply filters (status, team)
    → Apply sorting
    → Apply pagination
    → Return driver list
```

**Response:** 200 OK with paginated driver list

---

#### 🔓 GET /drivers/{driver_id}
**Purpose:** Get detailed information about a specific driver

**No Authentication Required**
- Complete driver profile publicly accessible
- Includes career statistics, team, number, country

**Request Routes:**
```
Client
    ↓ GET /drivers/1
🔓 Public Access
    ↓
DriverService.get_driver()
    → Query driver by ID
    → Return complete profile
```

**Response:** 200 OK with driver details

---

#### 🔓 GET /drivers/active
**Purpose:** Get list of all active drivers (current season)

**No Authentication Required**
- Subset of drivers with status="active"
- Useful for drafting interface
- Returns all active F1 drivers

**Request Routes:**
```
Client
    ↓ GET /drivers/active
🔓 Public Access
    ↓
DriverService.get_active_drivers()
    → Query drivers where status='active'
    → Return list
```

**Response:** 200 OK with active drivers

---

#### 🔓 GET /drivers/rankings
**Purpose:** Get drivers ranked by total points

**No Authentication Required**
- Ranking of all active drivers by total_points
- Use for leaderboards and stats
- Sorted descending by points

**Request Routes:**
```
Client
    ↓ GET /drivers/rankings
🔓 Public Access
    ↓
DriverService.get_driver_rankings()
    → Query active drivers
    → Order by total_points DESC
    → Return ranked list
```

**Response:** 200 OK with ranked drivers

---

## Race Service

### Service Overview
Provides race calendar, schedule, and results information. Data is read-only for most users.

### API Endpoints

| Method | Endpoint | Auth Level | Description | Access Control |
|--------|----------|------------|-------------|----------------|
| GET | `/races` | 🔓 No Auth | List all races with filtering | Public access |
| GET | `/races/{race_id}` | 🔓 No Auth | Get specific race details | Public access |
| GET | `/races/{race_id}/results` | 🔓 No Auth | Get race results by driver | Public access |
| GET | `/races/upcoming` | 🔓 No Auth | Get upcoming races | Public access |
| GET | `/races/completed` | 🔓 No Auth | Get completed races | Public access |

### Detailed Flow

#### 🔓 GET /races
**Purpose:** List all races with optional filtering

**No Authentication Required**
- Complete race calendar publicly accessible
- Filter by status (upcoming, in_progress, completed)
- Filter by country, year
- Sort by date, round number, name

**Request Routes:**
```
Client
    ↓ GET /races?status=upcoming&sort=race_date
🔓 Public Access
    ↓
RaceService.list_races()
    → Apply filters (status, country, year)
    → Apply sorting
    → Apply pagination
    → Return race list
```

**Response:** 200 OK with paginated race list

---

#### 🔓 GET /races/{race_id}
**Purpose:** Get detailed information about a specific race

**No Authentication Required**
- Complete race information publicly accessible
- Circuit details, country, round, dates
- Status (upcoming, in_progress, completed, cancelled)

**Request Routes:**
```
Client
    ↓ GET /races/1
🔓 Public Access
    ↓
RaceService.get_race()
    → Query race by ID
    → Return complete race details
```

**Response:** 200 OK with race information

---

#### 🔓 GET /races/{race_id}/results
**Purpose:** Get results for a specific race

**No Authentication Required**
- Race results publicly accessible after race completion
- Includes all driver finishing positions
- Points earned, fastest lap, DNF information
- Returns empty array if race hasn't completed

**Request Routes:**
```
Client
    ↓ GET /races/1/results
🔓 Public Access
    ↓
RaceService.get_race_results()
    → Query race results by race_id
    → Join with driver information
    → Sort by position
    → Return results
```

**Response:** 200 OK with race results

---

#### 🔓 GET /races/upcoming
**Purpose:** Get list of upcoming races

**No Authentication Required**
- Races with status="upcoming"
- Ordered by ascending race date
- Useful for race calendar view

**Request Routes:**
```
Client
    ↓ GET /races/upcoming
🔓 Public Access
    ↓
RaceService.get_upcoming_races()
    → Query races with status='upcoming'
    → Order by race_date ASC
    → Return list
```

**Response:** 200 OK with upcoming races

---

## League Service

### Service Overview
Manages fantasy leagues, including creation, settings, and membership. Leagues can be public or private.

### API Endpoints

| Method | Endpoint | Auth Level | Description | Access Control |
|--------|----------|------------|-------------|----------------|
| GET | `/leagues` | 🔓 No Auth | List all leagues with filtering | Public access (basic info) |
| POST | `/leagues` | 🔐 Auth Required | Create a new league | Authenticated users only |
| GET | `/leagues/{league_id}` | 🔓 No Auth | Get league basic details | Public access (basic info) |
| PATCH | `/leagues/{league_id}` | 🔐 Auth Required + Ownership | Update league details | League creator or admin only |
| GET | `/leagues/{league_id}/members` | 🔓/🔒 Optional | Get league member list | Public (count, names if public) or Members only |
| POST | `/leagues/{league_id}/join` | 🔐 Auth Required | Join a league | Authenticated, league not full, not already member |
| POST | `/leagues/{league_id}/leave` | 🔐 Auth Required + Membership | Leave a league | League member only |
| DELETE | `/leagues/{league_id}` | 🔐 Auth Required + Ownership | Delete a league | League creator or admin only |
| GET | `/leagues/search` | 🔓 No Auth | Search public leagues | Public access |

### Detailed Flow

#### 🔓 GET /leagues
**Purpose:** List all leagues with optional filtering

**No Authentication Required**
- Basic league information publicly accessible
- Filter by privacy status, search terms
- Limited information returned (no private details)

**Request Routes:**
```
Client
    ↓ GET /leagues?is_private=false&search=formula
🔓 Public Access
    ↓
LeagueService.list_leagues()
    → Apply filters (is_private, search)
    → Return basic league info only
```

**Public Response:**
```json
{
  "id": 1,
  "name": "Formula One Fantasy League",
  "description": "Great league!",
  "is_private": false,
  "max_players": 20,
  "teams_count": 15,
  "scoring_system": "standard",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

#### 🔐 POST /leagues
**Purpose:** Create a new fantasy league

**Authentication Required**
- User must be authenticated to create league
- League automatically assigned to user as creator
- Generates unique invite code
- Validates league settings

**Request Routes:**
```
Client (Authenticated)
    ↓ POST /leagues
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
LeagueService.create_league()
    → Generate unique code
    → Set creator_id = current_user.id
    → Create league record
    → Return league with code
```

**Response:** 201 Created with league details including invite code

---

#### 🔓 GET /leagues/{league_id}
**Purpose:** Get league basic details

**No Authentication Required**
- Basic league information publicly accessible
- Returns same information as `/leagues` list
- No private member information

**Request Routes:**
```
Client
    ↓ GET /leagues/1
🔓 Public Access
    ↓
LeagueService.get_league()
    → Query league by ID
    → Return basic league info
```

**Response:** 200 OK with league basics

---

#### 🔐 PATCH /leagues/{league_id}
**Purpose:** Update league details

**Authentication Required + League Ownership**
- Must be authenticated
- Must be league creator OR admin
- Can update description, max_players, settings
- Cannot change creator_id or code

**Request Routes:**
```
Client (Authenticated)
    ↓ PATCH /leagues/1
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
LeagueService.update_league()
    → Check user is league.creator_id OR role=admin
    → If not creator: 403 Forbidden
    → Update allowed fields
    → Return updated league
```

**Response:** 200 OK with updated league details

---

#### 🔓/🔒 GET /leagues/{league_id}/members
**Purpose:** Get league member list

**Authentication:** Conditional based on league settings
- 🔓 **Public:**
  - Number of members (teams_count)
  - If league.show_member_names = true: member usernames and team names
- 🔒 **Membership Required:**
  - Complete member list with usernames, team names, join dates
  - Only visible to league members

**Request Routes:**
```
Client
    ↓ GET /leagues/1/members
[Optional: Authorization: Bearer <token>]
    ↓
LeagueService.get_league_members()
    → Check if authenticated
    → If authenticated, check if member of league
    → If league.show_member_names=true: Return member names
    → If league member: Return complete member list
    → If public non-member: Return member count only
```

**Public Response (show_member_names=false):**
```json
{
  "league_id": 1,
  "teams_count": 15,
  "members": []
}
```

**Public Response (show_member_names=true):**
```json
{
  "league_id": 1,
  "teams_count": 15,
  "members": [
    {
      "username": "john_doe",
      "team_name": "Speed Demons"
    }
  ]
}
```

**Member Response:**
```json
{
  "league_id": 1,
  "teams_count": 15,
  "members": [
    {
      "constructor_id": 1,
      "username": "john_doe",
      "team_name": "Speed Demons",
      "total_points": 456.5,
      "joined_at": "2026-01-08T12:00:00Z"
    }
  ]
}
```

---

#### 🔐 POST /leagues/{league_id}/join
**Purpose:** Join a league

**Authentication Required**
- Must be authenticated
- League must not be full (teams_count < max_players)
- League must be public OR user must have invite code (future)
- User cannot already be a member

**Request Routes:**
```
Client (Authenticated)
    ↓ POST /leagues/1/join
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
LeagueService.join_league()
    → Check league exists
    → Check league not full
    → Check user not already member
    → Create constructor for user in league
    → Return league details
```

**Response:** 200 OK with membership confirmation

---

#### 🔐 POST /leagues/{league_id}/leave
**Purpose:** Leave a league

**Authentication Required + League Membership**
- Must be authenticated
- Must be a member of the league
- Cannot leave if user is the only member (or must delete league)
- Constructor record is deleted (cascade)

**Request Routes:**
```
Client (Authenticated)
    ↓ POST /leagues/1/leave
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
LeagueService.leave_league()
    → Check user is member of league
    → If not member: 403 Forbidden
    → Check not only member (or require delete)
    → Delete constructor record
    → Return success message
```

**Response:** 200 OK with success message

---

#### 🔐 DELETE /leagues/{league_id}
**Purpose:** Delete a league

**Authentication Required + League Ownership**
- Must be authenticated
- Must be league creator OR admin
- All constructors, drafts, and data cascade deleted
- Cannot be undone

**Request Routes:**
```
Client (Authenticated)
    ↓ DELETE /leagues/1
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
LeagueService.delete_league()
    → Check user is league.creator_id OR role=admin
    → If not creator: 403 Forbidden
    → Delete league (cascades to all constructors)
    → Return success message
```

**Response:** 200 OK or 204 No Content

---

#### 🔓 GET /leagues/search
**Purpose:** Search for public leagues

**No Authentication Required**
- Search by name and description
- Only returns public leagues (is_private=false)
- Useful for league discovery

**Request Routes:**
```
Client
    ↓ GET /leagues/search?q=formula
🔓 Public Access
    ↓
LeagueService.search_public_leagues()
    → Search public leagues (is_private=false)
    → Search in name and description
    → Return matching leagues
```

**Response:** 200 OK with public leagues

---

## Constructor Service

### Service Overview
Manages a user's constructor (team) in a league. Each user can have multiple constructors across different leagues. Constructors accumulate points from weekly driver drafts.

### API Endpoints

| Method | Endpoint | Auth Level | Description | Access Control |
|--------|----------|------------|-------------|----------------|
| GET | `/constructors` | 🔐 Auth Required | List constructors (filtered by user) | User's own constructors only |
| GET | `/constructors/{constructor_id}` | 🔓/🔐 Optional | Get constructor details | Public (basic) or Member (full) |
| POST | `/constructors` | 🔐 Auth Required | Create constructor (join league) | User's own constructor only |
| PATCH | `/constructors/{constructor_id}` | 🔐 Auth Required + Ownership | Update constructor details | Constructor owner only |
| DELETE | `/constructors/{constructor_id}` | 🔐 Auth Required + Ownership | Delete constructor (leave league) | Constructor owner only |
| GET | `/constructors/{constructor_id}/drafts` | 🔐 Auth Required + Ownership | Get constructor's driver drafts | Constructor owner only |
| GET | `/constructors/{constructor_id}/points` | 🔓/🔐 Optional | Get constructor points by race | Public (basic) or Member (detailed) |

### Detailed Flow

#### 🔐 GET /constructors
**Purpose:** List constructors filtered by user

**Authentication Required**
- User must be authenticated
- Returns only user's own constructors
- Includes league information and team names
- Can filter by league_id

**Request Routes:**
```
Client (Authenticated)
    ↓ GET /constructors?league_id=1
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
ConstructorService.get_user_constructors()
    → Query constructors where user_id=current_user.id
    → Filter by league_id if provided
    → Join with league data
    → Return constructor list
```

**Response:** 200 OK with user's constructors

---

#### 🔓/🔐 GET /constructors/{constructor_id}
**Purpose:** Get constructor details

**Authentication:** Conditional
- 🔓 **Public:**
  - Basic info: constructor_id, team_name, total_points, rank
  - League name, creator username
  - No driver draft information
- 🔐 **Authenticated + Member:**
  - Full constructor details
  - Current driver drafts for next race
  - Historical draft performance
  - Points breakdown by race

**Request Routes:**
```
Client
    ↓ GET /constructors/1
[Optional: Authorization: Bearer <token>]
    ↓
ConstructorService.get_constructor()
    → Query constructor by ID
    → Check if authenticated
    → If authenticated, check if user is constructor owner OR league member
    → If public non-member: Return basic info only
    → If member: Return complete details including drafts
```

**Public Response:**
```json
{
  "constructor_id": 1,
  "team_name": "Speed Demons",
  "league_name": "Formula One Fantasy League",
  "total_points": 456.5,
  "rank": 3,
  "created_at": "2026-01-08T12:00:00Z"
}
```

**Member Response:**
```json
{
  "constructor_id": 1,
  "team_name": "Speed Demons",
  "league_name": "Formula One Fantasy League",
  "total_points": 456.5,
  "rank": 3,
  "user_id": 1,
  "is_active": true,
  "current_drafts": [
    {
      "race_id": 5,
      "drivers": [
        {
          "driver_id": 1,
          "driver_name": "Max Verstappen",
          "pick_number": 1
        },
        {
          "driver_id": 3,
          "driver_name": "Charles Leclerc",
          "pick_number": 2
        }
      ]
    }
  ],
  "points_by_race": [
    {"race_id": 1, "race_name": "Bahrain GP", "points": 25.0},
    {"race_id": 2, "race_name": "Saudi GP", "points": 18.0}
  ],
  "created_at": "2026-01-08T12:00:00Z"
}
```

---

#### 🔐 POST /constructors
**Purpose:** Create a new constructor (join a league)

**Authentication Required**
- User must be authenticated
- Must provide league_id and team_name
- Cannot create more than 1 constructor per league per user
- League must not be full (max_players limit)

**Request Routes:**
```
Client (Authenticated)
    ↓ POST /constructors
    ↓ { league_id: 1, team_name: "Speed Demons" }
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
ConstructorService.create_constructor()
    → Validate not already in league
    → Check league capacity
    → Create constructor record
    → Set user_id = current_user.id
    → Return constructor details
```

**Response:** 201 Created with constructor details

---

#### 🔐 PATCH /constructors/{constructor_id}
**Purpose:** Update constructor details

**Authentication Required + Constructor Ownership**
- Must be authenticated
- Must be the constructor owner (user_id matches)
- Can update team_name only
- Cannot change user_id or league_id

**Request Routes:**
```
Client (Authenticated, Owner)
    ↓ PATCH /constructors/1
    ↓ { team_name: "Updated Name" }
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
ConstructorService.update_constructor()
    → Check user is constructor.user_id
    → If not owner: 403 Forbidden
    → Update allowed fields only
    → Return updated constructor
```

**Response:** 200 OK with updated constructor details

---

#### 🔐 DELETE /constructors/{constructor_id}
**Purpose:** Delete constructor (leave league)

**Authentication Required + Constructor Ownership**
- Must be authenticated
- Must be the constructor owner
- All driver drafts cascade deleted
- Leaves the league

**Request Routes:**
```
Client (Authenticated, Owner)
    ↓ DELETE /constructors/1
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
ConstructorService.delete_constructor()
    → Check user is constructor.user_id
    → If not owner: 403 Forbidden
    → Delete constructor (cascades to all drafts)
    → Return success message
```

**Response:** 200 OK or 204 No Content

---

#### 🔐 GET /constructors/{constructor_id}/drafts
**Purpose:** Get constructor's driver drafts for all races

**Authentication Required + Constructor Ownership**
- Must be authenticated
- Must be the constructor owner
- Returns all draft picks for all races
- Includes points earned per pick

**Request Routes:**
```
Client (Authenticated, Owner)
    ↓ GET /constructors/1/drafts
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
ConstructorService.get_constructor_drafts()
    → Check user is constructor.user_id
    → If not owner: 403 Forbidden
    → Query all driver drafts by constructor_id
    → Join with race and driver data
    → Return complete draft history
```

**Response:** 200 OK with complete draft history

---

#### 🔓/🔐 GET /constructors/{constructor_id}/points
**Purpose:** Get constructor's points breakdown by race

**Authentication:** Conditional
- 🔓 **Public:**
  - Total points, rank
  - Limited point breakdown (top 3 races only for privacy)
- 🔐 **Authenticated + Member:**
  - Complete point breakdown by race
  - Points from each driver in each race (if owner)
  - Points by race for all members (if league member)

**Request Routes:**
```
Client
    ↓ GET /constructors/1/points
[Optional: Authorization: Bearer <token>]
    ↓
ConstructorService.get_constructor_points()
    → Query constructor by ID
    → Calculate points by race
    → Check if authenticated
    → If authenticated, check owner or league membership
    → Return appropriate level of detail
```

**Public Response:**
```json
{
  "constructor_id": 1,
  "total_points": 456.5,
  "rank": 3,
  "top_races": [
    {"race_id": 1, "race_name": "Bahrain GP", "points": 25.0},
    {"race_id": 2, "race_name": "Saudi GP", "points": 18.0},
    {"race_id": 3, "race_name": "Australian GP", "points": 15.0}
  ]
}
```

**Member Response:**
```json
{
  "constructor_id": 1,
  "total_points": 456.5,
  "rank": 3,
  "points_by_race": [
    {"race_id": 1, "race_name": "Bahrain GP", "points": 25.0, "pick_1": {"driver_id": 1, "points": 18.0}, "pick_2": {"driver_id": 3, "points": 7.0}},
    {"race_id": 2, "race_name": "Saudi GP", "points": 18.0, "pick_1": {"driver_id": 2, "points": 10.0}, "pick_2": {"driver_id": 4, "points": 8.0}}
  ]
}
```

---

## Draft Service

### Service Overview
Manages weekly driver drafting mechanics. Each constructor drafts 2 drivers per race. Draft order rotates between races.

### API Endpoints

| Method | Endpoint | Auth Level | Description | Access Control |
|--------|----------|------------|-------------|----------------|
| GET | `/leagues/{league_id}/draft-order` | 🔓/🔒 Optional | Get draft order for league/race | Public (who's next) or Members only |
| GET | `/leagues/{league_id}/draft-order/{race_id}` | 🔓/🔒 Optional | Get draft order for specific race | Public (who's next) or Members only |
| POST | `/leagues/{league_id}/draft-order/{race_id}` | 🔐 Auth Required + Membership + Admin | Manually set draft order | League creator or admin only |
| POST | `/constructors/{constructor_id}/drafts/{race_id}` | 🔐 Auth Required + Membership + Turn | Make driver draft pick | Constructor's turn only |
| GET | `/constructors/{constructor_id}/drafts/{race_id}` | 🔐 Auth Required + Membership | Get constructor's drafts for race | Constructor owner or league member only |
| PATCH | `/constructors/{constructor_id}/drafts/{draft_id}` | 🔐 Auth Required + Ownership + Draft Window | Update driver draft pick | Constructor owner only, during draft window |

### Detailed Flow

#### 🔓/🔒 GET /leagues/{league_id}/draft-order
**Purpose:** Get current or next draft order

**Authentication:** Conditional
- 🔓 **Public:**
  - Shows who picks next (upcoming picker only)
  - Does not show full order
- 🔒 **League Members:**
  - Complete draft order for next race
  - Order of constructors and their users
  - Draft method (sequential/snake)

**Request Routes:**
```
Client
    ↓ GET /leagues/1/draft-order
[Optional: Authorization: Bearer <token>]
    ↓
DraftService.get_draft_order()
    → Get next upcoming race
    → Query draft order for league + race
    → Check if authenticated
    → If authenticated, check if league member
    → If public non-member: Return next picker only
    → If member: Return complete draft order
```

**Public Response:**
```json
{
  "league_id": 1,
  "race_id": 5,
  "race_name": "Emilia Romagna GP",
  "next_picker": {
    "username": "jane_smith",
    "team_name": "Racing Academy"
  }
}
```

**Member Response:**
```json
{
  "league_id": 1,
  "race_id": 5,
  "race_name": "Emilia Romagna GP",
  "draft_method": "sequential",
  "order": [
    {"username": "jane_smith", "team_name": "Racing Academy", "order": 1},
    {"username": "john_doe", "team_name": "Speed Demons", "order": 2},
    {"username": "bob_wilson", "team_name": "Thunder Cars", "order": 3}
  ]
}
```

---

#### 🔓/🔒 GET /leagues/{league_id}/draft-order/{race_id}
**Purpose:** Get draft order for a specific race

**Authentication:** Conditional
- 🔓 **Public:**
  - Who is picking next for that race
  - Race status (whether draft is open)
- 🔒 **League Members:**
  - Complete draft order for that race
  - Historical draft orders for past races
  - Upcoming draft orders for future races

**Request Routes:**
```
Client
    ↓ GET /leagues/1/draft-order/5
[Optional: Authorization: Bearer <token>]
    ↓
DraftService.get_draft_order()
    → Query draft order for league + race_id
    → Check if authenticated
    → If authenticated, check if league member
    → Return appropriate level of detail
```

**Response:** Similar to `/draft-order` endpoint

---

#### 🔐 POST /leagues/{league_id}/draft-order/{race_id}
**Purpose:** Manually set draft order (admin function)

**Authentication Required + League Ownership**
- Must be authenticated
- Must be league creator OR admin
- Only available if league.allow_draft_change = true
- Notifies all members if league.notify_on_draft_change = true
- Can only be done before drafting begins

**Request Routes:**
```
Client (Authenticated, League Creator/Admin)
    ↓ POST /leagues/1/draft-order/5
    ↓ { order: [user_id_3, user_id_1, user_id_2, ...] }
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
DraftService.manually_set_draft_order()
    → Check user is league.creator_id OR role=admin
    → If not creator/admin: 403 Forbidden
    → Check league.allow_draft_change = true
    → Validate order includes all constructors
    → Update or create DraftOrder record
    → Mark as manual (is_manual=true)
    → If league.notify_on_draft_change: Notify all members
    → Return updated draft order
```

**Response:** 200 OK with updated draft order

---

#### 🔐 POST /constructors/{constructor_id}/drafts/{race_id}
**Purpose:** Make a driver draft pick

**Authentication Required + Membership + Draft Turn**
- Must be authenticated
- Must be constructor owner
- Must be constructor's turn in draft order
- Race must be in draft window (before race)
- Maximum 2 drivers per constructor per race
- Driver must not already be picked for this race

**Request Routes:**
```
Client (Authenticated, Owner, Their Turn)
    ↓ POST /constructors/1/drafts/5
    ↓ { driver_id: 1 }
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
DraftService.make_driver_pick()
    → Check user is constructor.user_id
    → If not owner: 403 Forbidden
    → Verify it's constructor's turn in draft order
    → If not their turn: 403 Forbidden
    → Check max 2 drivers per race
    → Check driver not already picked
    → Create DriverDraft record
    → Assign pick_number
    → Return draft pick details
```

**Response:** 201 Created with draft pick details

---

#### 🔐 GET /constructors/{constructor_id}/drafts/{race_id}
**Purpose:** Get constructor's driver drafts for a specific race

**Authentication Required + Membership**
- Must be authenticated
- Must be constructor owner OR league member
- Returns both draft picks if available
- Includes points earned

**Request Routes:**
```
Client (Authenticated, Owner or Member)
    ↓ GET /constructors/1/drafts/5
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
DraftService.get_constructor_drafts()
    → Check user is constructor.user_id OR league member
    → If not owner or member: 403 Forbidden
    → Query driver drafts by constructor + race
    → Join with driver information
    → Return draft picks
```

**Response:** 200 OK with draft picks

```json
{
  "constructor_id": 1,
  "race_id": 5,
  "race_name": "Emilia Romagna GP",
  "drafts": [
    {
      "driver_id": 1,
      "driver_name": "Max Verstappen",
      "team_name": "Red Bull Racing",
      "number": 1,
      "pick_number": 1,
      "points_earned": 18.0
    },
    {
      "driver_id": 3,
      "driver_name": "Charles Leclerc",
      "team_name": "Ferrari",
      "number": 16,
      "pick_number": 2,
      "points_earned": 7.0
    }
  ],
  "total_points": 25.0
}
```

---

#### 🔐 PATCH /constructors/{constructor_id}/drafts/{draft_id}
**Purpose:** Update driver draft pick (change selection)

**Authentication Required + Ownership + Draft Window**
- Must be authenticated
- Must be constructor owner
- Race must be in draft window (before race starts)
- Can only update if draft window is open
- Cannot update after race has started

**Request Routes:**
```
Client (Authenticated, Owner)
    ↓ PATCH /constructors/1/drafts/123
    ↓ { driver_id: 2 }
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
DraftService.update_driver_pick()
    → Check user is constructor.user_id
    → If not owner: 403 Forbidden
    → Check race is in draft window (status='upcoming')
    → Check new driver not already picked
    → Update DriverDraft driver_id
    → Return updated draft pick
```

**Response:** 200 OK with updated draft pick

---

## Scoring/Leaderboard Service

### Service Overview
Calculates points for constructors based on driver race results and generates leaderboards.

### API Endpoints

| Method | Endpoint | Auth Level | Description | Access Control |
|--------|----------|------------|-------------|----------------|
| GET | `/leagues/{league_id}/leaderboard` | 🔓 No Auth | Get league overall leaderboard | Public access |
| GET | `/leagues/{league_id}/leaderboard/{race_id}` | 🔓 No Auth | Get league leaderboard for specific race | Public access |
| GET | `/constructors/{constructor_id}/points` | 🔓/🔐 Optional | Get constructor points breakdown | Public (basic) or Member (detailed) |
| GET | `/drivers/{driver_id}/points` | 🔓 No Auth | Get driver points by race | Public access |
| GET | `/races/{race_id}/points` | 🔓 No Auth | Get points breakdown for race | Public access |

### Detailed Flow

#### 🔓 GET /leagues/{league_id}/leaderboard
**Purpose:** Get league overall/seasonal leaderboard

**No Authentication Required**
- Publicly accessible leaderboard
- Shows all constructors in league
- Ranked by total_points (descending)
- Includes rank changes from previous update
- Limited information (public only)

**Request Routes:**
```
Client
    ↓ GET /leagues/1/leaderboard
🔓 Public Access
    ↓
ScoringService.generate_leaderboard()
    → Query all constructors in league
    → Order by total_points DESC
    → Calculate ranks
    → Calculate rank changes (if tracking)
    → Return leaderboard
```

**Response:** 200 OK with leaderboard

```json
{
  "league_id": 1,
  "league_name": "Formula One Fantasy League",
  "race_id": null,
  "leaderboard": [
    {
      "rank": 1,
      "constructor_id": 3,
      "team_name": "Racing Academy",
      "username": "jane_smith",
      "total_points": 462.5,
      "change_in_rank": 2
    },
    {
      "rank": 2,
      "constructor_id": 1,
      "team_name": "Speed Demons",
      "username": "john_doe",
      "total_points": 456.5,
      "change_in_rank": -1
    },
    {
      "rank": 3,
      "constructor_id": 2,
      "team_name": "Thunder Cars",
      "username": "bob_wilson",
      "total_points": 442.0,
      "change_in_rank": -1
    }
  ],
  "updated_at": "2026-03-15T20:00:00Z"
}
```

---

#### 🔓 GET /leagues/{league_id}/leaderboard/{race_id}
**Purpose:** Get league leaderboard for a specific race

**No Authentication Required**
- Publicly accessible race-specific leaderboard
- Shows points earned in that specific race only
- Helpful for analyzing race performance
- Limited information (public only)

**Request Routes:**
```
Client
    ↓ GET /leagues/1/leaderboard/5
🔓 Public Access
    ↓
ScoringService.generate_leaderboard()
    → Pass race_id parameter
    → Query all constructors in league
    → Calculate points for specific race
    → Order by points DESC
    → Return race leaderboard
```

**Response:** 200 OK with race leaderboard

```json
{
  "league_id": 1,
  "league_name": "Formula One Fantasy League",
  "race_id": 5,
  "race_name": "Emilia Romagna GP",
  "leaderboard": [
    {
      "rank": 1,
      "constructor_id": 3,
      "team_name": "Racing Academy",
      "username": "jane_smith",
      "total_points": 30.0,
      "change_in_rank": null
    },
    {
      "rank": 2,
      "constructor_id": 1,
      "team_name": "Speed Demons",
      "username": "john_doe",
      "total_points": 25.0,
      "change_in_rank": null
    }
  ],
  "updated_at": "2026-03-15T20:00:00Z"
}
```

---

#### 🔓 GET /drivers/{driver_id}/points
**Purpose:** Get driver points by race

**No Authentication Required**
- Public driver performance data
- Shows points earned in each race
- Includes total and average points
- Driver statistics are public

**Request Routes:**
```
Client
    ↓ GET /drivers/1/points
🔓 Public Access
    ↓
ScoringService.get_driver_points()
    → Query driver by ID
    → Join with race results
    → Calculate points per race
    → Return points breakdown
```

**Response:** 200 OK with driver points breakdown

```json
{
  "driver_id": 1,
  "driver_name": "Max Verstappen",
  "total_points": 456.5,
  "average_points": 25.36,
  "points_by_race": [
    {"race_id": 1, "race_name": "Bahrain GP", "position": 1, "points": 25.0, "fastest_lap": true},
    {"race_id": 2, "race_name": "Saudi GP", "position": 2, "points": 18.0, "fastest_lap": false}
  ]
}
```

---

#### 🔓 GET /races/{race_id}/points
**Purpose:** Get points breakdown for a race

**No Authentication Required**
- Public race points distribution
- Shows all driver points for the race
- F1 scoring system application

**Request Routes:**
```
Client
    ↓ GET /races/5/points
🔓 Public Access
    ↓
ScoringService.get_race_points()
    → Query race by ID
    → Join with race results
    → Return all driver points
```

**Response:** 200 OK with race points

```json
{
  "race_id": 5,
  "race_name": "Emilia Romagna GP",
  "points": [
    {"driver_id": 1, "driver_name": "Max Verstappen", "position": 1, "points": 25.0, "fastest_lap_points": 1.0, "total": 26.0},
    {"driver_id": 3, "driver_name": "Charles Leclerc", "position": 2, "points": 18.0, "fastest_lap_points": 0.0, "total": 18.0}
  ]
}
```

---

## Notification Service

### Service Overview
Manages user notifications for leagues, races, scores, and system events.

### API Endpoints

| Method | Endpoint | Auth Level | Description | Access Control |
|--------|----------|------------|-------------|----------------|
| GET | `/notifications` | 🔐 Auth Required | Get user's notifications | User's own notifications only |
| GET | `/notifications/{notification_id}` | 🔐 Auth Required + Ownership | Get specific notification | User's own notification only |
| POST | `/notifications/{notification_id}/read` | 🔐 Auth Required + Ownership | Mark notification as read | User's own notification only |
| POST | `/notifications/read-all` | 🔐 Auth Required | Mark all notifications as read | User's own notifications only |
| DELETE | `/notifications/{notification_id}` | 🔐 Auth Required + Ownership | Delete notification | User's own notification only |

### Detailed Flow

#### 🔐 GET /notifications
**Purpose:** Get authenticated user's notifications

**Authentication Required** (User's own data only)
- Must be authenticated
- Returns only current user's notifications
- Can filter by is_read status
- Sorted by created_at DESC (newest first)

**Request Routes:**
```
Client (Authenticated)
    ↓ GET /notifications?is_read=false
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
NotificationService.get_user_notifications()
    → Query notifications where user_id=current_user.id
    → Filter by is_read if provided
    → Order by created_at DESC
    → Return notifications
```

**Response:** 200 OK with user's notifications

```json
{
  "notifications": [
    {
      "id": 1,
      "type": "race_finished",
      "title": "Emilia Romagna GP Results",
      "message": "The race results are now available. Check your updated scores!",
      "is_read": false,
      "link": "/races/5/results",
      "created_at": "2026-03-15T16:00:00Z"
    },
    {
      "id": 2,
      "type": "draft_order_changed",
      "title": "Draft Order Updated",
      "message": "Race 5 draft order has been manually updated by league admin.",
      "is_read": true,
      "link": "/leagues/1/draft-order/5",
      "created_at": "2026-03-14T10:00:00Z",
      "read_at": "2026-03-14T12:00:00Z"
    }
  ],
  "total": 15,
  "unread_count": 5
}
```

---

#### 🔐 GET /notifications/{notification_id}
**Purpose:** Get specific notification

**Authentication Required + Ownership**
- Must be authenticated
- Must be notification owner (user_id matches)
- Returns complete notification details

**Request Routes:**
```
Client (Authenticated, Owner)
    ↓ GET /notifications/1
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
NotificationService.get_notification()
    → Check user is notification.user_id
    → If not owner: 403 Forbidden
    → Return notification details
```

**Response:** 200 OK with notification details

---

#### 🔐 POST /notifications/{notification_id}/read
**Purpose:** Mark notification as read

**Authentication Required + Ownership**
- Must be authenticated
- Must be notification owner
- Updates is_read=true
- Records read_at timestamp

**Request Routes:**
```
Client (Authenticated, Owner)
    ↓ POST /notifications/1/read
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
NotificationService.mark_as_read()
    → Check user is notification.user_id
    → If not owner: 403 Forbidden
    → Update is_read = true
    → Update read_at = now()
    → Return updated notification
```

**Response:** 200 OK with notification mark as confirmation

---

#### 🔐 POST /notifications/read-all
**Purpose:** Mark all user's notifications as read

**Authentication Required**
- Must be authenticated
- Marks all unread notifications as read
- Bulk operation for convenience

**Request Routes:**
```
Client (Authenticated)
    ↓ POST /notifications/read-all
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
NotificationService.mark_all_as_read()
    → Query notifications where user_id=current_user.id AND is_read=false
    → Update all to is_read=true
    → Update read_at = now() for all
    → Return count of marked notifications
```

**Response:** 200 OK with marked count

```json
{
  "marked_count": 15
}
```

---

#### 🔐 DELETE /notifications/{notification_id}
**Purpose:** Delete notification

**Authentication Required + Ownership**
- Must be authenticated
- Must be notification owner
- Permanently removes notification

**Request Routes:**
```
Client (Authenticated, Owner)
    ↓ DELETE /notifications/1
    ↓ Authorization: Bearer <token>
🔐 JWT Middleware (verified user)
    ↓
NotificationService.delete_notification()
    → Check user is notification.user_id
    → If not owner: 403 Forbidden
    → Delete notification record
    → Return success
```

**Response:** 200 OK or 204 No Content

---

## Summary Table: API Endpoints by Authentication Level

### 🔓 No Authentication Required

| Service | Endpoint | Purpose | Rate Limit |
|---------|----------|---------|------------|
| Authentication | POST /auth/register | Register new user | 10/hour (IP) |
| Authentication | POST /auth/login | Login user | 30/hour (IP) |
| Authentication | POST /auth/refresh | Refresh token | 100/hour (IP) |
| Driver | GET /drivers | List drivers | Standard |
| Driver | GET /drivers/{id} | Get driver | Standard |
| Driver | GET /drivers/active | Get active drivers | Standard |
| Driver | GET /drivers/rankings | Get driver rankings | Standard |
| Driver | GET /drivers/search | Search drivers | Standard |
| Driver | GET /drivers/team/{name} | Get drivers by team | Standard |
| Race | GET /races | List races | Standard |
| Race | GET /races/{id} | Get race | Standard |
| Race | GET /races/{id}/results | Get race results | Standard |
| Race | GET /races/upcoming | Get upcoming races | Standard |
| League | GET /leagues | List leagues | Standard |
| League | GET /leagues/{id} | Get league basics | Standard |
| League | GET /leagues/search | Search leagues | Standard |
| Scoring | GET /leagues/{id}/leaderboard | Get overall leaderboard | Standard |
| Scoring | GET /leagues/{id}/leaderboard/{race_id} | Get race leaderboard | Standard |
| Scoring | GET /drivers/{id}/points | Get driver points | Standard |
| Scoring | GET /races/{id}/points | Get race points | Standard |

### 🔐 Authentication Required

| Service | Endpoint | Purpose | Ownership Check |
|---------|----------|---------|-----------------|
| Authentication | GET /auth/me | Get current user | N/A (self) |
| User | GET /users/search | Search users | N/A |
| User | PATCH /users/me | Update own profile | Self only |
| User | GET /users/me/constructors | Get user's constructors | Self only |
| User | GET /users/me/leagues | Get user's leagues | Self only |
| League | POST /leagues | Create league | Self (creator) |
| League | GET /leagues/{id}/members | Get league members | Membership check |
| League | POST /leagues/{id}/join | Join league | Not already member |
| League | POST /leagues/{id}/leave | Leave league | Membership required |
| Constructor | GET /constructors | Get user's constructors | Self only |
| Constructor | POST /constructors | Create constructor | Self only |
| Draft | GET /constructors/{id}/drafts/{race_id} | Get drafts | Membership check |
| Notification | GET /notifications | Get notifications | Self only |
| Notification | GET /notifications/{id} | Get notification | Self only |
| Notification | POST /notifications/{id}/read | Mark as read | Self only |
| Notification | POST /notifications/read-all | Mark all read | Self only |
| Notification | DELETE /notifications/{id} | Delete notification | Self only |

### 🔒 Authentication + Membership Required

| Service | Endpoint | Purpose | Access Control |
|---------|----------|---------|----------------|
| League | PATCH /leagues/{id} | Update league | League creator or admin |
| League | DELETE /leagues/{id} | Delete league | League creator or admin |
| League | GET /leagues/{id}/members | Get member list | Public (basic) or member (full) |
| Constructor | GET /constructors/{id} | Get constructor details | Public (basic) or member (full) |
| Constructor | PATCH /constructors/{id} | Update constructor | Owner only |
| Constructor | DELETE /constructors/{id} | Delete constructor | Owner only |
| Constructor | GET /constructors/{id}/drafts | Get all drafts | Owner only |
| Constructor | GET /constructors/{id}/points | Get points | Public (basic) or member (detailed) |
| Draft | GET /leagues/{league_id}/draft-order | Get draft order | Public (next only) or member (full) |
| Draft | GET /leagues/{league_id}/draft-order/{race_id} | Get race draft order | Public (next only) or member (full) |
| Draft | POST /leagues/{league_id}/draft-order/{race_id} | Set draft order | League creator or admin |
| Draft | POST /constructors/{constructor_id}/drafts/{race_id} | Make draft pick | Owner + turn check |
| Draft | PATCH /constructors/{constructor_id}/drafts/{draft_id} | Update draft pick | Owner + draft window |

---

## Security Best Practices

### Rate Limiting Strategy

**Unauthenticated Requests:**
- Standard: 100 requests/hour per IP
- Sensitive endpoints (register, login): Stricter limits (10-30/hour)
- Refresh tokens: 100/hour per IP

**Authenticated Requests:**
- Standard: 1000 requests/hour per user
- Premium users: 5000 requests/hour per user

### Authentication Flow

```
1. User Registration (No Auth)
   - Rate limited (10/hour)
   - Email validation
   - Password strength check
   - CAPTCHA (recommended)

2. User Login (No Auth)
   - Rate limited (30/hour)
   - Attempt tracking
   - IP blocking on failures

3. Access Token Usage (Auth Required)
   - 15-minute expiration
   - Include in Authorization header
   - Rotate via refresh token

4. Refresh Token (No Auth*)
   - 7-day expiration
   - Include in request body
   - Revoke on logout
```

### Membership Validation

For endpoints requiring membership (🔒), the validation flow is:

```
1. Verify JWT token (authenticated user)
2. Extract user_id and role from token
3. Check ownership/membership:
   - Is user the resource owner?
   - Is user a league member?
   - Is user the league creator/admin?
4. If any check fails: 403 Forbidden
5. If all checks pass: Proceed with request
```

### Data Exposure Levels

**Level 1: Public (No Auth)**
- Basic resource information
- No personal data
- No private settings
- Useful for discovery and browsing

**Level 2: Authenticated User**
- User's own private data
- Full resource details for owned items
- Member-only information for joined resources

**Level 3: League Member**
- Complete member lists
- Draft information
- Points breakdowns
- League strategy insights

**Level 4: League Creator/Admin**
- Create/delete leagues
- Update league settings
- Manual draft order changes
- Moderation powers

---

## Rate Limiting by Endpoint Priority

**Critical Security Endpoints (Stricter Limits):**
- POST /auth/register: 10/hour per IP
- POST /auth/login: 30/hour per IP
- POST /auth/refresh: 100/hour per IP

**Standard Public Endpoints:**
- All GET /drivers, /races: 100/hour per IP
- All GET /leagues (search, list): 100/hour per IP
- All GET /leaderboards, rankings: 100/hour per IP

**Authenticated Endpoints:**
- Standard user operations: 1000/hour per user
- Draft picks: freer during draft windows (tracked separately)
- Notifications: freer for read operations (tracked separately)

---

## Common Error Responses

### 401 Unauthorized
- Missing or invalid JWT token
- Token expired
- Invalid refresh token

### 403 Forbidden
- Resource ownership/membership check failed
- Not user's turn in draft
- League settings prevent action
- Rate limit exceeded (429 for rate limits)

### 404 Not Found
- Resource does not exist
- Invalid ID provided

### 409 Conflict
- User already in league
- Username/email already exists
- Driver already picked for race

### 422 Unprocessable Entity
- Validation error
- Business logic violation (league full, etc.)

---

## Related Documentation

- [API Endpoints](api_endpoints.md) - Detailed API request/response formats
- [Authentication](authentication.md) - JWT token details and security
- [Data Models](data_models.md) - Database models and relationships
- [Business Logic](business_logic.md) - Service layer implementation
- [Security](security.md) - Comprehensive security guidelines