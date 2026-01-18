# Technology Stack

This document describes the technology stack used in the Fantasy F1 Backend MVP, including version information, rationale for technology choices, and dependency specifications.

---

## Core Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Web Framework** | FastAPI | 0.109.0 | High-performance async API framework |
| **ASGI Server** | Uvicorn | 0.27.0 | ASGI server for FastAPI |
| **Database** | PostgreSQL | 15 | Relational database |
| **ORM** | SQLAlchemy | 2.0.25 | Python SQL toolkit and ORM |
| **Migrations** | Alembic | 1.13.1 | Database migration tool |
| **Async Driver** | asyncpg | 0.29.0 | Async PostgreSQL driver |
| **Cache** | Redis | 7.0 | Caching and session storage |
| **Task Queue** | Celery | 5.3.6 | Background task processing |
| **Authentication** | JWT (python-jose) | 3.3.0 | Token-based authentication |
| **Password Hashing** | passlib | 1.7.4 | Secure password hashing |
| **Validation** | Pydantic | 2.5.3 | Data validation using Python type annotations |
| **HTTP Client** | httpx | 0.25.2 | Async HTTP client for external API calls |
| **Testing** | pytest | 7.4.3 | Testing framework |
| **Code Quality** | black, flake8, mypy | Latest | Code formatting and linting |

---

## Technology Rationale

### Why FastAPI?

**Performance**
- Built on Starlette and Pydantic, one of the fastest Python frameworks
- Native async/await support for high concurrency
- Minimal overhead compared to other frameworks

**Type Safety**
- Full support for Python type hints
- Automatic data validation with Pydantic
- Better IDE support with autocomplete

**Modern Features**
- Automatic OpenAPI/Swagger UI documentation
- ReDoc documentation automatically generated
- Dependency injection system
- Background task support

**Asynchronous**
- Non-blocking I/O operations
- Better performance under load
- Scalable for many concurrent connections

**Example Benefits:**
```python
# FastAPI automatically validates and documents this endpoint
@router.post("/teams/", response_model=TeamResponse)
async def create_team(
    team: TeamCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    return await team_service.create_team(db, team, current_user.id)
```

### Why PostgreSQL?

**ACID Compliance**
- Ensures data integrity with transactions
- Reliable for financial/scoring data
- Prevents data corruption

**Complex Queries**
- Support for advanced SQL features
- Joins, subqueries, CTEs
- Window functions for analytics

**JSON Support**
- Native JSONB type for flexible data
- Query inside JSON documents
- Indexing on JSON fields

**Performance**
- Excellent for read-heavy workloads
- Proper indexing strategies
- Query optimization

**Maturity**
- Proven reliability in production
- Extensive tooling and monitoring
- Strong community support

**Example Usage:**
```python
# Complex query with joins and aggregations
result = await db.execute(
    select(Team, func.sum(RaceResult.points_earned).label("total_points"))
    .join(TeamDriver, Team.id == TeamDriver.team_id)
    .join(RaceResult, TeamDriver.driver_id == RaceResult.driver_id)
    .join(Race, RaceResult.race_id == Race.id)
    .where(Team.league_id == league_id)
    .where(Race.race_date >= start_date)
    .group_by(Team.id)
    .order_by(func.sum(RaceResult.points_earned).desc())
)
```

### Why Redis?

**Speed**
- In-memory storage for fast access
- Microsecond response times
- Ideal for caching and sessions

**Versatility**
- Supports strings, lists, sets, sorted sets, hashes
- Pub/Sub messaging for notifications
- TTL support for automatic expiration

**Persistence**
- Optional disk persistence
- RDB and AOF persistence options
- Suitable for temporary data

**Celery Backend**
- Perfect for Celery task queues
- Task result storage
- Task retries and tracking

**Example Usage:**
```python
# Caching leaderboard with 5-minute TTL
await cache.set(
    f"leaderboard:{league_id}",
    leaderboard_data,
    ttl=300
)

# Rate limiting with sorted sets
await client.zadd(f"rate_limit:{user_id}", {str(now): now})
await client.expire(f"rate_limit:{user_id}", 60)
```

### Why Celery?

**Distributed**
- Supports multiple worker nodes
- Horizontal scaling capability
- Task routing to different queues

**Reliable**
- Built-in task retries with exponential backoff
- Result storage and tracking
- Error handling and logging

**Scheduling**
- Celery Beat for periodic tasks
- Cron-like scheduling
- ETA (scheduled) tasks

**Monitoring**
- Flower UI for task monitoring
- Real-time task tracking
- Performance metrics

**Example Tasks:**
```python
@shared_task(bind=True, max_retries=3)
def poll_race_results(self, race_id: int):
    """Poll for race results with retries."""
    # Will automatically retry on failure
    # Can be scheduled for specific times
    pass

@shared_task
def update_all_team_scores(race_id: int = None):
    """Update all team scores."""
    # Can run in parallel on multiple workers
    pass
```

---

## Dependencies

### Production Dependencies

**requirements.txt**
```txt
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.25
asyncpg==0.29.0
alembic==1.13.1

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Cache & Task Queue
redis==5.0.1
celery==5.3.6
flower==2.0.1

# HTTP Client
httpx==0.25.2

# Async Support
anyio==3.7.1

# Environment Variables
python-dotenv==1.0.0

# Validation
email-validator==2.1.0
```

### Development Dependencies

**requirements-dev.txt**
```txt
# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx==0.25.2

# Code Quality
black==23.12.1
flake8==7.0.0
mypy==1.8.0
isort==5.13.2

# Documentation
mkdocs==1.5.3
mkdocs-material==9.5.3

# Development Tools
ipython==8.19.0
ptpython==3.0.26
```

---

## Python Version

**Required**: Python 3.9+

**Recommended**: Python 3.10 or 3.11

**Rationale**:
- Async/await support (Python 3.5+)
- Type hint improvements (Python 3.9+)
- Performance improvements in newer versions
- Better async context manager support

---

## Database Versions

### PostgreSQL

**Version**: 15.x

**Required Features**:
- JSONB support
- Window functions
- CTE (Common Table Expressions)
- Proper indexing strategies

**Configuration**:
```sql
-- Recommended settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

### Redis

**Version**: 7.0+

**Required Features**:
- Sorted sets
- Pub/Sub
- TTL support
- Persistent configuration

**Configuration**:
```conf
# Recommended settings
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

---

## Deployment Environment

### Production Requirements

**Minimum**:
- 2 CPU cores
- 4 GB RAM
- 20 GB disk space

**Recommended**:
- 4 CPU cores
- 8 GB RAM
- 50 GB disk space

**Software**:
- Linux (Ubuntu 22.04 LTS or similar)
- Docker & Docker Compose (optional)
- Nginx for reverse proxy (optional)
- Supervisor for process management (optional)

### Development Environment

**Requirements**:
- Python 3.9+
- PostgreSQL 15
- Redis 7.0
- Git

**Optional but Recommended**:
- Docker & Docker Compose
- VS Code with Python extension
- Postman or similar API testing tool

---

## Version Management

### Semantic Versioning

The project follows semantic versioning (SemVer):
- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality
- **PATCH**: Backwards-compatible bug fixes

### Dependency Updates

**Security Updates**: Immediate updates for security vulnerabilities
**Major Updates**: Plan for breaking changes and migrations
**Minor Updates**: Test thoroughly before deploying

### Lock Files

**requirements.lock**: Exact versions for reproducible builds
**poetry.lock**: If using Poetry for dependency management

---

## Technology Alternatives Considered

### Web Framework
- **Django REST Framework**: Too heavy, too much boilerplate
- **Flask**: Requires more setup, less features out of the box
- **Chosen**: FastAPI - Best balance of features and performance

### Database
- **MySQL**: Similar features, but PostgreSQL has better JSON support
- **MongoDB**: Good for flexible schemas, but lacks ACID guarantees
- **Chosen**: PostgreSQL - Best for relational data with integrity requirements

### Task Queue
- **RQ**: Simpler, but less features
- **Kombu**: Good, but Celery is more mature
- **Chosen**: Celery - Most features, best monitoring support

### Cache
- **Memcached**: Simpler, but fewer data types
- **Chosen**: Redis - More features, better persistence options

---

## Related Documentation

- [Architecture Overview](architecture.md) - System architecture and design
- [Data Models](data_models.md) - Database schema implementation
- [Security](security.md) - Security best practices
- [Deployment Roadmap](roadmap.md) - Implementation and deployment phases