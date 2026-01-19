"""Common dependency factories for FastAPI endpoints"""

from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import oauth2_scheme, verify_token
from app.db.session import get_db
from app.models.user import User as UserModel
from app.schemas.user import UserResponse


async def get_current_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session (alias for get_db)"""
    async for session in get_db():
        yield session


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Get async database session"""
    async for session in get_db():
        yield session


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_async_db)
) -> UserResponse:
    """Get current authenticated user from JWT token.

    Args:
        token: JWT access token
        db: Database session

    Returns:
        User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    user_id = int(user_id_str)

    try:
        result = await db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()
    except Exception:
        raise credentials_exception from None

    if user is None:
        raise credentials_exception

    return UserResponse.model_validate(user)


async def get_current_active_user(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Get current active user.

    Args:
        current_user: Current authenticated user

    Returns:
        User object if active

    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return current_user


async def get_current_superuser(
    current_user: UserResponse = Depends(get_current_user),
) -> UserResponse:
    """Get current superuser.

    Args:
        current_user: Current authenticated user

    Returns:
        User object if superuser

    Raises:
        HTTPException: If user is not superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user
