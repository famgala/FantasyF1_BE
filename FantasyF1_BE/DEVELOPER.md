# Fantasy F1 Backend - Developer Documentation

This comprehensive guide covers everything developers need to know about working with the Fantasy F1 Backend API.

## Table of Contents

- [Project Setup](#project-setup)
- [Architecture Overview](#architecture-overview)
- [API Integration Patterns](#api-integration-patterns)
- [Testing Guide](#testing-guide)
- [Deployment Instructions](#deployment-instructions)
- [Database Migrations](#database-migrations)
- [Celery Tasks](#celery-tasks)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)

---

## Project Setup

### Prerequisites

- Python 3.11 or higher
- Docker and Docker Compose
- Git
- PostgreSQL client (optional, for direct DB access)
- Redis client (optional, for direct cache access)

### Local Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/famgala/FantasyF1_BE.git
cd FantasyF1_BE
```

2. **Create a virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements-dev.txt
```

4. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start database services with Docker:**
```bash
docker-compose up -d postgres redis
```

6. **Run database migrations:**
```bash
alembic upgrade head
```

7. **Start the application:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

8. **Access the API:**
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Docker Development Setup

For a fully containerized development environment:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### IDE Configuration

#### VS Code

Install these extensions:
- Python (Microsoft)
- Pylance (Microsoft)
- Black Formatter (Microsoft)
- Ruff (Microsoft)
- Docker (Microsoft)

Configure `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "python.linting.mypyEnabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

#### PyCharm

1. Open the project directory
2. Configure Python interpreter to use the virtual environment
3. Enable Black formatter in Settings → Tools → External Tools
4. Enable Ruff in Settings → Tools → External Tools
5. Enable MyPy in Settings → Tools → External Tools

---

## Architecture Overview

### System Architecture

The Fantasy F1 Backend follows a layered architecture pattern:

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (FastAPI)                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Endpoints (app/api/v1/endpoints/)                 │ │
│  │  - Request validation                              │ │
│  │  - Response serialization                          │ │
│  │  - Authentication/Authorization                    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Service Layer (Business Logic)         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Services (app/services/)                          │ │
│  │  - Business rules                                  │ │
│  │  - Data transformation                            │ │
│  │  - External API integration                        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Data Access Layer (ORM)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Models (app/models/)                              │ │
│  │  - Database schema definition                      │ │
│  │  - Relationships                                   │ │
│  │  - Validation                                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Database & Cache Layer                     │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  PostgreSQL      │  │  Redis           │           │
│  │  - Relational    │  │  - Cache         │           │
│  │  - Transactions  │  │  - Sessions      │           │
│  │  - Indexes       │  │  - Message Queue │           │
│  └──────────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. API Layer (`app/api/`)

**Purpose:** Handle HTTP requests and responses

**Structure:**
- `app/api/deps.py` - Common dependencies (auth, database, etc.)
- `app/api/v1/endpoints/` - API endpoint implementations
- `app/main.py` - FastAPI application setup and router registration

**Key Patterns:**
- Use Pydantic schemas for request/response validation
- Implement dependency injection for database sessions and authentication
- Return consistent response formats
- Use HTTP status codes appropriately

**Example Endpoint:**
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID"""
    user = await user_service.get(db, user_id)
    return user
```

#### 2. Service Layer (`app/services/`)

**Purpose:** Implement business logic and data operations

**Structure:**
- Each domain has its own service module (e.g., `user_service.py`, `league_service.py`)
- Services contain CRUD operations and business rules
- Services are async and use database sessions

**Key Patterns:**
- All database operations are async
- Use SQLAlchemy async sessions
- Implement proper error handling
- Return domain objects or raise exceptions

**Example Service:**
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.core.exceptions import NotFoundException

async def get_user(db: AsyncSession, user_id: int) -> User:
    """Get user by ID"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException(f"User {user_id} not found")
    return user
```

#### 3. Data Models (`app/models/`)

**Purpose:** Define database schema and relationships

**Structure:**
- Each table has its own model file
- Models use SQLAlchemy ORM with async support
- Relationships are defined with proper foreign keys

**Key Patterns:**
- Use `Base` from `app.db.base` as the declarative base
- Define all columns with proper types and constraints
- Use `relationship()` for foreign key relationships
- Add indexes for frequently queried columns

**Example Model:**
```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    leagues = relationship("League", back_populates="creator")
```

#### 4. Schemas (`app/schemas/`)

**Purpose:** Define request/response validation with Pydantic

**Structure:**
- Separate schemas for create, update, and response operations
- Use Pydantic v2 for validation
- Include type hints for all fields

**Key Patterns:**
- Use `BaseModel` for all schemas
- Separate create/update schemas from response schemas
- Use `Config` class for ORM mode and other settings
- Include validation rules in field definitions

**Example Schema:**
```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True
```

#### 5. Core Utilities (`app/core/`)

**Purpose:** Shared utilities and configurations

**Modules:**
- `config.py` - Application configuration from environment variables
- `security.py` - JWT token generation/validation, password hashing
- `logging.py` - Logging configuration
- `exceptions.py` - Custom exception classes
- `dependencies.py` - FastAPI dependency factories
- `rate_limiting.py` - Rate limiting implementation

#### 6. Background Tasks (`app/tasks/`)

**Purpose:** Asynchronous task processing with Celery

**Structure:**
- `celery_app.py` - Celery application configuration
- `celery_config.py` - Celery settings
- `data_sync.py` - Data synchronization tasks

**Key Patterns:**
- Use Celery for long-running or scheduled tasks
- Define tasks with `@celery_app.task` decorator
- Return structured results for monitoring
- Implement retry logic for external API calls

---

## API Integration Patterns

### Authentication

The API uses JWT (JSON Web Tokens) for authentication.

#### Login Flow

```python
# 1. User submits credentials
POST /api/v1/auth/login
{
  "username": "user@example.com",
  "password": "securepassword"
}

# 2. Server returns tokens
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

#### Using Access Token

```python
# Include token in Authorization header
GET /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Token Refresh

```python
POST /api/v1/auth/refresh
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Protected Endpoints

Use the `get_current_user` dependency for authentication:

```python
from fastapi import Depends
from app.api.deps import get_current_user
from app.models.user import User

@router.get("/protected")
async def protected_endpoint(
    current_user: User = Depends(get_current_user)
):
    return {"user_id": current_user.id, "username": current_user.username}
```

### Admin Endpoints

Use the `get_current_superuser` dependency for admin-only endpoints:

```python
from fastapi import Depends
from app.api.deps import get_current_superuser

@router.get("/admin/stats")
async def admin_stats(
    current_user: User = Depends(get_current_superuser)
):
    # Only accessible by superusers
    return {"total_users": 100}
```

### Error Handling

The API uses standard HTTP status codes and consistent error responses:

```python
# Success responses
200 OK - Request successful
201 Created - Resource created
204 No Content - Successful deletion

# Client errors
400 Bad Request - Invalid input
401 Unauthorized - Authentication required
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
422 Unprocessable Entity - Validation error
429 Too Many Requests - Rate limit exceeded

# Server errors
500 Internal Server Error - Unexpected error
```

**Error Response Format:**
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Pagination

List endpoints support pagination with `skip` and `limit` parameters:

```python
GET /api/v1/users?skip=0&limit=10

# Response
{
  "items": [...],
  "total": 100,
  "skip": 0,
  "limit": 10
}
```

### Filtering and Sorting

Many endpoints support filtering and sorting:

```python
# Filter by status
GET /api/v1/leagues?is_private=false

# Sort by date
GET /api/v1/races?sort=race_date&order=asc

# Search
GET /api/v1/leagues?search=Formula
```

### Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Default: 100 requests per minute per IP
- Authentication endpoints: 10 requests per minute
- Admin endpoints: 50 requests per minute

**Rate Limit Response:**
```json
{
  "detail": "Rate limit exceeded",
  "retry_after": 60
}
```

---

## Testing Guide

### Test Structure

```
tests/
├── conftest.py              # Pytest fixtures and configuration
├── test_auth_endpoints.py   # Authentication endpoint tests
├── test_user_service.py     # User service unit tests
├── test_main.py             # Main application tests
└── ...
```

### Running Tests

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_user_service.py

# Run specific test
pytest tests/test_user_service.py::test_get_user

# Run with verbose output
pytest tests/ -v

# Run with debug output
pytest tests/ -vv --tb=short
```

### Test Fixtures

The `conftest.py` file provides common fixtures:

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base

@pytest.fixture
async def db_session():
    """Create a test database session"""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(db_session: AsyncSession):
    """Create a test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

### Writing Unit Tests

Test service layer logic:

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_service import get_user
from app.models.user import User

@pytest.mark.asyncio
async def test_get_user(db_session: AsyncSession):
    """Test getting a user by ID"""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    
    # Test
    result = await get_user(db_session, user.id)
    assert result.username == "testuser"
    assert result.email == "test@example.com"
```

### Writing Integration Tests

Test API endpoints:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    """Test user creation endpoint"""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert "id" in data
```

### Testing Authentication

```python
@pytest.mark.asyncio
async def test_protected_endpoint(client: AsyncClient):
    """Test protected endpoint requires authentication"""
    # Without authentication
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
    
    # With authentication
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"username": "test@example.com", "password": "SecurePass123"}
    )
    token = login_response.json()["access_token"]
    
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
```

### Testing Error Cases

```python
@pytest.mark.asyncio
async def test_get_user_not_found(db_session: AsyncSession):
    """Test getting non-existent user raises error"""
    from app.core.exceptions import NotFoundException
    
    with pytest.raises(NotFoundException):
        await get_user(db_session, 99999)
```

### Test Coverage

Generate coverage reports:

```bash
# Generate HTML coverage report
pytest tests/ --cov=app --cov-report=html

# View report
open htmlcov/index.html  # On Windows: start htmlcov/index.html

# Check coverage percentage
pytest tests/ --cov=app --cov-report=term-missing
```

**Target Coverage:** >80% for business logic

### Best Practices

1. **Use async/await** for all async operations
2. **Use fixtures** for common setup/teardown
3. **Test both success and failure cases**
4. **Mock external dependencies** (API calls, file system)
5. **Keep tests independent** - don't rely on test order
6. **Use descriptive test names** - `test_<function>_<scenario>`
7. **Arrange-Act-Assert pattern** - organize test code clearly

---

## Deployment Instructions

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/fantasyf1

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# API
PORT=8000
DEBUG=false

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External API
JOLPICA_API_BASE_URL=https://jolpica.f1jersey.com/api
```

### Docker Deployment

#### Build Docker Image

```bash
# Build image
docker build -t fantasyf1-be .

# Build with specific tag
docker build -t fantasyf1-be:v1.0.0 .
```

#### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

#### Production Docker Compose

Use `docker-compose.yml` for production:

```bash
# Start production services
docker-compose -f docker-compose.yml up -d

# Stop production services
docker-compose -f docker-compose.yml down
```

### Kubernetes Deployment

#### Create ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fantasyf1-config
data:
  DATABASE_URL: "postgresql+asyncpg://user:pass@postgres:5432/fantasyf1"
  REDIS_URL: "redis://redis:6379/0"
```

#### Create Secret

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: fantasyf1-secret
type: Opaque
stringData:
  SECRET_KEY: "your-secret-key"
```

#### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fantasyf1-be
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fantasyf1-be
  template:
    metadata:
      labels:
        app: fantasyf1-be
    spec:
      containers:
      - name: app
        image: fantasyf1-be:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: fantasyf1-config
        - secretRef:
            name: fantasyf1-secret
```

#### Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: fantasyf1-be
spec:
  selector:
    app: fantasyf1-be
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

#### Apply to Cluster

```bash
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

### Database Migrations

#### Create Migration

```bash
# Generate migration
alembic revision --autogenerate -m "description of changes"

# Review the generated migration file
# Edit if necessary
```

#### Apply Migration

```bash
# Upgrade to latest
alembic upgrade head

# Upgrade to specific version
alembic upgrade +1

# Downgrade one version
alembic downgrade -1

# Downgrade to base
alembic downgrade base
```

#### Migration Best Practices

1. **Always review** auto-generated migrations
2. **Use descriptive messages** for migration names
3. **Test migrations** on a copy of production data
4. **Never modify** existing migration files
5. **Keep migrations reversible** when possible

### Health Checks

The application includes health check endpoints:

```bash
# Check API health
curl http://localhost:8000/health

# Expected response
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

### Monitoring

#### Flower (Celery Monitoring)

```bash
# Start Flower
celery -A app.tasks.celery_app flower --port=5555

# Access at http://localhost:5555
```

#### Logs

```bash
# View application logs
docker-compose logs -f app

# View Celery worker logs
docker-compose logs -f celery_worker

# View Celery beat logs
docker-compose logs -f celery_beat
```

### Performance Tuning

#### Database Connection Pool

Adjust in `.env`:

```bash
# Increase pool size for high traffic
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
```

#### Redis Connection Pool

Adjust in `app/cache/client.py`:

```python
redis_pool = ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    max_connections=50
)
```

#### Celery Worker Concurrency

Adjust in `docker-compose.yml`:

```yaml
celery_worker:
  command: celery -A app.tasks.celery_app worker --concurrency=4
```

---

## Database Migrations

### Migration Workflow

1. **Make model changes** in `app/models/`
2. **Generate migration:**
```bash
alembic revision --autogenerate -m "Add new field to User model"
```
3. **Review migration** in `alembic/versions/`
4. **Test migration** locally
5. **Apply migration:**
```bash
alembic upgrade head
```
6. **Commit migration file** to version control

### Common Migration Patterns

#### Add New Column

```python
# alembic/versions/xxx_add_new_column.py
def upgrade():
    op.add_column('users', sa.Column('new_field', sa.String(100), nullable=True))

def downgrade():
    op.drop_column('users', 'new_field')
```

#### Add Index

```python
def upgrade():
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

def downgrade():
    op.drop_index('ix_users_email', table_name='users')
```

#### Add Foreign Key

```python
def upgrade():
    op.add_column('posts', sa.Column('user_id', sa.Integer(), nullable=False))
    op.create_foreign_key('fk_posts_user_id_users', 'posts', 'users', ['user_id'], ['id'])

def downgrade():
    op.drop_constraint('fk_posts_user_id_users', 'posts', type_='foreignkey')
    op.drop_column('posts', 'user_id')
```

#### Change Column Type

```python
def upgrade():
    op.alter_column('users', 'username',
                    existing_type=sa.String(50),
                    type_=sa.String(100))

def downgrade():
    op.alter_column('users', 'username',
                    existing_type=sa.String(100),
                    type_=sa.String(50))
```

### Migration Best Practices

1. **Always make migrations reversible**
2. **Use `nullable=True` for new columns** on existing tables
3. **Set default values** when adding non-nullable columns
4. **Test migrations on production-like data**
5. **Never modify existing migration files**
6. **Keep migrations small and focused**

---

## Celery Tasks

### Task Structure

```python
from app.tasks.celery_app import celery_app
from typing import Any, Dict

@celery_app.task(name="tasks.sync_race_results")
def sync_race_results_task() -> Dict[str, Any]:
    """Sync race results from external API"""
    try:
        # Task logic here
        return {"status": "success", "processed": 10}
    except Exception as e:
        return {"status": "error", "message": str(e)}
```

### Scheduled Tasks

Configure in `app/tasks/celery_config.py`:

```python
from celery.schedules import crontab

beat_schedule = {
    'sync-race-results': {
        'task': 'tasks.sync_race_results',
        'schedule': crontab(minute='*/120'),  # Every 2 hours
    },
    'cleanup-old-notifications': {
        'task': 'tasks.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
    },
}
```

### Running Celery Workers

```bash
# Start worker
celery -A app.tasks.celery_app worker --loglevel=info

# Start beat scheduler
celery -A app.tasks.celery_app beat --loglevel=info

# Start both
celery -A app.tasks.celery_app worker --beat --loglevel=info
```

### Task Monitoring

Use Flower to monitor tasks:

```bash
celery -A app.tasks.celery_app flower --port=5555
```

Access at http://localhost:5555

### Task Best Practices

1. **Make tasks idempotent** - safe to run multiple times
2. **Use proper error handling** - catch and log exceptions
3. **Set appropriate timeouts** - prevent hanging tasks
4. **Use retry logic** for external API calls
5. **Return structured results** - for monitoring and debugging
6. **Keep tasks focused** - one task, one responsibility

---

## Error Handling

### Custom Exceptions

Define custom exceptions in `app/core/exceptions.py`:

```python
from fastapi import HTTPException, status

class NotFoundException(HTTPException):
    """Resource not found"""
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class BadRequestException(HTTPException):
    """Bad request"""
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class UnauthorizedException(HTTPException):
    """Unauthorized access"""
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

class ForbiddenException(HTTPException):
    """Forbidden access"""
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class ConflictException(HTTPException):
    """Resource conflict"""
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)
```

### Using Custom Exceptions

```python
from app.core.exceptions import NotFoundException

async def get_user(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException(f"User {user_id} not found")
    return user
```

### Exception Handlers

Register exception handlers in `app/main.py`:

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import NotFoundException

app = FastAPI()

@app.exception_handler(NotFoundException)
async def not_found_exception_handler(request: Request, exc: NotFoundException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
```

### Logging Errors

Use the logging configuration in `app/core/logging.py`:

```python
import logging

logger = logging.getLogger(__name__)

try:
    result = await some_operation()
except Exception as e:
    logger.error(f"Operation failed: {str(e)}", exc_info=True)
    raise
```

---

## Security Best Practices

### Password Security

- Use bcrypt for password hashing
- Never store plain text passwords
- Enforce strong password requirements
- Use `passlib` library for password hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

### JWT Security

- Use strong secret keys
- Set appropriate token expiration
- Use HTTPS in production
- Implement token refresh mechanism

```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

### SQL Injection Prevention

- Use SQLAlchemy ORM (parameterized queries)
- Never concatenate user input into SQL queries
- Validate and sanitize all user input

```python
# Good - uses parameterized query
result = await db.execute(
    select(User).where(User.username == username)
)

# Bad - vulnerable to SQL injection
query = f"SELECT * FROM users WHERE username = '{username}'"
result = await db.execute(query)
```

### XSS Prevention

- Use Pydantic schemas for input validation
- Escape user-generated content
- Use Content Security Policy headers

### CORS Configuration

Configure CORS properly in `app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific domains only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```python
from app.core.rate_limiting import check_rate_limit

@router.post("/api/v1/auth/login")
async def login(
    credentials: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Check rate limit
    if not check_rate_limit(request, "login", max_requests=10, window_seconds=60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Proceed with login
    ...
```

### Input Validation

Always validate user input:

```python
from pydantic import BaseModel, Field, validator

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v
```

### Environment Variables

- Never commit `.env` files
- Use strong secrets in production
- Rotate secrets regularly
- Use different secrets for different environments

---

## Additional Resources

### Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

### Tools

- [Black](https://black.readthedocs.io/) - Code formatter
- [Ruff](https://docs.astral.sh/ruff/) - Linter
- [MyPy](https://mypy.readthedocs.io/) - Type checker
- [Pytest](https://docs.pytest.org/) - Testing framework

### External APIs

- [Jolpica F1 API](https://jolpica.f1jersey.com/docs) - F1 data source

---

## Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs -f app`
2. Review this documentation
3. Check existing GitHub issues
4. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs/error messages
   - Environment details (OS, Python version, etc.)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run all tests and CI checks
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.