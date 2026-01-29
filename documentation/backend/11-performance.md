# Performance Optimization

This document describes performance optimization strategies and best practices for the Fantasy F1 Backend system.

---

## Performance Overview

Performance is critical for user experience and system scalability. Key areas:
- Database query optimization
- API response optimization
- Caching strategies
- Efficient data structures
- Resource management

---

## Database Optimization

### Query Optimization

#### Use Indexes Effectively

```python
# Create indexes for frequently queried fields
from sqlalchemy import Index

# Composite index for common queries
Index('idx_race_results_race_driver', RaceResult.race_id, RaceResult.driver_id, unique=True)

# Index for filtering
Index('idx_driver_status', Driver.status)

# Index for ordering
Index('idx_team_points', Team.total_points.desc())
```

#### Use Efficient Queries

```python
# BAD: N+1 query problem
teams = db.query(Team).all()
for team in teams:
    drivers = team.drivers  # Queries each time

# GOOD: Eager loading
teams = db.query(Team).options(
    selectinload(Team.team_drivers).selectinload(TeamDriver.driver)
).all()

# BETTER: join for read-only
result = db.query(Team, User, Driver).join(User).join(TeamDriver).join(Driver).all()
```

#### Select Only Needed Columns

```python
# BAD: Selects all columns
users = db.query(User).all()

# GOOD: Selects only needed columns
usernames = db.query(User.username, User.email).all()

# Use .with_entities() for specific columns
user_data = db.query(User).with_entities(User.id, User.username).all()
```

#### Use Pagination

```python
# BAD: Loads all records
all_drivers = db.query(Driver).all()

# GOOD: Uses pagination
page = 1
per_page = 50
drivers = db.query(Driver).offset((page - 1) * per_page).limit(per_page).all()
```

### Connection Pooling

```python
# app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,          # Number of connections in pool
    max_overflow=20,       # Max additional connections
    pool_pre_ping=True,    # Test connections before use
    pool_recycle=3600,     # Recycle connections after 1 hour
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)
```

---

## API Optimization

### Response Compression

```python
# app/main.py
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,  # Only compress responses > 1KB
)
```

### JSON Serialization Optimization

```python
# Use orjson for faster JSON serialization
import orjson
from fastapi.responses import JSONResponse

class ORJSONResponse(JSONResponse):
    media_type = "application/json"
    
    def render(self, content: Any) -> bytes:
        return orjson.dumps(content)

# Use in route
@router.get("/teams", response_class=ORJSONResponse)
async def get_teams():
    return {"teams": teams}
```

### Pagination

```python
# app/core/pagination.py
from typing import Generic, TypeVar, List

T = TypeVar('T')

class PaginatedResponse(Generic[T]):
    """Paginated response wrapper."""
    
    def __init__(
        self,
        items: List[T],
        total: int,
        page: int,
        page_size: int
    ):
        self.items = items
        self.total = total
        self.page = page
        self.page_size = page_size
        self.total_pages = (total + page_size - 1) // page_size
        self.has_next = page < self.total_pages
        self.has_prev = page > 1
    
    def to_dict(self) -> dict:
        return {
            "items": self.items,
            "pagination": {
                "total": self.total,
                "page": self.page,
                "page_size": self.page_size,
                "total_pages": self.total_pages,
                "has_next": self.has_next,
                "has_prev": self.has_prev
            }
        }

# Usage in endpoint
@router.get("/teams")
async def get_teams(
    page: int = 1,
    page_size: int = 50,
    db: AsyncSession = Depends(get_db)
):
    offset = (page - 1) * page_size
    
    query = db.query(Team)
    
    # Get total count
    total = query.count()
    
    # Get paginated items
    items = query.offset(offset).limit(page_size).all()
    
    return PaginatedResponse(items, total, page, page_size).to_dict()
```

### Async Operations

```python
# Use async for I/O operations
@router.get("/leagues/{league_id}/leaderboard")
async def get_leaderboard(league_id: int, db: AsyncSession = Depends(get_db)):
    # Async database query
    result = await db.execute(select(Team).where(Team.league_id == league_id))
    teams = result.scalars().all()
    
    # Cache lookup (async)
    cached = await cache.get(f"leaderboard:{league_id}")
    
    if cached:
        return cached
    
    # Generate leaderboard
    leaderboard = generate_leaderboard(teams)
    
    # Cache store (async)
    await cache.set(f"leaderboard:{league_id}", leaderboard, ttl=300)
    
    return leaderboard
```

---

## Caching Optimization

### Multi-Level Caching

```python
# First level: In-memory cache
from functools import lru_cache

@lru_cache(maxsize=100)
def get_driver_price(driver_id: int) -> float:
    """Get driver price from in-memory cache."""
    # Lookup logic
    return price

# Second level: Redis cache
async def get_leaderboard_cached(league_id: int):
    """Get leaderboard with L2 caching."""
    # Try Redis first
    cached = await redis_cache.get(f"leaderboard:{league_id}")
    if cached:
        return cached
    
    # Compute and cache
    leaderboard = compute_leaderboard(league_id)
    await redis_cache.set(f"leaderboard:{league_id}", leaderboard, ttl=300)
    
    return leaderboard
```

### Cache Warming

```python
# Cache frequently accessed data on startup
async def warm_cache():
    """Warm up cache with frequently accessed data."""
    # Cache driver rankings
    rankings = db.query(Driver).order_by(Driver.total_points.desc()).all()
    await cache.set("driver_rankings", rankings, ttl=600)
    
    # Cache top leagues
    leagues = db.query(League).limit(20).all()
    for league in leagues:
        leaderboard = generate_leaderboard(league.id)
        await cache.set(f"leaderboard:{league.id}", leaderboard, ttl=300)
```

---

## Memory Optimization

### Use Generators for Large Datasets

```python
# BAD: Loads all into memory
def process_all_teams():
    teams = db.query(Team).all()
    for team in teams:
        yield process_team(team)

# GOOD: Uses generator (lazy loading)
def process_all_teams():
    query = db.query(Team).yield_per(100)
    for team in query:
        yield process_team(team)
```

### Limit Resource Usage

```python
# Limit query results
@router.get("/drivers")
async def get_drivers(limit: int = 50):
    """Limit results to prevent memory issues."""
    if limit > 100:  # Enforce maximum
        limit = 100
    
    drivers = db.query(Driver).limit(limit).all()
    return drivers
```

### Use Efficient Data Structures

```python
# Use sets/dicts for O(1) lookups
driver_ids_set = {driver.id for driver in drivers}

# BAD: O(n) lookups
if driver_id in [d.id for d in drivers]:
    pass

# GOOD: O(1) lookups
if driver_id in driver_ids_set:
    pass
```

---

## Concurrency

### Async/Await Pattern

```python
# Run multiple operations concurrently
@router.get("/teams/{team_id}")
async def get_team(team_id: int, db: AsyncSession = Depends(get_db)):
    # Run queries concurrently
    team_task = asyncio.create_task(db.get(Team, team_id))
    leagues_task = asyncio.create_task(db.execute(select(League)))
    
    team = await team_task
    leagues = await leagues_task
    
    return {"team": team, "leagues": leagues}
```

### Worker Concurrency

```python
# celery config
celery_worker_concurrency = 4  # Number of worker processes

# Per worker
worker_prefetch_multiplier = 2  # Tasks per worker
worker_max_tasks_per_child = 1000  # Recycle worker after N tasks
```

---

## Monitoring and Profiling

### Response Time Tracking

```python
# Track API response times
import time
from functools import wraps

def track_time(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        duration = time.time() - start
        
        logger.info(f"{func.__name__} took {duration:.2f}s")
        
        if duration > 1.0:  # Log slow requests
            logger.warning(f"SLOW REQUEST: {func.__name__} took {duration:.2f}s")
        
        return result
    return wrapper

# Use in routes
@router.get("/leagues/{league_id}/leaderboard")
@track_time
async def get_leaderboard(league_id: int):
    # ... implementation
    pass
```

### Database Query Profiling

```python
# Enable query logging
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Profile specific queries
@router.get("/teams")
async def get_teams(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import event
    from sqlalchemy.engine import Engine
    
    @event.listens_for(Engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        context._query_start_time = time.time()
    
    @event.listens_for(Engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        total = time.time() - context._query_start_time
        logger.info(f"Query: {statement[:50]}... took {total:.3f}s")
    
    # ... query implementation
```

---

## Best Practices

### 1. Database

- Use indexes on frequently queried fields
- Avoid N+1 query problems with eager loading
- Use pagination for large datasets
- Select only needed columns
- Use connection pooling

### 2. API

- Implement response compression
- Use async/await for I/O operations
- Implement pagination
- Use efficient data serialization
- Rate limit expensive operations

### 3. Caching

- Cache expensive operations
- Use appropriate TTL values
- Implement cache invalidation
- Use multi-level caching
- Warm cache on startup

### 4. Code

- Use generators for large datasets
- Optimize algorithms and data structures
- Profile before optimizing
- Measure performance improvements
- Set performance targets

---

## Related Documentation

- [Architecture](architecture.md) - System architecture
- [Caching](caching.md) - Caching strategies
- [Database Models](data_models.md) - Database schema
- [API Endpoints](api_endpoints.md) - API design