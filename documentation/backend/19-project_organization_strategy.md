# Backend Project Organization Strategy

This document outlines the comprehensive organization strategy for the Fantasy F1 Backend project, designed for long-term maintainability, scalability, and developer productivity.

---

## Executive Summary

The backend project follows a **Clean Architecture approach** with clear separation of concerns across four primary layers. This strategy balances immediate implementation needs with long-term scalability, ensuring that as the application grows, it remains manageable and understandable.

**Key Principles:**
- **Layered Architecture**: Clear boundaries between API, service, data, and infrastructure layers
- **Feature-Based Organization**: Group related functionality by domain concepts
- **Dependency Injection**: Loose coupling through FastAPI's dependency system
- **Consistent Naming**: Predictable structure reduces cognitive load
- **Domain-Driven Design**: Align code with business domain concepts

---

## Overview of Proposed Structure

```
backend/
├── app/                          # Application code
│   ├── __init__.py
│   ├── main.py                   # FastAPI application entry point
│   ├── core/                     # Core infrastructure and utilities
│   │   ├── __init__.py
│   │   ├── config.py            # Application configuration
│   │   ├── security.py          # JWT, password hashing
│   │   ├── dependencies.py      # Dependency injection factories
│   │   ├── logging.py           # Logging configuration
│   │   ├── exceptions.py        # Custom exception classes
│   │   └── rate_limiting.py     # Rate limiting middleware
│   │
│   ├── models/                   # SQLAlchemy ORM models (Data Layer)
│   │   ├── __init__.py
│   │   ├── base.py              # Base model class
│   │   ├── user.py              # User model
│   │   ├── league.py            # League model
│   │   ├── constructor.py       # Constructor (user's team in league) model
│   │   ├── driver.py            # Driver model
│   │   ├── driver_draft.py      # DriverDraft model (weekly picks)
│   │   ├── draft_order.py       # DraftOrder model
│   │   ├── race.py              # Race model
│   │   ├── race_result.py       # RaceResult model
│   │   └── notification.py      # Notification model
│   │
│   ├── schemas/                  # Pydantic models (Request/Response validation)
│   │   ├── __init__.py
│   │   ├── user.py              # User schemas
│   │   ├── league.py            # League schemas
│   │   ├── constructor.py       # Constructor schemas
│   │   ├── driver.py            # Driver schemas
│   │   ├── driver_draft.py      # DriverDraft schemas
│   │   ├── draft_order.py       # DraftOrder schemas
│   │   ├── race.py              # Race schemas
│   │   └── config.py            # Configuration schemas
│   │
│   ├── services/                 # Business logic layer
│   │   ├── __init__.py
│   │   ├── base_service.py      # Base service class with CRUD operations
│   │   ├── user_service.py      # User business logic
│   │   ├── league_service.py    # League business logic
│   │   ├── constructor_service.py  # Constructor business logic
│   │   ├── driver_service.py    # Driver operations (read-only)
│   │   ├── race_service.py      # Race operations (read-only)
│   │   ├── draft_service.py     # Draft order and pick management
│   │   ├── scoring_service.py   # Points calculations
│   │   └── external_data_service.py  # Jolpica API integration
│   │
│   ├── api/                      # API layer (Presentation)
│   │   ├── __init__.py
│   │   ├── deps.py              # API-specific dependencies
│   │   │
│   │   └── v1/                  # API version 1
│   │       ├── __init__.py
│   │       ├── api.py           # API router aggregation
│   │       ├── endpoints/       # Endpoint modules
│   │       │   ├── __init__.py
│   │       │   ├── auth.py      # Authentication endpoints
│   │       │   ├── users.py     # User endpoints
│   │       │   ├── drivers.py   # Driver endpoints
│   │       │   ├── races.py     # Race endpoints
│   │       │   ├── leagues.py   # League endpoints
│   │       │   ├── constructors.py # Constructor endpoints
│   │       │   └── drafts.py    # Draft endpoints
│   │       │
│   │       └── openapi.py       # OpenAPI documentation customization
│   │
│   ├── db/                       # Database layer
│   │   ├── __init__.py
│   │   ├── session.py           # Database session factory
│   │   ├── base.py              # Database base configuration
│   │   └── init_db.py           # Database initialization utilities
│   │
│   ├── cache/                    # Redis caching layer
│   │   ├── __init__.py
│   │   ├── client.py            # Redis client factory
│   │   └── utils.py             # Cache utilities and decorators
│   │
│   ├── tasks/                    # Celery background tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py        # Celery application factory
│   │   ├── result_polling.py    # Race result polling tasks
│   │   ├── data_sync.py         # Jolpica API sync tasks
│   │   ├── scoring.py           # Score calculation tasks
│   │   └── notifications.py     # Notification tasks
│   │
│   └── utils/                    # Utility functions
│       ├── __init__.py
│       ├── validators.py        # Custom validators
│       ├── helpers.py           # General helper functions
│       └── formatters.py        # Data formatting utilities
│
├── tests/                        # Test suite
│   ├── __init__.py
│   ├── conftest.py              # Pytest configuration and fixtures
│   ├── unit/                    # Unit tests
│   │   ├── __init__.py
│   │   ├── services/            # Service layer tests
│   │   │   ├── test_user_service.py
│   │   │   ├── test_draft_service.py
│   │   │   └── test_scoring_service.py
│   │   ├── models/              # Model tests
│   │   └── utils/               # Utility tests
│   ├── integration/             # Integration tests
│   │   ├── __init__.py
│   │   ├── api/                 # API endpoint tests
│   │   │   ├── test_auth.py
│   │   │   ├── test_leagues.py
│   │   │   └── test_drafts.py
│   │   └── database/            # Database integration tests
│   └── e2e/                     # End-to-end tests
│       ├── test_user_flows.py
│       └── test_draft_flows.py
│
├── alembic/                      # Database migrations
│   ├── env.py                   # Alembic environment configuration
│   ├── script.py.mako           # Migration script template
│   └── versions/                # Migration versions
│       ├── __init__.py
│       └── *.py                 # Individual migration files
│
├── scripts/                      # Utility scripts
│   ├── init_db.py               # Initialize database with seed data
│   ├── sync_data.py             # Manual data sync script
│   └ migrate_data.py            # Data migration utilities
│
├── docs/                         # Generated documentation
│   └── api/                     # Auto-generated API docs
│
├── .env.example                 # Example environment variables
├── .env                         # Local environment variables (gitignored)
├── .gitignore                   # Git ignore rules
├── requirements.txt             # Python dependencies
├── requirements-dev.txt         # Development dependencies
├── pyproject.toml              # Project configuration (modern Python)
├── alembic.ini                  # Alembic configuration
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                   # Application Docker image
└── README.md                    # Project README
```

---

## Detailed Organization Strategy

### 1. Application Layer Structure (`app/`)

#### 1.1 Core Infrastructure (`app/core/`)

**Purpose**: Contains foundational infrastructure that doesn't change frequently.

**Components**:
- **`config.py`**: Centralized configuration management using Pydantic Settings
  - Environment-based configuration
  - Type-safe settings
  - Secrets management
  
- **`security.py`**: Security-related utilities
  - JWT token generation and validation
  - Password hashing (bcrypt)
  - Token blacklisting for logout
  
- **`dependencies.py`**: FastAPI dependency factories
  - Database session dependencies
  - Current user dependencies
  - Service injection
  
- **`logging.py`**: Structured logging setup
  - JSON format for production
  - Console format for development
  - Request ID middleware
  
- **`exceptions.py`**: Custom exception hierarchy
  - Base exception classes
  - HTTP-specific exceptions
  - Business logic exceptions
  
- **`rate_limiting.py`**: Rate limiting middleware
  - Token bucket or sliding window
  - Redis-backed for distributed systems
  - Tiered limits (free, premium, admin)

#### 1.2 Data Models (`app/models/`)

**Purpose**: SQLAlchemy ORM models representing database schema.

**Organization Principles**:
- One model per file
- Model files match database table concepts
- Include relationships as lazy-loaded
- Add computed properties for derived data
- Include JSON serialization methods

**Best Practices**:
```python
# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    # ... other fields
    
    # Relationships
    leagues = relationship("League", back_populates="creator")
    constructors = relationship("Constructor", back_populates="user")
    
    # Computed properties
    @property
    def full_display_name(self) -> str:
        return f"{self.full_name} (@{self.username})"
```

**Model File Convention**:
- Use snake_case for filenames: `user.py`, `driver_draft.py`
- Use PascalCase for class names: `User`, `DriverDraft`
- Include docstrings explaining model purpose
- Define all relationships at the bottom of the file

#### 1.3 Pydantic Schemas (`app/schemas/`)

**Purpose**: Request/response validation and serialization.

**Organization Principles**:
- Separate files by domain concept
- Multiple schemas per file (Create, Update, Response)
- Inheritance for shared fields
- Include only necessary fields (no PII in responses)

**Naming Convention**:
```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Base user schema with shared fields."""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    """Schema for user creation."""
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    """Schema for user update (all fields optional)."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True  # Pydantic v2
```

**Schema Type Patterns**:
- `XBase`: Shared base fields
- `XCreate`: Request schema for creation
- `XUpdate`: Request schema for updates (all optional)
- `XResponse`: Response schema (include computed fields)
- `XDetail`: Detailed response with relationships
- `XList`: List response with pagination metadata

#### 1.4 Service Layer (`app/services/`)

**Purpose**: Business logic layer coordinating between API and data.

**Organization Principles**:
- One service per domain concept
- Services inherit from `BaseService` for CRUD operations
- Business-specific operations in separate methods
- Async/await throughout
- Comprehensive error handling

**Service Structure**:
```python
# app/services/constructor_service.py
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.constructor import Constructor
from app.models.league import League
from app.schemas.constructor import ConstructorCreate, ConstructorUpdate
from app.services.base_service import BaseService
from app.core.exceptions import ValidationError, BusinessLogicError

class ConstructorService(BaseService[Constructor, ConstructorCreate, ConstructorUpdate]):
    """Service for constructor (user's team in league) operations."""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Constructor, db)
    
    # Business-specific methods
    async def get_user_constructor_in_league(
        self,
        user_id: int,
        league_id: int
    ) -> Optional[Constructor]:
        """Get a user's constructor in a specific league."""
        result = await self.db.execute(
            select(Constructor).where(
                and_(
                    Constructor.user_id == user_id,
                    Constructor.league_id == league_id
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def create_constructor(
        self,
        constructor_data: ConstructorCreate,
        user_id: int
    ) -> Constructor:
        """Create a new constructor with validation."""
        # Business logic and validation
        pass
```

**Service Best Practices**:
1. **Single Responsibility**: Each service handles one domain
2. **Validation First**: Validate before database operations
3. **Atomic Operations**: Use database transactions
4. **Clear Errors**: Raise specific exceptions with helpful messages
5. **No HTTP**: Services should be HTTP-agnostic
6. **Testability**: Easy to unit test with mock DB sessions

#### 1.5 API Layer (`app/api/`)

**Purpose**: HTTP API endpoints using FastAPI.

**Organization Structure**:
```
app/api/
├── v1/                    # API version 1
│   ├── api.py            # Main API router (aggregates all routers)
│   ├── openapi.py        # OpenAPI customization
│   └── endpoints/        # Individual endpoint modules
│       ├── auth.py       # POST /auth/login, /auth/register
│       ├── users.py      # GET /users, GET /users/{id}
│       ├── leagues.py    # CRUD for leagues
│       ├── constructors.py # CRUD for constructors
│       ├── drafts.py     # Draft operations
│       └── ...
```

**Endpoint File Structure**:
```python
# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.auth import TokenResponse
from app.services.user_service import UserService
from app.api.deps import get_db
from app.core.security import create_access_token

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Register a new user."""
    user_service = UserService(db)
    existing = await user_service.get_by_username(user_in.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    user = await user_service.create(user_in)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """Authenticate user and return tokens."""
    user_service = UserService(db)
    user = await user_service.authenticate(credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    access_token = create_access_token(user_id=user.id)
    return TokenResponse(access_token=access_token, token_type="bearer")
```

**API Best Practices**:
1. **Thin Controllers**: Keep endpoint logic minimal
2. **Dependency Injection**: Use FastAPI's `Depends()` for services
3. **Validation First**: Pydantic validates before endpoint executes
4. **Resource-Based URLs**: RESTful resource naming
5. **HTTP Status Codes**: Use appropriate status codes
6. **Response Models**: Always specify `response_model`
7. **Error Handling**: Raise HTTPException consistently

#### 1.6 Database Layer (`app/db/`)

**Purpose**: Database connection and session management.

**Components**:
- **`session.py`**: Async session factory
  - Session management
  - Connection pooling
  - Transaction handling

- **`base.py`**: SQLAlchemy base class
  - Common model metadata
  - Timestamp mixins
  - Soft delete support

- **`init_db.py`**: Database initialization
  - Create tables (dev only)
  - Seed data loading
  - Index creation

**Session Management**:
```python
# app/db/session.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncSession:
    """Get database session for dependency injection."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

#### 1.7 Cache Layer (`app/cache/`)

**Purpose**: Redis caching for performance optimization.

**Components**:
- **`client.py`**: Redis client factory
- **`utils.py`**: Cache decorators and utilities

**Cache Decorator Pattern**:
```python
# app/cache/utils.py
from functools import wraps
from typing import Optional, Callable, Any
from app.cache.client import get_redis
import json

def cache_result(ttl: int = 300, key_prefix: str = ""):
    """Decorator to cache function results."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            redis = get_redis()
            
            # Generate cache key
            cache_key = f"{key_prefix}:{args[0].__class__.__name__}:{args[1:]}"
            
            # Try cache
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            await redis.setex(cache_key, ttl, json.dumps(result))
            
            return result
        return wrapper
    return decorator
```

#### 1.8 Background Tasks (`app/tasks/`)

**Purpose**: Celery background tasks for async operations.

**Components**:
- **`celery_app.py`**: Celery application factory
- **`result_polling.py`**: Race result polling
- **`data_sync.py`**: External API synchronization
- **`scoring.py`**: Score calculation
- **`notifications.py`**: Notification queue

**Task Structure**:
```python
# app/tasks/result_polling.py
from celery import shared_task
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.services.external_data_service import ExternalDataService
from app.core.logging import logger

@shared_task(bind=True, max_retries=3)
def poll_race_results(self, race_external_id: str):
    """Poll F1 API for race results."""
    async def _poll():
        async with AsyncSessionLocal() as db:
            service = ExternalDataService(db)
            try:
                count = await service.sync_race_results(race_external_id)
                logger.info(f"Synced {count} race results for {race_external_id}")
                return count
            except Exception as e:
                logger.error(f"Failed to sync race results: {e}")
                raise self.retry(exc=e, countdown=60)
    
    import asyncio
    return asyncio.run(_poll())
```

#### 1.9 Utilities (`app/utils/`)

**Purpose**: Shared utility functions and helpers.

**Components**:
- **`validators.py`**: Custom validators
- **`helpers.py`**: General helper functions
- **`formatters.py`**: Data formatting utilities

**Example**:
```python
# app/utils/validators.py
import re
from app.core.exceptions import ValidationError

def validate_team_name(team_name: str) -> None:
    """Validate team name meets requirements."""
    if not re.match(r'^[a-zA-Z0-9\s\-_]{3,50}$', team_name):
        raise ValidationError(
            "Team name must be 3-50 characters, "
            "alphanumeric with spaces, hyphens, and underscores only"
        )

def validate_draft_order(user_ids: list[int]) -> None:
    """Validate draft order contains all constructor users exactly once."""
    if len(user_ids) != len(set(user_ids)):
        raise ValidationError("Draft order must contain unique user IDs")
```

---

### 2. Testing Strategy (`tests/`)

#### 2.1 Test Organization

**Structure**:
```
tests/
├── conftest.py              # Pytest fixtures and configuration
├── unit/                    # Unit tests (fast, isolated)
│   ├── services/           # Service layer tests
│   ├── models/             # Model tests
│   └── utils/              # Utility tests
├── integration/            # Integration tests
│   ├── api/                # API endpoint tests
│   └── database/           # Database integration tests
└── e2e/                    # End-to-end tests (slowest)
```

#### 2.2 Testing Best Practices

**Unit Tests**:
- Mock database sessions
- Test individual service methods
- Assert business logic validation
- No external dependencies

**Integration Tests**:
- Test database operations
- Test API endpoints with test database
- Use test fixtures for consistent data
- Clean up after each test

**E2E Tests**:
- Test complete user flows
- Simulate real user interactions
- Test critical business processes
- Use test database

**Example Test**:
```python
# tests/unit/services/test_draft_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.draft_service import DraftService
from app.core.exceptions import ValidationError

@pytest.mark.asyncio
async def test_make_driver_pick_invalid_order():
    """Test that driver pick validation fails for incorrect order."""
    db = AsyncMock(spec=AsyncSession)
    service = DraftService(db)
    
    # Mock database responses
    mock_constructor = MagicMock()
    mock_constructor.league_id = 1
    mock_constructor.user_id = 5
    
    # Call service
    with pytest.raises(ValidationError) as exc_info:
        await service.make_driver_pick(
            constructor_id=1,
            race_id=1,
            driver_id=10,
            pick_number=3
        )
    
    assert "not your turn to pick" in str(exc_info.value)
```

#### 2.3 Test Fixtures (`conftest.py`)

```python
# tests/conftest.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models import *  # Import all models

# Test database (in-memory SQLite or test PostgreSQL)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture
async def db_session():
    """Create a test database session."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session):
    """Create a test FastAPI client."""
    from fastapi.testclient import TestClient
    from app.main import app
    
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()
```

---

### 3. Database Migrations (`alembic/`)

**Purpose**: Version-controlled database schema changes.

**Structure**:
```
alembic/
├── env.py                   # Alembic environment configuration
├── script.py.mako           # Migration script template
└── versions/                # Migration versions
    ├── __init__.py
    ├── 001_initial_schema.py
    ├── 002_add_driver_drafts.py
    └── ...
```

**Migration Workflow**:
1. **Create Migration**: `alembic revision --autogenerate -m "message"`
2. **Review Migration**: Check generated SQL manually
3. **Apply Migration**: `alembic upgrade head`
4. **Rollback (if needed)**: `alembic downgrade -1`

**Best Practices**:
- Never modify existing migrations
- Always review autogenerated changes
- Include data migrations in separate files
- Test migrations on copy of production data

---

### 4. Utility Scripts (`scripts/`)

**Purpose**: Administrative and maintenance scripts.

**Examples**:
- **`init_db.py`**: Initialize database with seed data
- **`sync_data.py`**: Manual data sync from Jolpica API
- **`migrate_data.py`**: Data migration utilities
- **`create_admin.py`**: Create initial admin user

**Script Structure**:
```python
# scripts/init_db.py
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def create_admin_user():
    """Create initial admin user."""
    async with AsyncSessionLocal() as db:
        admin = User(
            username="admin",
            email="admin@fantasyf1.com",
            full_name="Admin User",
            hashed_password=get_password_hash("AdminPass123!"),
            is_active=True,
            is_superuser=True
        )
        db.add(admin)
        await db.commit()
        print(f"Created admin user: {admin.username}")

if __name__ == "__main__":
    asyncio.run(create_admin_user())
```

---

## Naming Conventions

### File and Directory Naming

| Type | Convention | Example |
|------|-----------|---------|
| Python files | `snake_case.py` | `user_service.py`, `draft_service.py` |
| Directories | `snake_case/` | `services/`, `endpoints/` |
| Test files | `test_*.py` | `test_user_service.py`, `test_auth.py` |
| Config files | `kebab-case` | `docker-compose.yml`, `pyproject.toml` |

### Code Naming

| Type | Convention | Example |
|------|-----------|---------|
| Classes | `PascalCase` | `UserService`, `DriverDraft` |
| Functions | `snake_case` | `get_user()`, `calculate_points()` |
| Variables | `snake_case` | `user_id`, `total_points` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_DRIVERS_PER_RACE`, `DEFAULT_PAGE_SIZE` |
| Private members | `_leading_underscore` | `_internal_method()`, `_cached_value` |
| Database tables | `snake_case` | `users`, `driver_drafts`, `draft_orders` |
| Database columns | `snake_case` | `created_at`, `total_points` |

### API Endpoint Naming

| Type | Convention | Example |
|------|-----------|---------|
| Resources | Plural nouns | `/users`, `/leagues`, `/drivers` |
| Actions | verb-noun | `/leagues/{id}/join`, `/drafts/{id}/pick` |
| Nested resources | Parent/Child | `/leagues/{id}/constructors`, `/races/{id}/results` |
| Path parameters | `{entity}_id` | `/{league_id}`, `/{driver_id}` |
| Query parameters | `snake_case` | `?page_size=20&offset=0` |

---

## Code Organization Patterns

### 1. Dependency Injection Pattern

**Purpose**: Loose coupling and testability.

**Implementation**:
```python
# app/core/dependencies.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.user_service import UserService
from app.services.league_service import LeagueService

# Service dependencies
def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Get UserService instance."""
    return UserService(db)

def get_league_service(db: AsyncSession = Depends(get_db)) -> LeagueService:
    """Get LeagueService instance."""
    return LeagueService(db)

# Usage in endpoint
@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    user_service: UserService = Depends(get_user_service)
):
    return await user_service.get(user_id)
```

### 2. Repository Pattern (Optional for Complex Queries)

**Purpose**: Encapsulate complex database queries.

**When to Use**:
- Complex queries with multiple joins
- Queries used across multiple services
- Performance-critical queries needing optimization

**Implementation**:
```python
# app/repositories/constructor_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.constructor import Constructor
from app.models.driver_draft import DriverDraft
from typing import List

class ConstructorRepository:
    """Repository for Constructor complex queries."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_leaderboard_with_stats(self, league_id: int) -> List[dict]:
        """Get leaderboard with calculated statistics."""
        query = (
            select(
                Constructor,
                func.sum(DriverDraft.points_earned).label("total_points"),
                func.count(DriverDraft.id).label("picks_count")
            )
            .join(DriverDraft, Constructor.id == DriverDraft.constructor_id)
            .where(Constructor.league_id == league_id)
            .group_by(Constructor.id)
            .order_by(func.sum(DriverDraft.points_earned).desc())
        )
        result = await self.db.execute(query)
        return result.all()
```

### 3. Factory Pattern

**Purpose**: Create complex objects with multiple steps.

**Implementation**:
```python
# app/services/factories/league_factory.py
from app.models.league import League, LeagueSettings
from app.core.config import settings
import secrets

class LeagueFactory:
    """Factory for creating League objects."""
    
    @staticmethod
    def create_default_league(name: str, creator_id: int) -> League:
        """Create league with default settings."""
        return League(
            name=name,
            creator_id=creator_id,
            code=LeagueFactory._generate_unique_code(),
            max_teams=settings.DEFAULT_MAX_TEAMS,
            is_private=True,
            draft_method="sequential",
            scoring_system="standard"
        )
    
    @staticmethod
    def _generate_unique_code() -> str:
        """Generate 6-character unique league code."""
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return ''.join(secrets.choice(chars) for _ in range(6))
```

### 4. Strategy Pattern (for Draft Methods)

**Purpose**: Encapsulate interchangeable algorithms.

**Implementation**:
```python
# app/services/strategies/draft_strategy.py
from abc import ABC, abstractmethod
from typing import List

class DraftStrategy(ABC):
    """Base class for draft strategies."""
    
    @abstractmethod
    def get_next_picker(self, current_order: List[int], current_pick: int) -> int:
        """Get next user ID to pick."""
        pass

class SequentialDraftStrategy(DraftStrategy):
    """Sequential draft: 1, 2, 3, 1, 2, 3..."""
    
    def get_next_picker(self, current_order: List[int], current_pick: int) -> int:
        constructors_per_pick = 2
        constructor_index = (current_pick // constructors_per_pick) % len(current_order)
        return current_order[constructor_index]

class SnakeDraftStrategy(DraftStrategy):
    """Snake draft: 1, 2, 3, 3, 2, 1..."""
    
    def get_next_picker(self, current_order: List[int], current_pick: int) -> int:
        constructors_per_pick = 2
        round_num = current_pick // (constructors_per_pick * len(current_order))
        pick_in_round = current_pick % len(current_order)
        
        if round_num % 2 == 0:
            return current_order[pick_in_round]
        else:
            return current_order[len(current_order) - 1 - pick_in_round]
```

---

## Implementation Guidelines

### 1. Development Workflow

**Step 1: Plan the Feature**
- Review requirements
- Identify affected models, schemas, services, and endpoints
- Create feature branch: `git checkout -b feature/draft-system`

**Step 2: Implement Data Models**
- Create/update model files in `app/models/`
- Run migration: `alembic revision --autogenerate -m "Add draft models"`
- Review and apply: `alembic upgrade head`

**Step 3: Create Schemas**
- Create/update schema files in `app/schemas/`
- Include Create, Update, and Response schemas
- Add validation rules

**Step 4: Implement Service Layer**
- Create service in `app/services/`
- Write business logic
- Add comprehensive error handling
- Write unit tests

**Step 5: Create API Endpoints**
- Create endpoint file in `app/api/v1/endpoints/`
- Register router in `app/api/v1/api.py`
- Write integration tests

**Step 6: Document the API**
- Ensure OpenAPI documentation is complete
- Add docstrings to public functions
- Update project documentation if needed

**Step 7: Test End-to-End**
- Run unit tests: `pytest tests/unit/`
- Run integration tests: `pytest tests/integration/`
- Run e2e tests: `pytest tests/e2e/`
- Manual API testing with Swagger UI

**Step 8: Code Review and Merge**
- Create pull request
- Get code review feedback
- Address feedback
- Merge to main branch

### 2. Code Review Checklist

**Functionality**:
- [ ] Feature meets requirements
- [ ] Edge cases are handled
- [ ] Error handling is comprehensive
- [ ] Business rules are enforced

**Code Quality**:
- [ ] Code follows naming conventions
- [ ] Functions are small and focused
- [ ] No code duplication
- [ ] Comments explain "why", not "what"
- [ ] Type hints are used

**Testing**:
- [ ] Unit tests written and pass
- [ ] Integration tests written and pass
- [ ] Test coverage is adequate (>80%)
- [ ] Edge cases are tested

**Documentation**:
- [ ] API documentation is complete
- [ ] Code is self-documenting
- [ ] Complex logic has docstrings
- [ ] README reflects changes

**Security**:
- [ ] Input validation is robust
- [ ] SQL injection prevention (parameterized queries)
- [ ] Authentication/authorization checks
- [ ] Sensitive data is not logged
- [ ] Rate limiting considered

**Performance**:
- [ ] N+1 query problems avoided
- [ ] Database indexes are used
- [ ] Caching considered where appropriate
- [ ] Pagination is implemented

---

## Scalability Considerations

### 1. Service Boundaries

**Current**: Monolithic FastAPI application

**Future Considerations**:
- Microservices for different domains (if needed)
- Message-driven architecture for async operations
- API Gateway for routing and rate limiting

### 2. Database Scaling

**Current**: Single PostgreSQL instance

**Future Considerations**:
- Read replicas for database reads
- Connection pooling optimization
- Database sharding for multi-tenant scenarios
- Caching layer for frequently accessed data

### 3. Caching Strategy

**Current**: Redis for session and result caching

**Future Considerations**:
- CDN for static assets
- Multi-level caching (browser, CDN, Redis, database)
- Cache warming for leaderboard data
- Distributed cache for high-traffic scenarios

### 4. Task Processing

**Current**: Celery with Redis broker

**Future Considerations**:
- Task queues for different priority levels
- Distributed task execution
- Task result storage and monitoring
- Autoscaling task workers

---

## Long-Term Maintenance

### 1. Documentation Standards

**Code Documentation**:
- All public functions have docstrings
- Complex algorithms have inline comments
- Configuration values have explanations
- API changes are documented

**Architecture Documentation**:
- Keep architecture diagrams updated
- Document architectural decisions (ADRs)
- Maintain system design documents
- Update API documentation regularly

### 2. Monitoring and Observability

**Logging**:
- Structured JSON logging in production
- Request/response logging
- Error tracking with Sentry
- Performance metrics

**Metrics**:
- API response times
- Database query performance
- Cache hit/miss ratios
- Error rates and types

**Alerting**:
- Critical error alerts
- Performance degradation alerts
- Database connection alerts
- Service availability alerts

### 3. Refactoring Strategy

**Continuous Refactoring**:
- Dedicated time for technical debt
- Regular code reviews catch issues early
- Refactor in small increments
- Maintain test coverage

**Major Refactoring**:
- Plan and document changes
- Create feature branch
- Incremental migration strategy
- Comprehensive testing before merge

### 4. Dependency Management

**Regular Updates**:
- Monthly review of dependencies
- Security updates immediately
- Breaking changes carefully evaluated
- Test updates thoroughly

**Version Pinning**:
- Pin production versions
- Update development versions
- Document upgrade notes
- Maintain backward compatibility

---

## Tooling and Configuration

### 1. Development Tools

**Required Tools**:
- Python 3.11+
- PostgreSQL 15+
- Redis 7.0+
- Docker & Docker Compose

**Recommended Tools**:
- VS Code with Python extension
- Postman or Insomnia for API testing
- DBeaver or pgAdmin for database management
- Redis Commander for Redis inspection

### 2. Code Quality Tools

**Linting and Formatting**:
```bash
# Black - Code formatter
black app/ tests/

# Ruff - Fast linter (replaces flake8, isort)
ruff check app/ tests/

# mypy - Type checking
mypy app/

# pytest - Testing
pytest tests/ --cov=app --cov-report=html
```

**Pre-commit Hooks**:
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
  
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix]
  
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [pydantic]
```

### 3. CI/CD Pipeline

**GitHub Actions**:
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Run linters
        run: |
          ruff check app/
          mypy app/
      
      - name: Run tests
        run: pytest tests/ --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Team Collaboration Guidelines

### 1. Branch Strategy

**Branch Types**:
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production hotfixes
- `refactor/*` - Code refactoring

**Branch Workflow**:
1. Create feature branch from `develop`
2. Implement changes with tests
3. Create pull request to `develop`
4. Code review and feedback
5. Merge to `develop` after approval
6. Periodically merge `develop` to `main`

### 2. Commit Message Convention

**Format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/process/tooling changes

**Examples**:
```
feat(draft): implement snake draft strategy

Add support for snake draft method where pick order reverses
each round. Includes validation and notification support.

Closes #123
```

```
fix(auth): resolve JWT token refresh issue

Fix token refresh failing when refresh token is expired.
Update error handling to guide users to re-authenticate.

Fixes #456
```

### 3. Code of Conduct

**Communication**:
- Be respectful and professional
- Ask questions before making assumptions
- Provide constructive feedback
- Acknowledge and learn from mistakes

**Development**:
- Write clean, maintainable code
- Test thoroughly before committing
- Document complex logic
- Consider performance implications

**Collaboration**:
- Review code with empathy
- Help teammates learn
- Share knowledge freely
- Celebrate successes together

---

## Risk Mitigation

### 1. Common Pitfalls

**Performance Issues**:
- N+1 query problems → Use eager loading
- Missing database indexes → Analyze query patterns
- Excessive database calls → Implement caching
- Large result sets → Use pagination

**Security Vulnerabilities**:
- SQL injection → Use parameterized queries
- XSS attacks → Validate and sanitize inputs
- Authentication bypass → Implement proper JWT validation
- Rate limiting bypass → Use distributed rate limiting

**Data Integrity**:
- Concurrent updates → Use database transactions
- Orphaned records → Implement cascading deletes
- Inconsistent state → Use database constraints
- Data corruption → Regular backups

### 2. Error Handling Strategy

**Error Categories**:
1. **Validation Errors** (400) - Invalid input
2. **Authentication Errors** (401) - Not authenticated
3. **Authorization Errors** (403) - Not authorized
4. **Not Found Errors** (404) - Resource doesn't exist
5. **Conflict Errors** (409) - Resource state conflict
6. **Rate Limit Errors** (429) - Too many requests
7. **Server Errors** (500) - Unexpected errors

**Error Handling Flow**:
```
Service Layer
    ↓ (raises specific exception)
API Endpoint
    ↓ (converts to HTTPException)
Global Exception Handler
    ↓ (formats error response)
Client
```

---

## Conclusion

This organization strategy provides a solid foundation for building a scalable, maintainable, and performant Fantasy F1 backend system. By following these guidelines and patterns, the team can:

1. **Develop Quickly**: Clear structure reduces cognitive load
2. **Scale Gracefully**: Layered architecture supports growth
3. **Maintain Effectively**: Consistent patterns make updates easier
4. **Collaborate Efficiently**: Shared conventions reduce friction
5. **Deploy Confidently**: Comprehensive testing ensures reliability

### Next Steps

**Before First Sprint**:
1. ✅ Review and approve this organization strategy
2. ⬜ Set up project structure following this document
3. ⬜ Configure development tools (linting, formatting, testing)
4. ⬜ Set up CI/CD pipeline
5. ⬜ Create initial database migration

**During First Sprint**:
1. Implement core models (User, League, Constructor, Driver, Race)
2. Set up authentication system
3. Create basic API endpoints for users and leagues
4. Implement draft system services
5. Write comprehensive tests

**Continuous Improvement**:
1. Regular team reviews of the organization strategy
2. Update documentation as patterns evolve
3. Share lessons learned from implementation
4. Refactor when patterns don't fit new requirements

---

## Related Documentation

- [Architecture Overview](01-architecture.md) - System architecture and component interactions
- [Technology Stack](02-technology_stack.md) - Detailed technology choices
- [Data Models](03-data_models.md) - Database schema documentation
- [API Endpoints](04-api_endpoints.md) - API specification
- [Business Logic](06-business_logic.md) - Service layer implementation
- [Testing Strategy](14-testing.md) - Testing guidelines and best practices
- [Implementation Roadmap](13-implementation_roadmap.md) - Development timeline