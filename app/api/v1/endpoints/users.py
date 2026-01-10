"""User endpoints for managing user profiles."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_current_superuser
from app.db.session import get_db
from app.schemas.user import User, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=User)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Get current user's profile.

    Args:
        current_user: Authenticated user

    Returns:
        Current user's profile
    """
    return current_user


@router.put("/me", response_model=User)
async def update_current_user_profile(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Update current user's profile.

    Args:
        user_data: Update data
        db: Database session
        current_user: Authenticated user

    Returns:
        Updated user profile

    Raises:
        HTTPException: If update fails
    """
    try:
        user = await UserService.update_user(db, current_user.id, user_data)
        return User.model_validate(user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from None


@router.get("/{user_id}", response_model=User)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_superuser),
) -> User:
    """Get user by ID (superuser only).

    Args:
        user_id: User ID
        db: Database session
        _current_user: Authenticated superuser for authorization check

    Returns:
        User profile

    Raises:
        HTTPException: If user not found or not authorized
    """
    try:
        user = await UserService.get_user_by_id(db, user_id)
        return User.model_validate(user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from None
