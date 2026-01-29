# Architecture Overview

## System Architecture

This document describes the overall architecture of the Fantasy F1 Backend system, including system diagrams, layer architecture, and component interactions.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (React/Vue/Angular)                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│                       (FastAPI)                              │
├─────────────────────────────────────────────────────────────┤
│                      Middleware Layer                         │
│  • Authentication (JWT)                                      │
│  • Rate Limiting                                             │
│  • CORS                                                      │
│  • Error Handling                                            │
│  • Request Logging                                           │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  User Svc    │ │ConstructSvc  │ │  Draft Svc   │ │  League Svc  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐           ┌─────────────────┐
│   PostgreSQL    │           │      Redis      │
│   (Database)    │           │     (Cache)     │
└─────────────────┘           └─────────────────┘
         │                               │
         └───────────────┬───────────────┘
                         ▼
┌─────────────────────────────────────────┐
│            Celery Tasks                  │
│  • Race Results Sync                    │
│  • Result Polling & Verification        │
│  • Score Calculations                   │
│  • Notifications                         │
│  • Data Cleanup                          │
└─────────────────────────────────────────┘
```

---

## Layer Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│                 (API Endpoints/Routers)                     │
│  • app/api/v1/endpoints/                                     │
└────────────────────────────┬───────────────────────────────┘
                             │
┌────────────────────────────┴───────────────────────────────┐
│                    Business Logic Layer                     │
│                    (Services)                                │
│  • app/services/                                             │
│  • Flask-like service objects with business logic           │
└────────────────────────────┬───────────────────────────────┘
                             │
┌────────────────────────────┴───────────────────────────────┐
│                    Data Access Layer                        │
│                    (Database Models)                         │
│  • app/models/                                               │
│  • SQLAlchemy ORM models                                    │
└────────────────────────────┬───────────────────────────────┘
                             │
┌────────────────────────────┴───────────────────────────────┐
│                    Infrastructure Layer                      │
│  • Database (PostgreSQL)                                     │
│  • Cache (Redis)                                             │
│  • Message Queue (Celery/Redis)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Overview

### Presentation Layer

The presentation layer handles incoming HTTP requests and sends responses. It consists of:

- **API Endpoints**: RESTful endpoints defined using FastAPI
- **Routers**: Organized API routes by feature (auth, users, teams, etc.)
- **Request/Response Models**: Pydantic schemas for validation and serialization
- **Middleware**: Authentication, rate limiting, CORS, error handling

**Key Files:**
- `app/api/v1/endpoints/` - Router definitions
- `app/api/v1/` - API initialization
- `app/core/security.py` - Security middleware
- `app/core/rate_limiting.py` - Rate limiting middleware

  ### Business Logic Layer

The business logic layer contains all application logic and business rules:

- **Services**: Service classes that implement business operations
- **Validation**: Business rule validation beyond input validation
- **Calculations**: Scoring calculations, point computations
- **Orchestration**: Coordinating multiple operations

**Key Services:**
- `UserService` - User management operations
- `ConstructorService` - User's constructor management per league (formerly TeamService)
- `DriverService` - Driver operations
- `RaceService` - Race operations
- `LeagueService` - League management and league settings
- `DraftService` - Weekly driver draft management and rotation logic (NEW)
- `ScoringService` - Point calculations and leaderboard generation

**Key Files:**
- `app/services/user_service.py`
- `app/services/constructor_service.py`
- `app/services/draft_service.py`
- `app/services/scoring_service.py`
- `app/services/league_service.py`
- `app/services/driver_service.py`
- `app/services/race_service.py`

### Data Access Layer

The data access layer handles all database operations:

- **Models**: SQLAlchemy ORM models representing database tables
- **Queries**: Database queries using SQLAlchemy async API
- **Migrations**: Database schema changes via Alembic
- **Session Management**: Async database session handling

**Key Files:**
- `app/models/` - All database models
- `app/db/base.py` - Base model class
- `app/db/session.py` - Database session factory
- `alembic/` - Database migrations

### Infrastructure Layer

The infrastructure layer provides foundational services:

- **Database**: PostgreSQL database for persistent storage
- **Cache**: Redis for caching and session storage
- **Message Queue**: Celery with Redis for background tasks
- **Foreign API**: External F1 API integration

**Key Components:**
- PostgreSQL 15 - Primary database
- Redis 7.0 - Cache and Celery broker
- Celery 5.3.6 - Background task processing
- httpx 0.25.2 - Async HTTP client for external APIs

---

## Data Flow

### Request Flow

```
Client Request
    ↓
FastAPI Router
    ↓
Middleware (Auth, Rate Limit)
    ↓
Dependency Injection (DB Session, User)
    ↓
API Endpoint
    ↓
Service Layer
    ↓
Database Operations
    ↓
Response to Client
```

### Example: Make Driver Pick

```
1. Client sends POST /api/v1/constructors/{constructor_id}/drafts
   ↓
2. FastAPI validates request with Pydantic
   ↓
3. Auth middleware extracts JWT token
   ↓
4. API endpoint calls DraftService.make_driver_pick()
   ↓
5. Service validates draft order (correct pick sequence)
   ↓
6. Service checks if constructor has < 2 drivers for this race
   ↓
7. Service checks if driver hasn't been picked by another constructor
   ↓
8. Service creates DriverDraft model
   ↓
9. Database session commits transaction
   ↓
10. Service returns created driver draft
   ↓
11. API endpoint returns 201 Created response
```

---

## Background Task Flow

### Celery Task Execution

```
1. Celery Beat triggers scheduled task
   ↓
2. Task is sent to Redis broker
   ↓
3. Celery Worker picks up task
   ↓
4. Worker creates async database session
   ↓
5. Task executes business logic
   ↓
6. Results stored in Redis backend
   ↓
7. Worker completes task
   ↓
8. Flower shows task status
```

### Example: Race Result Polling

```
1. Hourly check by Celery Beat
   ↓
2. schedule_hourly_polling() runs
   ↓
3. Finds races without results
   ↓
4. Schedules poll_race_results() for each
   ↓
5. Worker polls F1 API
   ↓
6. If results found:
   a. Store results in database
   b. Update race status
   c. Schedule verification tasks
   d. Notify users
```

---

## Security Architecture

### Authentication Flow

```
1. Client POST /api/v1/auth/login
   ↓
2. Server validates credentials
   ↓
3. Server generates JWT access token (30 min)
   ↓
4. Server generates JWT refresh token (30 days)
   ↓
5. Stores refresh token in Redis
   ↓
6. Returns tokens to client
   ↓
7. Client stores tokens securely
   ↓
8. Client includes access token in Authorization header
   ↓
9. Server validates token on each request
   ↓
10. Server extracts user ID from token
```

### Authorization Levels

- **User**: Can access their own resources
- **Admin**: Can access all resources
- **Public**: Can access public endpoints (driver list, race schedule)

---

## Caching Architecture

### Cache Strategy

```
Read Request
    ↓
Try Redis Cache
    ↓
    Hit? → Return cached data
    ↓
    Miss?
    ↓
Query Database
    ↓
Store in Redis (with TTL)
    ↓
Return to client
```

### Cache Layers

1. **Leaderboard Cache** (4 hour TTL + tasked clear upon race results and calculations)
   - Key: `leaderboard:{league_id}:{race_id or 'all'}`
   - Invalidated on score updates

2. **Driver Rankings Cache** (4 hour TTL + tasked clear upon race results and calculations)
   - Key: `driver_rankings`
   - Invalidated on race result updates

3. **Race Results Cache** (4 hour TTL + tasked clear upon race results and calculations)
   - Key: `race_results:{race_id}`
   - Invalidated on result corrections

---

## Error Handling Architecture

### Error Handling Flow

```
1. Error occurs in service layer
   ↓
2. Service catches and logs error
   ↓
3. Service raises custom exception
   ↓
4. Global exception handler catches
   ↓
5. Handler logs error details
   ↓
6. Handler returns standardized error response
   ↓
7. Client receives error details
```

### Error Types

- `ValidationError` - Invalid input (400)
- `NotFoundError` - Resource not found (404)
- `AuthenticationError` - Auth failure (401)
- `PermissionError` - Insufficient permissions (403)
- `DatabaseError` - Database issues (500)
- `InternalServerError` - Unexpected errors (500)

---

## Scalability Considerations

### Horizontal Scaling

- **API Servers**: Multiple FastAPI instances behind load balancer
- **Database**: Read replicas for read-heavy operations
- **Cache**: Redis cluster for distributed caching
- **Workers**: Multiple Celery workers for parallel task processing

### Vertical Scaling

- **Database**: Connection pooling
- **Cache**: Increased memory allocation
- **Workers**: Increased concurrency settings

---

## Monitoring and Observability

### Logging

- Structured JSON logging
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Request/response logging
- Error stack traces
- Task execution logs

### Metrics

- API response times
- Database query times
- Cache hit/miss ratios
- Task execution times
- Error rates

### Monitoring Tools

- **Sentry**: Error tracking and alerting
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Flower**: Celery task monitoring

---

## Related Documentation

- [Technology Stack](technology_stack.md) - Detailed technology information
- [Data Models](data_models.md) - Database schema and models
- [API Endpoints](api_endpoints.md) - API specification
- [Caching Strategy](caching.md) - Caching implementation details
- [Celery Tasks](celery_tasks.md) - Background task implementation