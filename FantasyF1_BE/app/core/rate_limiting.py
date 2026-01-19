"""Rate limiting using slowapi with Redis backend."""

from collections.abc import Callable
from functools import wraps

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)


def get_user_id_from_request(request: Request) -> str:
    """Get user ID from request for rate limiting."""
    try:
        user = getattr(request.state, "user", None)
        if user and user.id:
            return f"user:{user.id}"
    except Exception:
        pass
    return get_remote_address(request)


def rate_limit(limit: str) -> Callable:  # noqa: ARG001
    """Rate limiting decorator.

    Args:
        limit: Rate limit string (e.g., "100/hour", "10/minute").
               Reserved for future implementation.

    Note:
        This is a placeholder implementation. Actual rate limiting logic
        will be implemented in a future phase using Redis backend with slowapi.
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)

        return wrapper

    return decorator
