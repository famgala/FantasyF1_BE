"""User endpoints for managing user profiles."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user, get_current_superuser
from app.db.session import get_db
from app.schemas.user import (
    UserPreferencesResponse,
    UserPreferencesUpdate,
    UserResponse,
    UserSearchResponse,
    UserUpdate,
)
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: UserResponse = Depends(get_current_active_user),
) -> UserResponse:
    """Get current user's profile.

    Args:
        current_user: Authenticated user

    Returns:
        Current user's profile
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user),
) -> UserResponse:
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
        return UserResponse.model_validate(user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from None


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: UserResponse = Depends(get_current_superuser),
) -> UserResponse:
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
        return UserResponse.model_validate(user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from None


@router.get("/search/", response_model=list[UserSearchResponse])
async def search_users(
    q: str = Query(..., min_length=2, description="Search query for username or email"),
    skip: int = Query(0, ge=0, description="Number of results to skip"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results to return"),
    db: AsyncSession = Depends(get_db),
    _current_user: UserResponse = Depends(get_current_active_user),
) -> list[UserSearchResponse]:
    """Search users by username or email.

    Args:
        q: Search query string (minimum 2 characters)
        skip: Number of results to skip
        limit: Maximum number of results to return (max 50)
        db: Database session
        _current_user: Authenticated user for authorization check

    Returns:
        List of matching users

    Raises:
        HTTPException: If search fails
    """
    try:
        users = await UserService.search_users(db, q, skip=skip, limit=limit)
        return [UserSearchResponse.model_validate(user) for user in users]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from None


@router.get("/me/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user),
) -> UserPreferencesResponse:
    """Get current user's preferences.

    Args:
        db: Database session
        current_user: Authenticated user

    Returns:
        User's preferences
    """
    try:
        user = await UserService.get_user_by_id(db, current_user.id)
        return UserPreferencesResponse.model_validate(user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from None


@router.put("/me/preferences", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences: UserPreferencesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_active_user),
) -> UserPreferencesResponse:
    """Update current user's preferences.

    Args:
        preferences: Preferences update data
        db: Database session
        current_user: Authenticated user

    Returns:
        Updated user preferences

    Raises:
        HTTPException: If update fails
    """
    try:
        user = await UserService.update_user_preferences(db, current_user.id, preferences)
        return UserPreferencesResponse.model_validate(user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from None
