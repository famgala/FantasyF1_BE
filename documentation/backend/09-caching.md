# Caching Strategy

This document describes the caching implementation for the Fantasy F1 Backend system using Redis.

---

## Caching Overview

Redis is used as a caching layer to improve performance and reduce database load.

### Cache Benefits

- **Improved Performance**: Faster response times for frequently accessed data
- **Reduced Database Load**: Fewer database queries
- **Scalability**: Better performance under high load
- **Flexibility**: Various data structures supported

---

## Cache Implementation

### Redis Client Setup

```python
# app/core/cache.py
from redis import asyncio as aioredis
from app.core.config import settings

class Cache:
    """Redis cache client."""
    
    def __init__(self):
        self.client = None
    
    async def init(self):
        """Initialize Redis client."""
        self.client = await aioredis.from_url(
            f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
            encoding="utf-8",
            decode_responses=True
        )
    
    async def close(self):
        """Close Redis connection."""
        if self.client:
            await self.client.close()
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        if not self.client:
            return None
        return await self.client.get(key)
    
    async def set(
        self,
        key: str,
        value: str,
        ttl: int = None
    ) -> bool:
        """Set value in cache with optional TTL."""
        if not self.client:
            return False
        return await self.client.set(key, value, ex=ttl)
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.client:
            return False
        return await self.client.delete(key)
    
    async def delete_pattern(self, pattern: str) -> int:
        """Delete keys matching pattern."""
        if not self.client:
            return 0
        keys = await self.client.keys(pattern)
        if keys:
            return await self.client.delete(*keys)
        return 0

# Global cache instance
cache = Cache()
```

---

## Cache Strategies

### 1. Leaderboard Caching

Leaderboards are cached for 4 hours. Cache is invalidated when score updates occur triggered by the result polling task.

```python
# app/services/caching_service.py
import json
from typing import Optional, List

class CachingService:
    """Service for caching frequently accessed data."""
    
    def __init__(self, cache_client):
        self.cache = cache_client
    
    async def get_leaderboard(
        self,
        league_id: int,
        race_id: int = None
    ) -> Optional[List[dict]]:
        """Get cached leaderboard."""
        key = self._leaderboard_key(league_id, race_id)
        cached = await self.cache.get(key)
        
        if cached:
            return json.loads(cached)
        
        return None
    
    async def set_leaderboard(
        self,
        league_id: int,
        race_id: int,
        leaderboard: List[dict],
        ttl: int = 14400  # 4 hours
    ) -> None:
        """Cache leaderboard."""
        key = self._leaderboard_key(league_id, race_id)
        value = json.dumps(leaderboard)
        await self.cache.set(key, value, ttl)
    
    def _leaderboard_key(self, league_id: int, race_id: int) -> str:
        """Generate leaderboard cache key."""
        if race_id:
            return f"leaderboard:{league_id}:{race_id}"
        return f"leaderboard:{league_id}:all"
    
    async def invalidate_leaderboard(
        self,
        league_id: int = None,
        race_id: int = None
    ) -> None:
        """Invalidate leaderboard cache."""
        if league_id:
            pattern = f"leaderboard:{league_id}:*"
        else:
            pattern = "leaderboard:*"
        
        await self.cache.delete_pattern(pattern)
```

### 2. Driver Rankings Caching

Driver rankings are cached for 4 hours. Cache is invalidated when race result updates occur triggered by the result polling task.

```python
# app/services/caching_service.py (continued)

    async def get_driver_rankings(self) -> Optional[List[dict]]:
        """Get cached driver rankings."""
        key = "driver_rankings"
        cached = await self.cache.get(key)
        
        if cached:
            return json.loads(cached)
        
        return None
    
    async def set_driver_rankings(
        self,
        rankings: List[dict],
        ttl: int = 14400  # 4 hours
    ) -> None:
        """Cache driver rankings."""
        key = "driver_rankings"
        value = json.dumps(rankings)
        await self.cache.set(key, value, ttl)
    
    async def invalidate_driver_rankings(self) -> None:
        """Invalidate driver rankings cache."""
        await self.cache.delete("driver_rankings")
```

### 3. Race Results Caching

Race results are cached for 4 hours. Cache is invalidated when result corrections occur triggered by the result polling task.

```python
# app/services/caching_service.py (continued)

    async def get_race_results(self, race_id: int) -> Optional[List[dict]]:
        """Get cached race results."""
        key = f"race_results:{race_id}"
        cached = await self.cache.get(key)
        
        if cached:
            return json.loads(cached)
        
        return None
    
    async def set_race_results(
        self,
        race_id: int,
        results: List[dict],
        ttl: int = 14400  # 4 hours
    ) -> None:
        """Cache race results."""
        key = f"race_results:{race_id}"
        value = json.dumps(results)
        await self.cache.set(key, value, ttl)
    
    async def invalidate_race_results(self, race_id: int) -> None:
        """Invalidate race results cache."""
        await self.cache.delete(f"race_results:{race_id}")
```

### 4. Rate Limiting

Used for API rate limiting with sorted sets.

```python
# app/services/caching_service.py (continued)

    async def check_rate_limit(
        self,
        identifier: str,
        limit: int,
        window: int
    ) -> bool:
        """Check if within rate limit."""
        key = f"rate_limit:{identifier}"
        now = int(time.time())
        
        # Add current request
        await self.cache.zadd(key, {str(now): now})
        
        # Remove old requests
        await self.cache.zremrangebyscore(key, 0, now - window)
        
        # Count in window
        count = await self.cache.zcard(key)
        
        if count > limit:
            return False
        
        # Set expiry
        await self.cache.expire(key, window)
        return True
```

---

## Cache Invalidation

### Scheduled Task Cache Invalidation Flow

The Fantasy F1 system uses a scheduled task to poll the Jolpica API for race results and automatically invalidate caches when data is updated. This flow ensures that the cache remains fresh when race data changes while allowing for longer TTL values during normal operation.

#### Race Result Polling Task

```python
# app/tasks/race_polling.py
from celery import shared_task
from app.services.jolpica_service import JolpicaService
from app.services.scoring_service import ScoringService
from app.services.caching_service import CachingService
from app.core.logging import logger

@shared_task(name="poll_race_results")
async def poll_race_results():
    """
    Scheduled task to poll Jolpica API for race results.
    Runs every 5 minutes after a race has started until results are finalized.
    
    This task:
    1. Fetches latest race results from Jolpica API
    2. Stores new results in the database
    3. Triggers driver point calculations
    4. Updates leaderboard scores for all leagues
    5. Invalidates all relevant cache layers
    """
    jolpica_service = JolpicaService()
    scoring_service = ScoringService(db)
    cache_service = CachingService(redis_client)
    
    try:
        # 1. Fetch race results from Jolpica API
        race_results = await jolpica_service.fetch_latest_race_results()
        
        if not race_results:
            logger.info("No new race results available")
            return
        
        # 2. Store race results in database
        await jolpica_service.store_race_results(race_results)
        race_id = race_results['race_id']
        
        # 3. Calculate driver points based on new results
        await scoring_service.calculate_driver_points(race_id)
        
        # 4. Update leaderboard scores for all leagues
        await scoring_service.update_all_league_leaderboards(race_id)
        
        # 5. Invalidate all cache layers (last step)
        await invalidate_all_caches(cache_service, race_id)
        
        logger.info(f"Successfully processed race results for race {race_id}")
        
    except Exception as e:
        logger.error(f"Error in race polling task: {str(e)}")
        raise


async def invalidate_all_caches(
    cache_service: CachingService,
    race_id: int
) -> None:
    """
    Invalidate all relevant cache layers after race data update.
    
    This is the last step in the polling task to ensure:
    - Database is fully updated before cache is cleared
    - Next API requests will pull fresh data from database
    - All caches are invalidated in proper order
    """
    # Invalidate race results cache for this race
    await cache_service.invalidate_race_results(race_id)
    
    # Invalidate driver rankings cache (global)
    await cache_service.invalidate_driver_rankings()
    
    # Invalidate all leaderboard caches
    # This includes both overall and race-specific leaderboards
    await cache_service.invalidate_leaderboard()
    
    # Optional: Log cache invalidation for monitoring
    logger.info(f"Caches invalidated for race {race_id}")
```

#### Cache Invalidation Order

The cache invalidation follows a specific order to ensure data consistency:

1. **Race Results Cache** - Cleared first as this is the source data
2. **Driver Rankings Cache** - Cleared second as it depends on race results
3. **Leaderboard Cache** - Cleared last as it depends on both race results and driver rankings

This ordering ensures that when the cache is repopulated:
- Race results are fetched first
- Driver rankings are calculated based on fresh results
- Leaderboards are computed based on fresh results and rankings

#### Cache Refresh Pattern

After the scheduled task invalidates all caches, the next API request will follow the cache-aside pattern:

```
User Request → Cache Miss → Database Query → Cache Population → Response
```

This ensures that:
- Users always see the most up-to-date data
- Cache is repopulated on-demand based on actual user traffic
- Database load is distributed across multiple request patterns

#### Benefits of This Approach

1. **Longer TTL Values**: Caches can live for 4 hours because they're only invalidated when data actually changes
2. **Automatic Freshness**: No manual cache clearing needed - the scheduled task handles it automatically
3. **Efficient Resource Usage**: Cache is only cleared when necessary (when race data is updated)
4. **Scalability**: System can handle high traffic with long cache times, but stays fresh via automatic updates

### Automatic Invalidation

```python
# app/services/caching_service.py (continued)

class CacheInvalidation:
    """Handles cache invalidation on data changes."""
    
    def __init__(self, caching_service):
        self.cache_service = caching_service
    
    async def on_race_results_updated(self, race_id: int) -> None:
        """Invalidate caches when race results are updated."""
        await self.cache_service.invalidate_race_results(race_id)
        await self.cache_service.invalidate_leaderboard(race_id=race_id)
    
    async def on_team_updated(self, team_id: int, league_id: int) -> None:
        """Invalidate caches when team is updated."""
        await self.cache_service.invalidate_leaderboard(league_id)
    
    async def on_race_completed(self, race_id: int) -> None:
        """Invalidate caches when race is completed."""
        await self.cache_service.invalidate_race_results(race_id)
        await self.cache_service.invalidate_leaderboard(race_id=race_id)
        await self.cache_service.invalidate_driver_rankings()
```

---

## Cache Keys Naming Convention

### Pattern: `resource:identifier:sub-identifier`

Examples:
- `leaderboard:1:all` - Overall leaderboard for league 1
- `leaderboard:1:5` - Leaderboard for league 1, race 5
- `driver_rankings` - Global driver rankings
- `race_results:10` - Results for race 10
- `rate_limit:user:123` - Rate limit for user 123

---

## Cache TTL Values

| Cache Type | TTL | Reason |
|------------|-----|--------|
| Leaderboard | 4 hours | Changes only when race data is updated via scheduled polling task |
| Driver Rankings | 4 hours | Changes only when race data is updated via scheduled polling task |
| Race Results | 4 hours | Changes only when result corrections occur via scheduled polling task |
| User Data | 30 minutes | Profile changes infrequently |
| League Data | 1 hour | League settings rarely change |

---

## Middleware Integration

### Cache-Aside Pattern

```python
# app/api/v1/endpoints/leaderboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.caching_service import CachingService
from app.services.scoring_service import ScoringService

router = APIRouter()

@router.get("/leagues/{league_id}/leaderboard")
async def get_leaderboard(
    league_id: int,
    race_id: int = None,
    db: AsyncSession = Depends(get_db),
    cache: CachingService = Depends(get_cache)
):
    """Get league leaderboard with caching."""
    # Try cache first
    cached = await cache.get_leaderboard(league_id, race_id)
    if cached:
        return {"leaderboard": cached, "cached": True}
    
    # Cache miss - compute from database
    scoring_service = ScoringService(db)
    leaderboard = await scoring_service.generate_leaderboard(league_id, race_id)
    
    # Store in cache
    await cache.set_leaderboard(league_id, race_id, leaderboard)
    
    return {"leaderboard": leaderboard, "cached": False}
```

---

## Monitoring

### Cache Hit Rate

```python
# app/services/caching_service.py (continued)

class CacheMetrics:
    """Track cache metrics."""
    
    def __init__(self):
        self.hits = 0
        self.misses = 0
    
    def record_hit(self):
        self.hits += 1
    
    def record_miss(self):
        self.misses += 1
    
    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

metrics = CacheMetrics()
```

---

## Best Practices

### 1. Cache Design

- Cache only expensive operations
- Set appropriate TTL values
- Use consistent key naming
- Implement cache invalidation

### 2. Performance

- Use connection pooling
- Monitor cache hit rates
- Optimize cache size
- Use pipelining for bulk operations

### 3. Reliability

- Handle cache failures gracefully
- Implement fallback to database
- Don't rely solely on cache
- Monitor cache health

---

## Related Documentation

- [Architecture](architecture.md) - Caching in system architecture
- [Performance](performance.md) - Performance optimization
- [Business Logic](business_logic.md) - Services that use caching