"""Admin service for administrative operations."""

from datetime import datetime, timedelta
from typing import TypedDict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

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


async def get_admin_statistics(db: AsyncSession) -> dict:
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
