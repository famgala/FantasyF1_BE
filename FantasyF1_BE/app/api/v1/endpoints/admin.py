"""Admin endpoints for administrative operations."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser, get_db
from app.models.user import User
from app.schemas.admin import AdminStatsResponse
from app.services.admin_service import get_admin_statistics

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse)
async def get_platform_statistics(
    _current_user: Annotated[User, Depends(get_current_superuser)],
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get comprehensive platform statistics for admin dashboard.

    Requires superuser privileges.

    Args:
        _current_user: Current authenticated superuser (unused but required for auth)
        db: Async database session

    Returns:
        Dictionary containing platform statistics including:
        - total_users: Total number of users
        - active_users_7d: Active users in last 7 days
        - total_leagues: Total number of leagues
        - active_leagues: Number of active leagues
        - completed_races: Number of completed races
        - upcoming_races: Number of upcoming races
        - registrations_by_day: User registrations per day for last 30 days
        - leagues_by_day: League creations per day for last 30 days
    """
    stats = await get_admin_statistics(db)
    return stats
