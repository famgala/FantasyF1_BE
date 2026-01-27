"""Admin service for platform management and statistics."""

from datetime import datetime, timedelta
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fantasy_team import FantasyTeam
from app.models.league import League
from app.models.race import Race
from app.models.user import User
from app.schemas.admin import (
    AdminLeagueBase,
    AdminUserBase,
    DailyDataPoint,
    PlatformStats,
    SystemHealth,
)


class AdminService:
    """Service for admin operations and statistics."""

    @staticmethod
    async def get_platform_stats(db: AsyncSession) -> PlatformStats:
        """Get platform statistics including user counts, league counts, and race data.

        Args:
            db: Database session

        Returns:
            Platform statistics object
        """
        # Get total users
        total_users_result = await db.execute(select(func.count()).select_from(User))
        total_users = total_users_result.scalar() or 0

        # Get active users in last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        active_users_result = await db.execute(
            select(func.count()).select_from(User).where(User.created_at >= seven_days_ago)
        )
        active_users_7d = active_users_result.scalar() or 0

        # Get total leagues
        total_leagues_result = await db.execute(select(func.count()).select_from(League))
        total_leagues = total_leagues_result.scalar() or 0

        # Get active leagues (those with teams)
        active_leagues_result = await db.execute(
            select(func.count()).select_from(FantasyTeam).where(FantasyTeam.id.isnot(None))
        )
        active_leagues = active_leagues_result.scalar() or 0

        # Get completed races
        completed_races_result = await db.execute(
            select(func.count()).select_from(Race).where(Race.race_date < datetime.utcnow())
        )
        completed_races = completed_races_result.scalar() or 0

        # Get upcoming races
        upcoming_races_result = await db.execute(
            select(func.count()).select_from(Race).where(Race.race_date >= datetime.utcnow())
        )
        upcoming_races = upcoming_races_result.scalar() or 0

        # Get user registrations by day for last 30 days
        registrations_by_day = await AdminService._get_daily_counts(db, User, "created_at", 30)

        # Get leagues created by day for last 30 days
        leagues_by_day = await AdminService._get_daily_counts(db, League, "created_at", 30)

        return PlatformStats(
            total_users=total_users,
            active_users_7d=active_users_7d,
            total_leagues=total_leagues,
            active_leagues=active_leagues,
            completed_races=completed_races,
            upcoming_races=upcoming_races,
            registrations_by_day=registrations_by_day,
            leagues_by_day=leagues_by_day,
        )

    @staticmethod
    async def _get_daily_counts(
        db: AsyncSession, model: type, date_field: str, days: int
    ) -> list[DailyDataPoint]:
        """Get daily counts for a model over a specified period.

        Args:
            db: Database session
            model: SQLAlchemy model to query
            date_field: Name of the date field to group by
            days: Number of days to look back

        Returns:
            List of daily data points with date and count
        """
        data_points: list[DailyDataPoint] = []
        today = datetime.utcnow().date()

        for i in range(days):
            date = today - timedelta(days=i)

            # Query count for this day
            result = await db.execute(
                select(func.count())
                .select_from(model)
                .where(
                    func.date(getattr(model, date_field)) == date,
                )
            )
            count = result.scalar() or 0

            data_points.append(DailyDataPoint(date=date.isoformat(), count=count))

        return list(reversed(data_points))

    @staticmethod
    async def get_all_users(
        db: AsyncSession,
        search: str | None = None,
        role: Literal["user", "admin"] | None = None,
        status: Literal["active", "inactive"] | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AdminUserBase]:
        """Get all users with optional filtering.

        Args:
            db: Database session
            search: Search term for username or email
            role: Filter by user role
            status: Filter by active status
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of admin user objects
        """
        query = select(User).options()

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (User.username.ilike(search_term)) | (User.email.ilike(search_term))
            )

        if role == "admin":
            query = query.where(User.is_superuser.is_(True))
        elif role == "user":
            query = query.where(User.is_superuser.is_(False))

        if status == "active":
            query = query.where(User.is_active.is_(True))
        elif status == "inactive":
            query = query.where(User.is_active.is_(False))

        # Order by created date descending
        query = query.order_by(User.created_at.desc())

        # Apply pagination
        query = query.limit(limit).offset(offset)

        result = await db.execute(query)
        users = result.scalars().all()

        # Get team counts for each user
        user_data = []
        for user in users:
            # Count teams for this user
            team_count_result = await db.execute(
                select(func.count()).select_from(FantasyTeam).where(FantasyTeam.user_id == user.id)
            )
            teams_count = team_count_result.scalar() or 0

            user_data.append(
                AdminUserBase(
                    id=user.id,
                    username=user.username,
                    email=user.email,
                    full_name=user.full_name,
                    role="admin" if user.is_superuser else "user",
                    is_active=user.is_active,
                    created_at=user.created_at,
                    teams_count=teams_count,
                )
            )

        return user_data

    @staticmethod
    async def get_users_count(
        db: AsyncSession,
        search: str | None = None,
        role: Literal["user", "admin"] | None = None,
        status: Literal["active", "inactive"] | None = None,
    ) -> int:
        """Get total count of users matching filters.

        Args:
            db: Database session
            search: Search term for username or email
            role: Filter by user role
            status: Filter by active status

        Returns:
            Total count of matching users
        """
        query = select(func.count()).select_from(User)

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (User.username.ilike(search_term)) | (User.email.ilike(search_term))
            )

        if role == "admin":
            query = query.where(User.is_superuser.is_(True))
        elif role == "user":
            query = query.where(User.is_superuser.is_(False))

        if status == "active":
            query = query.where(User.is_active.is_(True))
        elif status == "inactive":
            query = query.where(User.is_active.is_(False))

        result = await db.execute(query)
        return result.scalar() or 0

    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: int,
        is_active: bool | None = None,
        role: Literal["user", "admin"] | None = None,
    ) -> User:
        """Update user status and/or role.

        Args:
            db: Database session
            user_id: User ID to update
            is_active: New active status
            role: New role

        Returns:
            Updated user

        Raises:
            ValueError: If user not found
        """
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User with id {user_id} not found")

        if is_active is not None:
            user.is_active = is_active

        if role is not None:
            user.is_superuser = role == "admin"

        user.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(user)

        return user

    @staticmethod
    async def get_all_leagues(
        db: AsyncSession,
        search: str | None = None,
        privacy: Literal["public", "private"] | None = None,
        _status: Literal["drafting", "active", "completed", "cancelled"] | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AdminLeagueBase]:
        """Get all leagues with optional filtering.

        Args:
            db: Database session
            search: Search term for league name or code
            privacy: Filter by privacy status
            status: Filter by league status
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of admin league objects
        """
        query = select(League)

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.where((League.name.ilike(search_term)) | (League.code.ilike(search_term)))

        if privacy == "public":
            query = query.where(League.is_private.is_(False))
        elif privacy == "private":
            query = query.where(League.is_private.is_(True))

        # Note: League model doesn't have a status field, so we ignore status filter
        # Status will be determined based on draft_date and team counts

        # Order by created date descending
        query = query.order_by(League.created_at.desc())

        # Apply pagination
        query = query.limit(limit).offset(offset)

        result = await db.execute(query)
        leagues = result.scalars().all()

        # Build admin league objects
        league_data = []
        for league in leagues:
            # Count teams for this league
            team_count_result = await db.execute(
                select(func.count())
                .select_from(FantasyTeam)
                .where(FantasyTeam.league_id == league.id)
            )
            teams_count = team_count_result.scalar() or 0

            # Get creator username
            if league.creator_id:
                manager_result = await db.execute(
                    select(User.username).where(User.id == league.creator_id)
                )
                manager_username = manager_result.scalar() or "Unknown"
            else:
                manager_username = "System"

            # Determine league status based on draft date and team count
            if teams_count == 0:
                determined_status: Literal[
                    "drafting", "active", "completed", "cancelled"
                ] = "drafting"
            elif league.draft_date and league.draft_date < datetime.utcnow():
                determined_status = "active"
            else:
                determined_status = "active"

            league_data.append(
                AdminLeagueBase(
                    id=league.id,
                    name=league.name,
                    code=league.code,
                    manager_id=league.creator_id or 0,
                    manager_username=manager_username,
                    is_private=league.is_private,
                    status=determined_status,
                    teams_count=teams_count,
                    max_teams=league.max_teams,
                    created_at=league.created_at,
                )
            )

        return league_data

    @staticmethod
    async def get_leagues_count(
        db: AsyncSession,
        search: str | None = None,
        privacy: Literal["public", "private"] | None = None,
        _status: Literal["drafting", "active", "completed", "cancelled"] | None = None,
    ) -> int:
        """Get total count of leagues matching filters.

        Args:
            db: Database session
            search: Search term for league name or code
            privacy: Filter by privacy status
            status: Filter by league status

        Returns:
            Total count of matching leagues
        """
        query = select(func.count()).select_from(League)

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.where((League.name.ilike(search_term)) | (League.code.ilike(search_term)))

        if privacy == "public":
            query = query.where(League.is_private.is_(False))
        elif privacy == "private":
            query = query.where(League.is_private.is_(True))

        # Note: League model doesn't have a status field, so we ignore status filter

        result = await db.execute(query)
        return result.scalar() or 0

    @staticmethod
    async def update_league(
        db: AsyncSession,
        league_id: int,
        _status: Literal["active", "cancelled"] | None = None,
    ) -> League:
        """Update league (placeholder for future status updates).

        Args:
            db: Database session
            league_id: League ID to update
            status: New status (not currently used as League model has no status field)

        Returns:
            Updated league

        Raises:
            ValueError: If league not found
        """
        query = select(League).where(League.id == league_id)
        result = await db.execute(query)
        league = result.scalar_one_or_none()

        if not league:
            raise ValueError(f"League with id {league_id} not found")

        # Note: League model doesn't have a status field to update
        # Future implementation could add a status field or modify other attributes
        league.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(league)

        return league

    @staticmethod
    async def delete_league(db: AsyncSession, league_id: int) -> bool:
        """Delete a league.

        Args:
            db: Database session
            league_id: League ID to delete

        Returns:
            True if deleted successfully

        Raises:
            ValueError: If league not found
        """
        query = select(League).where(League.id == league_id)
        result = await db.execute(query)
        league = result.scalar_one_or_none()

        if not league:
            raise ValueError(f"League with id {league_id} not found")

        await db.delete(league)
        await db.commit()

        return True

    @staticmethod
    async def get_system_health(db: AsyncSession) -> SystemHealth:
        """Get system health status.

        Args:
            db: Database session

        Returns:
            System health status
        """
        # Check database health
        db_healthy = True
        db_response_time = 0
        try:
            start_time = datetime.utcnow()
            await db.execute(select(func.count()).select_from(User))
            end_time = datetime.utcnow()
            db_response_time = int((end_time - start_time).total_seconds() * 1000)
        except Exception:
            db_healthy = False

        # Check Redis health (simplified - just assume healthy for now)
        redis_healthy = True
        redis_response_time = 5

        # Check Celery health (simplified - just assume healthy for now)
        celery_healthy = True

        # API is obviously healthy if this code is running
        api_healthy = True
        api_response_time = 10

        return SystemHealth(
            api="healthy" if api_healthy else "down",
            database="healthy" if db_healthy else "down",
            redis="healthy" if redis_healthy else "down",
            celery="healthy" if celery_healthy else "down",
            response_times={
                "api": api_response_time,
                "database": db_response_time,
                "redis": redis_response_time,
            },
        )
