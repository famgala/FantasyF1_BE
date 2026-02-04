"""Activity Log API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.activity_log import ActivityType
from app.models.user import User
from app.schemas.activity_log import (
    ActivityLogListResponse,
    ActivityLogResponse,
)
from app.services.activity_log_service import ActivityLogService
from app.services.fantasy_team_service import FantasyTeamService
from app.services.league_service import LeagueService

router = APIRouter()


@router.get("/leagues/{league_id}/activities", response_model=ActivityLogListResponse)
async def get_league_activities(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    activity_type: ActivityType
    | None = Query(
        None,
        description="Filter by activity type",
    ),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> ActivityLogListResponse:
    """Get activity feed for a league.

    Returns a chronological list of activities that have occurred in the league,
    including member joins, team creations, draft picks, and more.

    Only league members can view the activity feed.

    Args:
        league_id: League ID
        db: Database session
        current_user: Current authenticated user
        activity_type: Optional filter by activity type
        skip: Number of activities to skip (pagination)
        limit: Maximum number of activities to return

    Returns:
        Paginated list of activities

    Raises:
        HTTPException: If league not found or user is not a member
    """
    from app.core.exceptions import NotFoundError

    # Verify league exists
    try:
        _ = await LeagueService.get(db, league_id)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="League not found",
        ) from e

    # Check if user is a member of the league
    user_teams = await FantasyTeamService.get_user_teams(
        session=db,
        user_id=current_user.id,
        league_id=league_id,
    )

    if not user_teams and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a league member to view the activity feed",
        )

    # Get activities
    activity_type_str = activity_type.value if activity_type else None
    activities, total = await ActivityLogService.get_league_activities(
        db=db,
        league_id=league_id,
        skip=skip,
        limit=limit,
        activity_type=activity_type_str,
    )

    return ActivityLogListResponse(
        activities=[ActivityLogResponse.model_validate(a) for a in activities],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/leagues/{league_id}/activities/{activity_id}",
    response_model=ActivityLogResponse,
)
async def get_activity_detail(
    league_id: int,
    activity_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ActivityLogResponse:
    """Get details of a specific activity.

    Only league members can view activity details.

    Args:
        league_id: League ID
        activity_id: Activity ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Activity details

    Raises:
        HTTPException: If activity not found or user is not a member
    """
    from app.core.exceptions import NotFoundError

    # Verify league exists
    try:
        await LeagueService.get(db, league_id)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="League not found",
        ) from e

    # Check if user is a member of the league
    user_teams = await FantasyTeamService.get_user_teams(
        session=db,
        user_id=current_user.id,
        league_id=league_id,
    )

    if not user_teams and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a league member to view activities",
        )

    # Get activity
    activity = await ActivityLogService.get_activity(db, activity_id, league_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )

    return ActivityLogResponse.model_validate(activity)
