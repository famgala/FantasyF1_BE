"""Service for activity log management."""

from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.models.activity_log import ActivityLog

logger = get_logger(__name__)


class ActivityLogService:
    """Service for managing activity logs."""

    @staticmethod
    async def log_activity(
        db: AsyncSession,
        league_id: int,
        activity_type: str,
        title: str,
        message: str,
        user_id: int | None = None,
        reference_id: int | None = None,
        reference_type: str | None = None,
    ) -> "ActivityLog":
        """Log a new activity.

        Args:
            db: Database session
            league_id: League ID where activity occurred
            activity_type: Type of activity
            title: Activity title
            message: Activity message
            user_id: Optional ID of user who performed the action
            reference_id: Optional ID of referenced entity (team, race, etc.)
            reference_type: Type of referenced entity

        Returns:
            Created activity log object
        """
        from app.models.activity_log import ActivityLog

        activity = ActivityLog(
            league_id=league_id,
            user_id=user_id,
            activity_type=activity_type,
            title=title,
            message=message,
            reference_id=reference_id,
            reference_type=reference_type,
        )
        db.add(activity)
        await db.commit()
        await db.refresh(activity)

        logger.info(f"Logged activity for league {league_id}: {title}")
        return activity

    @staticmethod
    async def get_league_activities(
        db: AsyncSession,
        league_id: int,
        skip: int = 0,
        limit: int = 50,
        activity_type: str | None = None,
    ) -> tuple[list["ActivityLog"], int]:
        """Get activities for a league.

        Args:
            db: Database session
            league_id: League ID
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            activity_type: Optional filter by activity type

        Returns:
            Tuple of (activities list, total count)
        """
        from sqlalchemy import func

        from app.models.activity_log import ActivityLog

        # Build base query
        query = select(ActivityLog).filter(ActivityLog.league_id == league_id)

        if activity_type:
            query = query.filter(ActivityLog.activity_type == activity_type)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        total = total if total is not None else 0

        # Get paginated results ordered by newest first
        query = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        activities = list(result.scalars().all())

        return activities, total

    @staticmethod
    async def get_activity(
        db: AsyncSession,
        activity_id: int,
        league_id: int,
    ) -> "ActivityLog | None":
        """Get a specific activity for a league.

        Args:
            db: Database session
            activity_id: Activity ID
            league_id: League ID (for ownership validation)

        Returns:
            Activity log object or None if not found or not in league
        """
        from app.models.activity_log import ActivityLog

        result = await db.execute(
            select(ActivityLog).filter(
                ActivityLog.id == activity_id,
                ActivityLog.league_id == league_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_activity(
        db: AsyncSession,
        activity_id: int,
        league_id: int,
    ) -> bool:
        """Delete an activity log.

        Args:
            db: Database session
            activity_id: Activity ID
            league_id: League ID (for ownership validation)

        Returns:
            True if deleted, False if not found
        """
        from app.models.activity_log import ActivityLog

        result = await db.execute(
            select(ActivityLog).filter(
                ActivityLog.id == activity_id,
                ActivityLog.league_id == league_id,
            )
        )
        activity = result.scalar_one_or_none()

        if activity:
            await db.delete(activity)
            await db.commit()
            return True

        return False

    @staticmethod
    async def log_member_joined(
        db: AsyncSession,
        league_id: int,
        user_id: int,
        username: str,
        team_id: int,
        team_name: str,
    ) -> "ActivityLog":
        """Log when a new member joins a league.

        Args:
            db: Database session
            league_id: League ID
            user_id: User ID
            username: Username of the joining member
            team_id: Team ID
            team_name: Team name

        Returns:
            Created activity log
        """
        return await ActivityLogService.log_activity(
            db,
            league_id=league_id,
            activity_type="member_joined",
            title=f"{username} joined the league",
            message=f"{username} joined with team '{team_name}'",
            user_id=user_id,
            reference_id=team_id,
            reference_type="team",
        )

    @staticmethod
    async def log_team_created(
        db: AsyncSession,
        league_id: int,
        user_id: int,
        username: str,
        team_id: int,
        team_name: str,
    ) -> "ActivityLog":
        """Log when a team is created.

        Args:
            db: Database session
            league_id: League ID
            user_id: User ID
            username: Username of the team owner
            team_id: Team ID
            team_name: Team name

        Returns:
            Created activity log
        """
        return await ActivityLogService.log_activity(
            db,
            league_id=league_id,
            activity_type="team_created",
            title="New team created",
            message=f"{username} created team '{team_name}'",
            user_id=user_id,
            reference_id=team_id,
            reference_type="team",
        )

    @staticmethod
    async def log_draft_pick(
        db: AsyncSession,
        league_id: int,
        user_id: int,
        username: str,
        team_name: str,
        driver_name: str,
        draft_pick_id: int,
    ) -> "ActivityLog":
        """Log when a draft pick is made.

        Args:
            db: Database session
            league_id: League ID
            user_id: User ID
            username: Username of the picker
            team_name: Team name
            driver_name: Driver name picked
            draft_pick_id: Draft pick ID

        Returns:
            Created activity log
        """
        return await ActivityLogService.log_activity(
            db,
            league_id=league_id,
            activity_type="draft_pick_made",
            title=f"{username} made a pick",
            message=f"{username} picked {driver_name} for team '{team_name}'",
            user_id=user_id,
            reference_id=draft_pick_id,
            reference_type="draft_pick",
        )

    @staticmethod
    async def log_race_completed(
        db: AsyncSession,
        league_id: int,
        race_id: int,
        race_name: str,
        season: int,
        round_number: int,
    ) -> "ActivityLog":
        """Log when a race is completed.

        Args:
            db: Database session
            league_id: League ID
            race_id: Race ID
            race_name: Race name
            season: Season year
            round_number: Round number

        Returns:
            Created activity log
        """
        return await ActivityLogService.log_activity(
            db,
            league_id=league_id,
            activity_type="race_completed",
            title=f"Race completed: {race_name}",
            message=(
                f"The {race_name} (Round {round_number}, {season}) has been "
                f"completed. Points have been updated."
            ),
            reference_id=race_id,
            reference_type="race",
        )

    @staticmethod
    async def log_points_updated(
        db: AsyncSession,
        league_id: int,
        race_id: int,
        race_name: str,
    ) -> "ActivityLog":
        """Log when points are updated.

        Args:
            db: Database session
            league_id: League ID
            race_id: Race ID
            race_name: Race name

        Returns:
            Created activity log
        """
        return await ActivityLogService.log_activity(
            db,
            league_id=league_id,
            activity_type="points_updated",
            title="Points updated",
            message=f"Points have been updated for {race_name}",
            reference_id=race_id,
            reference_type="race",
        )

    @staticmethod
    async def log_league_created(
        db: AsyncSession,
        league_id: int,
        user_id: int,
        username: str,
        league_name: str,
    ) -> "ActivityLog":
        """Log when a league is created.

        Args:
            db: Database session
            league_id: League ID
            user_id: User ID
            username: Username of creator
            league_name: League name

        Returns:
            Created activity log
        """
        return await ActivityLogService.log_activity(
            db,
            league_id=league_id,
            activity_type="league_created",
            title="League created",
            message=f"{username} created the league '{league_name}'",
            user_id=user_id,
            reference_id=league_id,
            reference_type="league",
        )

    @staticmethod
    async def log_invitation_sent(
        db: AsyncSession,
        league_id: int,
        user_id: int,
        username: str,
        invited_email: str | None,
        invited_username: str | None,
        invitation_id: int,
    ) -> "ActivityLog":
        """Log when an invitation is sent.

        Args:
            db: Database session
            league_id: League ID
            user_id: User ID
            username: Username of sender
            invited_email: Email of invited user (if email invitation)
            invited_username: Username of invited user (if user invitation)
            invitation_id: Invitation ID

        Returns:
            Created activity log
        """
        invite_target = invited_username or invited_email
        return await ActivityLogService.log_activity(
            db,
            league_id=league_id,
            activity_type="invitation_sent",
            title="Invitation sent",
            message=f"{username} sent an invitation to {invite_target}",
            user_id=user_id,
            reference_id=invitation_id,
            reference_type="invitation",
        )

    @staticmethod
    async def log_invitation_accepted(
        db: AsyncSession,
        league_id: int,
        user_id: int,
        username: str,
        team_id: int,
        team_name: str,
        invitation_id: int,
    ) -> "ActivityLog":
        """Log when an invitation is accepted.

        Args:
            db: Database session
            league_id: League ID
            user_id: User ID
            username: Username of accepting user
            team_id: Team ID (also logged as secondary reference)
            team_name: Team name
            invitation_id: Invitation ID

        Returns:
            Created activity log
        """
        return await ActivityLogService.log_activity(
            db,
            league_id=league_id,
            activity_type="invitation_accepted",
            title="Invitation accepted",
            message=(
                f"{username} accepted the invitation and joined with "
                f"team '{team_name}'"
            ),
            user_id=user_id,
            reference_id=invitation_id,
            reference_type="invitation",
        )
