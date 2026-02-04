"""Admin service for administrative operations."""

import time
from datetime import datetime, timedelta
from typing import TypedDict

from sqlalchemy import desc, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.client import ping_redis
from app.models.error_log import ErrorLog
from app.models.league import League
from app.models.race import Race
from app.models.user import User


class DailyStat(TypedDict):
    """Daily statistic entry.

    Attributes:
        date: Date in YYYY-MM-DD format
        count: Count for that date
    """

    date: str
    count: int


async def get_admin_statistics(db: AsyncSession) -> dict[str, object]:
    """Get comprehensive platform statistics for admin dashboard.

    Args:
        db: Async database session

    Returns:
        Dictionary containing:
        - total_users: Total number of users in the system
        - active_users_7d: Number of users active in the last 7 days
        - total_leagues: Total number of leagues
        - active_leagues: Number of active leagues
        - completed_races: Number of completed races
        - upcoming_races: Number of upcoming races
        - registrations_by_day: User registrations per day for last 30 days
        - leagues_by_day: League creations per day for last 30 days
    """
    # Get total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()

    # Get active users in last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    active_users_result = await db.execute(
        select(func.count(User.id)).where(User.updated_at >= seven_days_ago)
    )
    active_users_7d = active_users_result.scalar()

    # Get total leagues
    total_leagues_result = await db.execute(select(func.count(League.id)))
    total_leagues = total_leagues_result.scalar()

    # Get active leagues (leagues with draft_date not in the past or completed races)
    # For now, count all leagues except those with very old draft dates
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_leagues_result = await db.execute(
        select(func.count(League.id)).where(
            League.draft_date.is_(None) | (League.draft_date >= thirty_days_ago)
        )
    )
    active_leagues = active_leagues_result.scalar()

    # Get completed races
    completed_races_result = await db.execute(
        select(func.count(Race.id)).where(Race.status == "completed")
    )
    completed_races = completed_races_result.scalar()

    # Get upcoming races
    now = datetime.utcnow()
    upcoming_races_result = await db.execute(
        select(func.count(Race.id)).where(Race.race_date > now, Race.status != "cancelled")
    )
    upcoming_races = upcoming_races_result.scalar()

    # Get user registrations by day for last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    registrations_by_day = await _get_daily_user_registrations(db, start_date=thirty_days_ago)

    # Get league creations by day for last 30 days
    leagues_by_day = await _get_daily_league_creations(db, start_date=thirty_days_ago)

    return {
        "total_users": total_users,
        "active_users_7d": active_users_7d,
        "total_leagues": total_leagues,
        "active_leagues": active_leagues,
        "completed_races": completed_races,
        "upcoming_races": upcoming_races,
        "registrations_by_day": registrations_by_day,
        "leagues_by_day": leagues_by_day,
    }


async def _get_daily_user_registrations(db: AsyncSession, start_date: datetime) -> list[DailyStat]:
    """Get daily user registrations.

    Args:
        db: Async database session
        start_date: Start date for the query

    Returns:
        List of daily statistics
    """
    result = await db.execute(
        select(
            func.date(User.created_at).label("date"),
            func.count(User.id).label("count"),
        )
        .where(User.created_at >= start_date)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )

    rows = result.all()
    return [{"date": str(row.date), "count": int(row[1])} for row in rows]


async def get_error_logs(
    db: AsyncSession,
    offset: int = 0,
    limit: int = 50,
    severity: str | None = None,
    resolved: bool | None = None,
    error_type: str | None = None,
    user_id: int | None = None,
    endpoint: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, object]:
    """Get error logs with filtering and pagination.

    Args:
        db: Async database session
        offset: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        severity: Filter by severity level
        resolved: Filter by resolved status
        error_type: Filter by error type
        user_id: Filter by user ID
        endpoint: Filter by endpoint
        start_date: Filter by start date (ISO format string)
        end_date: Filter by end date (ISO format string)

    Returns:
        Dictionary containing:
        - items: List of error logs
        - total: Total number of error logs matching filters
        - page: Current page number (calculated from offset/limit)
        - page_size: Number of items per page
        - total_pages: Total number of pages
    """
    query = select(ErrorLog)

    # Apply filters
    if severity:
        query = query.where(ErrorLog.severity == severity)
    if resolved is not None:
        query = query.where(ErrorLog.resolved == resolved)
    if error_type:
        query = query.where(ErrorLog.error_type.ilike(f"%{error_type}%"))
    if user_id:
        query = query.where(ErrorLog.user_id == user_id)
    if endpoint:
        query = query.where(ErrorLog.endpoint.ilike(f"%{endpoint}%"))
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.where(ErrorLog.timestamp >= start_dt)
        except ValueError:
            pass  # Invalid date format, ignore filter
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.where(ErrorLog.timestamp <= end_dt)
        except ValueError:
            pass  # Invalid date format, ignore filter

    # Get total count
    count_query = select(func.count(ErrorLog.id))
    if severity:
        count_query = count_query.where(ErrorLog.severity == severity)
    if resolved is not None:
        count_query = count_query.where(ErrorLog.resolved == resolved)
    if error_type:
        count_query = count_query.where(ErrorLog.error_type.ilike(f"%{error_type}%"))
    if user_id:
        count_query = count_query.where(ErrorLog.user_id == user_id)
    if endpoint:
        count_query = count_query.where(ErrorLog.endpoint.ilike(f"%{endpoint}%"))
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            count_query = count_query.where(ErrorLog.timestamp >= start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            count_query = count_query.where(ErrorLog.timestamp <= end_dt)
        except ValueError:
            pass

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated results, ordered by timestamp descending
    query = query.order_by(desc(ErrorLog.timestamp)).offset(offset).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    # Calculate pagination info
    page = offset // limit + 1 if limit > 0 else 1
    page_size = limit
    total_pages = (total + limit - 1) // limit if limit > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


async def update_error_log(
    db: AsyncSession,
    log_id: int,
    resolved: bool,
    notes: str | None,
    resolved_by_user_id: int,
) -> ErrorLog | None:
    """Update an error log (mark as resolved/unresolved).

    Args:
        db: Async database session
        log_id: Error log ID
        resolved: Whether error is resolved
        notes: Resolution notes
        resolved_by_user_id: ID of admin resolving the error

    Returns:
        Updated error log or None if not found
    """
    result = await db.execute(select(ErrorLog).where(ErrorLog.id == log_id))
    error_log = result.scalar_one_or_none()

    if not error_log:
        return None

    error_log.resolved = resolved
    error_log.notes = notes
    if resolved:
        error_log.resolved_at = datetime.utcnow()
        error_log.resolved_by = resolved_by_user_id
    else:
        error_log.resolved_at = None
        error_log.resolved_by = None

    await db.commit()
    await db.refresh(error_log)

    return error_log


async def _get_daily_league_creations(db: AsyncSession, start_date: datetime) -> list[DailyStat]:
    """Get daily league creations.

    Args:
        db: Async database session
        start_date: Start date for the query

    Returns:
        List of daily statistics
    """
    result = await db.execute(
        select(
            func.date(League.created_at).label("date"),
            func.count(League.id).label("count"),
        )
        .where(League.created_at >= start_date)
        .group_by(func.date(League.created_at))
        .order_by(func.date(League.created_at))
    )

    rows = result.all()
    return [{"date": str(row.date), "count": int(row[1])} for row in rows]


async def check_system_health(db: AsyncSession) -> dict[str, object]:
    """Check comprehensive system health status.

    Args:
        db: Async database session

    Returns:
        Dictionary containing health status for all system components:
        - api_status: API service health status (healthy/degraded/unhealthy)
        - api_response_time_ms: API response time in milliseconds
        - database_status: Database connection status (healthy/degraded/unhealthy)
        - database_response_time_ms: Database response time in milliseconds
        - redis_status: Redis cache status (healthy/degraded/unhealthy)
        - redis_response_time_ms: Redis response time in milliseconds
        - celery_status: Celery task queue status (healthy/degraded/unhealthy)
        - celery_response_time_ms: Celery response time in milliseconds
        - overall_status: Overall system health (healthy/degraded/unhealthy)
        - timestamp: When the health check was performed
    """
    health_status = {
        "api_status": "healthy",
        "api_response_time_ms": 0.0,
        "database_status": "healthy",
        "database_response_time_ms": 0.0,
        "redis_status": "healthy",
        "redis_response_time_ms": 0.0,
        "celery_status": "healthy",
        "celery_response_time_ms": 0.0,
        "overall_status": "healthy",
        "timestamp": datetime.utcnow(),
    }

    # Check API health (self-check - just measure response time)
    api_start = time.perf_counter()
    try:
        # Simulate API check by just getting current time
        _ = datetime.utcnow()
        api_response_time = (time.perf_counter() - api_start) * 1000
        health_status["api_response_time_ms"] = round(api_response_time, 2)
        health_status["api_status"] = "healthy"
    except Exception:
        health_status["api_status"] = "unhealthy"

    # Check Database health
    db_start = time.perf_counter()
    try:
        # Execute a simple query to check database connectivity
        await db.execute(text("SELECT 1"))
        db_response_time = (time.perf_counter() - db_start) * 1000
        health_status["database_response_time_ms"] = round(db_response_time, 2)
        health_status["database_status"] = "healthy"
    except Exception:
        health_status["database_status"] = "unhealthy"
        health_status["database_response_time_ms"] = 0.0

    # Check Redis health
    redis_start = time.perf_counter()
    try:
        redis_healthy = await ping_redis()
        if redis_healthy:
            redis_response_time = (time.perf_counter() - redis_start) * 1000
            health_status["redis_response_time_ms"] = round(redis_response_time, 2)
            health_status["redis_status"] = "healthy"
        else:
            health_status["redis_status"] = "degraded"
            health_status["redis_response_time_ms"] = 0.0
    except Exception:
        health_status["redis_status"] = "unhealthy"
        health_status["redis_response_time_ms"] = 0.0

    # Check Celery health
    celery_start = time.perf_counter()
    try:
        # Import here to avoid circular dependencies
        from app.tasks.celery_app import celery_app

        # Try to inspect Celery to check if workers are running
        inspect = celery_app.control.inspect(timeout=1.0)
        stats = inspect.stats()
        celery_response_time = (time.perf_counter() - celery_start) * 1000

        if stats and len(stats) > 0:
            health_status["celery_response_time_ms"] = round(celery_response_time, 2)
            health_status["celery_status"] = "healthy"
        else:
            health_status["celery_response_time_ms"] = round(celery_response_time, 2)
            health_status["celery_status"] = "degraded"
    except Exception:
        health_status["celery_status"] = "unhealthy"
        health_status["celery_response_time_ms"] = 0.0

    # Determine overall health status
    statuses = [
        health_status["api_status"],
        health_status["database_status"],
        health_status["redis_status"],
        health_status["celery_status"],
    ]

    if "unhealthy" in statuses:
        health_status["overall_status"] = "unhealthy"
    elif "degraded" in statuses:
        health_status["overall_status"] = "degraded"
    else:
        health_status["overall_status"] = "healthy"

    return health_status
