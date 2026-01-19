"""Common dependencies for API endpoints."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.db.session import get_db
from app.models.user import User
from app.services.user_service import UserService

__all__ = ["get_current_user", "get_db"]


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)], token: str | None = None
) -> User | None:
    """Get current user from JWT token."""
    if not token:
        return None

    payload = verify_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = await UserService.get_user_by_id(db, int(user_id))
    return user


async def get_current_active_user(
    current_user: Annotated[User | None, Depends(get_current_user)],
) -> User:
    """Get current active user."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return current_user
