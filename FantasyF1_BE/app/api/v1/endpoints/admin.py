"""Admin endpoints for platform management and statistics."""

from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser, get_db
from app.models.error_log import ErrorLog as ErrorLogModel
from app.models.fantasy_team import FantasyTeam
from app.models.user import User
from app.schemas.admin import (
    AdminLeagueBase,
    AdminLeagueListResponse,
    AdminLeagueUpdate,
    AdminUserBase,
    AdminUserListResponse,
    AdminUserUpdate,
    BroadcastNotificationRequest,
    BroadcastNotificationResponse,
    ErrorLog,
    ErrorLogListResponse,
    PlatformStats,
    SystemHealth,
)
from app.services.admin_service import AdminService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=PlatformStats, status_code=status.HTTP_200_OK)
async def get_platform_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[dict, Depends(get_current_superuser)],
) -> PlatformStats:
    """Get platform statistics.

    Requires superuser (admin) privileges.

    Returns comprehensive platform statistics including:
    - Total and active users
    - Total and active leagues
    - Completed and upcoming races
    - Daily registration and league creation data for last 30 days
    """
    return await AdminService.get_platform_stats(db)


@router.get("/users", response_model=AdminUserListResponse, status_code=status.HTTP_200_OK)
async def get_all_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[dict, Depends(get_current_superuser)],
    search: str | None = Query(None, description="Search by username or email"),
    role: Literal["user", "admin"] | None = Query(None, description="Filter by role"),
    status_param: Literal["active", "inactive"]
    | None = Query(None, alias="status", description="Filter by active status"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
) -> AdminUserListResponse:
    """Get all users with optional filtering.

    Requires superuser (admin) privileges.

    Args:
        search: Search term for username or email
        role: Filter by user role
        status_param: Filter by active status
        limit: Maximum number of results
        offset: Number of results to skip

    Returns:
        Paginated list of users with total count
    """
    users = await AdminService.get_all_users(
        db=db,
        search=search,
        role=role,
        status=status_param,
        limit=limit,
        offset=offset,
    )

    total = await AdminService.get_users_count(
        db=db,
        search=search,
        role=role,
        status=status_param,
    )

    return AdminUserListResponse(users=users, total=total)


@router.put(
    "/users/{user_id}",
    response_model=AdminUserBase,
    status_code=status.HTTP_200_OK,
)
async def update_user(
    user_id: int,
    user_update: AdminUserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[dict, Depends(get_current_superuser)],
) -> AdminUserBase:
    """Update user status and/or role.

    Requires superuser (admin) privileges.

    Args:
        user_id: ID of user to update
        user_update: Update data

    Returns:
        Updated user information
    """
    updated_user = await AdminService.update_user(
        db=db,
        user_id=user_id,
        is_active=user_update.is_active,
        role=user_update.role,
    )

    # Count teams for this user
    team_count_result = await db.execute(
        select(func.count()).select_from(FantasyTeam).where(FantasyTeam.user_id == user_id)
    )
    teams_count = team_count_result.scalar() or 0

    return AdminUserBase(
        id=updated_user.id,
        username=updated_user.username,
        email=updated_user.email,
        full_name=updated_user.full_name,
        role="admin" if updated_user.is_superuser else "user",
        is_active=updated_user.is_active,
        created_at=updated_user.created_at,
        teams_count=teams_count,
    )


@router.get(
    "/leagues",
    response_model=AdminLeagueListResponse,
    status_code=status.HTTP_200_OK,
)
async def get_all_leagues(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[dict, Depends(get_current_superuser)],
    search: str | None = Query(None, description="Search by league name or code"),
    privacy: Literal["public", "private"] | None = Query(None, description="Filter by privacy"),
    status_param: Literal["drafting", "active", "completed", "cancelled"]
    | None = Query(None, alias="status", description="Filter by league status"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
) -> AdminLeagueListResponse:
    """Get all leagues with optional filtering.

    Requires superuser (admin) privileges.

    Args:
        search: Search term for league name or code
        privacy: Filter by privacy status
        status_param: Filter by league status
        limit: Maximum number of results
        offset: Number of results to skip

    Returns:
        Paginated list of leagues with total count
    """
    leagues = await AdminService.get_all_leagues(
        db=db,
        search=search,
        privacy=privacy,
        _status=status_param,
        limit=limit,
        offset=offset,
    )

    total = await AdminService.get_leagues_count(
        db=db,
        search=search,
        privacy=privacy,
        _status=status_param,
    )

    return AdminLeagueListResponse(leagues=leagues, total=total)


@router.put(
    "/leagues/{league_id}",
    response_model=AdminLeagueBase,
    status_code=status.HTTP_200_OK,
)
async def update_league(
    league_id: int,
    league_update: AdminLeagueUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[dict, Depends(get_current_superuser)],
) -> AdminLeagueBase:
    """Update league status.

    Requires superuser (admin) privileges.

    Args:
        league_id: ID of league to update
        league_update: Update data

    Returns:
        Updated league information
    """
    updated_league = await AdminService.update_league(
        db=db,
        league_id=league_id,
        _status=league_update.status,
    )

    # Get league data for response
    # Count teams for this league
    team_count_result = await db.execute(
        select(func.count()).select_from(FantasyTeam).where(FantasyTeam.league_id == league_id)
    )
    teams_count = team_count_result.scalar() or 0

    # Get creator username
    if updated_league.creator_id:
        manager_result = await db.execute(
            select(User.username).where(User.id == updated_league.creator_id)
        )
        manager_username = manager_result.scalar() or "Unknown"
    else:
        manager_username = "System"

    # Determine league status
    if teams_count == 0:
        determined_status: Literal["drafting", "active", "completed", "cancelled"] = "drafting"
    elif updated_league.draft_date and updated_league.draft_date < datetime.utcnow():
        determined_status = "active"
    else:
        determined_status = "active"

    return AdminLeagueBase(
        id=updated_league.id,
        name=updated_league.name,
        code=updated_league.code,
        manager_id=updated_league.creator_id or 0,
        manager_username=manager_username,
        is_private=updated_league.is_private,
        status=determined_status,
        teams_count=teams_count,
        max_teams=updated_league.max_teams,
        created_at=updated_league.created_at,
    )


@router.delete(
    "/leagues/{league_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_league(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[dict, Depends(get_current_superuser)],
) -> None:
    """Delete a league.

    Requires superuser (admin) privileges.

    Args:
        league_id: ID of league to delete
    """
    await AdminService.delete_league(db=db, league_id=league_id)


@router.get(
    "/logs",
    response_model=ErrorLogListResponse,
    status_code=status.HTTP_200_OK,
)
async def get_error_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[dict, Depends(get_current_superuser)],
    level: Literal["debug", "info", "warning", "error", "critical"]
    | None = Query(None, description="Filter by log level"),
    module: str | None = Query(None, description="Filter by module name"),
    endpoint: str | None = Query(None, description="Filter by endpoint"),
    user_id: int | None = Query(None, description="Filter by user ID"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
) -> ErrorLogListResponse:
    """Get error logs with optional filtering.

    Requires superuser (admin) privileges.

    Args:
        level: Filter by log level
        module: Filter by module name
        endpoint: Filter by endpoint
        user_id: Filter by user ID
        limit: Maximum number of results
        offset: Number of results to skip

    Returns:
        Paginated list of error logs with total count
    """
    query = select(ErrorLogModel)

    # Apply filters
    if level is not None:
        query = query.where(ErrorLogModel.level == level)
    if module is not None:
        query = query.where(ErrorLogModel.module == module)
    if endpoint is not None:
        query = query.where(ErrorLogModel.endpoint == endpoint)
    if user_id is not None:
        query = query.where(ErrorLogModel.user_id == user_id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated results
    query = query.order_by(ErrorLogModel.timestamp.desc())
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    logs = result.scalars().all()

    return ErrorLogListResponse(
        logs=[ErrorLog.model_validate(log) for log in logs],
        total=total,
    )


@router.get("/health", response_model=SystemHealth, status_code=status.HTTP_200_OK)
async def get_system_health(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[dict, Depends(get_current_superuser)],
) -> SystemHealth:
    """Get system health status.

    Requires superuser (admin) privileges.

    Returns health status of:
    - API
    - Database
    - Redis
    - Celery
    """
    return await AdminService.get_system_health(db)


@router.post(
    "/notifications/broadcast",
    response_model=BroadcastNotificationResponse,
    status_code=status.HTTP_200_OK,
)
async def broadcast_notification(
    notification_request: BroadcastNotificationRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[dict, Depends(get_current_superuser)],
) -> BroadcastNotificationResponse:
    """Broadcast a notification to multiple recipients.

    Requires superuser (admin) privileges.

    Allows admins to send system-wide notifications to:
    - All active users (recipients="all")
    - All members of a specific league (recipients=<league_id>)
    - Specific users (recipients=[<user_id1>, <user_id2>, ...])

    Args:
        notification_request: Broadcast notification data
            - type: Notification type (system, announcement, alert)
            - title: Notification title
            - message: Notification message
            - link: Optional link to direct users
            - recipients: Target audience ("all", league id, or list of user ids)

    Returns:
        Broadcast notification response with success status and count of notifications created
    """
    # Determine recipient scope
    recipients_str: str
    league_id: int | None = None
    user_ids: list[int] | None = None

    if notification_request.recipients == "all":
        recipients_str = "all"
    elif isinstance(notification_request.recipients, int):
        # It's a league ID
        recipients_str = "league"
        league_id = notification_request.recipients
    elif isinstance(notification_request.recipients, list):
        # It's a list of user IDs
        recipients_str = "users"
        user_ids = notification_request.recipients
    else:
        return BroadcastNotificationResponse(
            success=False,
            notifications_created=0,
            message="Invalid recipients format. Use 'all', league_id, or list of user_ids.",
        )

    # Broadcast the notification
    notifications_created = await NotificationService.broadcast_notification(
        db=db,
        notification_type=notification_request.type,
        title=notification_request.title,
        message=notification_request.message,
        link=notification_request.link,
        recipients=recipients_str,
        league_id=league_id,
        user_ids=user_ids,
    )

    return BroadcastNotificationResponse(
        success=True,
        notifications_created=notifications_created,
        message=f"Successfully broadcast notification to {notifications_created} recipients.",
    )
