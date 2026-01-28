"""Redis client factory and management"""

from redis import asyncio as aioredis
from redis.backoff import ExponentialBackoff
from redis.exceptions import RedisError
from redis.retry import Retry

from app.core.config import settings

# Create retry policy
retry_policy = Retry(ExponentialBackoff(), retries=3)


async def get_redis_client() -> aioredis.Redis:
    """Get Redis client instance"""
    return aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        retry=retry_policy,
        max_connections=settings.REDIS_MAX_CONNECTIONS,
        socket_timeout=5,
        socket_connect_timeout=5,
    )


# Global Redis client instance (will be initialized on startup)
redis_client: aioredis.Redis | None = None


async def init_redis() -> None:
    """Initialize Redis connection"""
    global redis_client
    redis_client = await get_redis_client()


async def close_redis() -> None:
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()


async def ping_redis() -> bool:
    """Check if Redis is connected and responsive"""
    try:
        if redis_client:
            await redis_client.ping()
            return True
        return False
    except RedisError:
        return False
