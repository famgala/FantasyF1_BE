"""Cache utility functions"""

import json
import logging
from typing import Any

from redis import asyncio as aioredis
from redis.exceptions import RedisError

from app.cache.client import redis_client
from app.core.config import settings

logger = logging.getLogger(__name__)


async def get_cache(key: str) -> str | None:
    """Get value from cache"""
    try:
        if redis_client:
            return await redis_client.get(key)
    except RedisError as e:
        logger.error(f"Error getting from cache: {e}")
    return None


async def set_cache(
    key: str,
    value: str | bytes,
    ttl: int | None = None,
) -> bool:
    """Set value in cache with optional TTL"""
    try:
        if redis_client:
            if ttl is None:
                await redis_client.set(key, value)
            else:
                await redis_client.setex(key, ttl, value)
            return True
    except RedisError as e:
        logger.error(f"Error setting cache: {e}")
    return False


async def delete_cache(key: str) -> bool:
    """Delete value from cache"""
    try:
        if redis_client:
            await redis_client.delete(key)
            return True
    except RedisError as e:
        logger.error(f"Error deleting from cache: {e}")
    return False


async def get_json(key: str) -> Any | None:
    """Get JSON-serialized value from cache"""
    cached = await get_cache(key)
    if cached:
        try:
            return json.loads(cached)
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding cached JSON: {e}")
    return None


async def set_json(
    key: str,
    value: Any,
    ttl: int | None = None,
) -> bool:
    """Set JSON-serialized value in cache with optional TTL"""
    try:
        serialized = json.dumps(value)
        return await set_cache(key, serialized, ttl)
    except (TypeError, ValueError) as e:
        logger.error(f"Error encoding value to JSON: {e}")
        return False


async def set_json_short(key: str, value: Any) -> bool:
    """Set JSON value with short TTL"""
    return await set_json(key, value, settings.CACHE_TTL_SHORT)


async def set_json_medium(key: str, value: Any) -> bool:
    """Set JSON value with medium TTL"""
    return await set_json(key, value, settings.CACHE_TTL_MEDIUM)


async def set_json_long(key: str, value: Any) -> bool:
    """Set JSON value with long TTL"""
    return await set_json(key, value, settings.CACHE_TTL_LONG)


async def invalidate_pattern(pattern: str) -> int:
    """Delete all keys matching a pattern"""
    try:
        if redis_client:
            keys = []
            async for key in redis_client.scan_iter(match=pattern):
                keys.append(key)
            if keys:
                await redis_client.delete(*keys)
                return len(keys)
    except RedisError as e:
        logger.error(f"Error invalidating cache pattern: {e}")
    return 0
