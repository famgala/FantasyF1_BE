"""Admin endpoints for administrative operations."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser, get_db
from app.models.user import User
from app.schemas.admin import (
    AdminStatsResponse,
    ErrorLogResponse,
    ErrorLogsResponse,
    ErrorLogUpdate,
)
from app.services.admin_service import get_admin_statistics, get_error_logs, update_error_log

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


@router.get("/logs", response_model=ErrorLogsResponse)
async def get_platform_error_logs(
    _current_user: Annotated[User, Depends(get_current_superuser)],
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    severity: str | None = None,
    resolved: bool | None = None,
    error_type: str | None = None,
    user_id: int | None = None,
    endpoint: str | None = None,
) -> dict:
    """Get error logs with filtering and pagination.

    Requires superuser privileges.

    Args:
        skip: Number of records to skip (for pagination), default 0
        limit: Maximum number of records to return, default 50
        severity: Filter by severity level (e.g., 'error', 'warning', 'info')
        resolved: Filter by resolved status (true/false)
        error_type: Filter by error type (partial match)
        user_id: Filter by user ID
        endpoint: Filter by endpoint (partial match)
        _current_user: Current authenticated superuser (unused but required for auth)
        db: Async database session

    Returns:
        Dictionary containing paginated error logs:
        - items: List of error logs
        - total: Total number of error logs matching filters
        - page: Current page number
        - page_size: Number of items per page
        - total_pages: Total number of pages
    """
    logs = await get_error_logs(
        db=db,
        skip=skip,
        limit=limit,
        severity=severity,
        resolved=resolved,
        error_type=error_type,
        user_id=user_id,
        endpoint=endpoint,
    )
    return logs


@router.put("/logs/{log_id}", response_model=ErrorLogResponse)
async def update_error_log_status(
    log_id: int,
    log_update: ErrorLogUpdate,
    current_user: Annotated[User, Depends(get_current_superuser)],
    db: AsyncSession = Depends(get_db),
) -> ErrorLogResponse:
    """Update an error log (mark as resolved/unresolved).

    Requires superuser privileges.

    Args:
        log_id: Error log ID
        log_update: Update data containing resolved status and notes
        current_user: Current authenticated superuser
        db: Async database session

    Returns:
        Updated error log

    Raises:
        HTTPException: If error log not found
    """
    updated_log = await update_error_log(
        db=db,
        log_id=log_id,
        resolved=log_update.resolved,
        notes=log_update.notes,
        resolved_by_user_id=current_user.id,
    )

    if not updated_log:
        raise HTTPException(status_code=404, detail="Error log not found")

    return ErrorLogResponse.model_validate(updated_log)
