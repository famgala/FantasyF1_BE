"""Service for notification management."""

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.models.notification import Notification

logger = get_logger(__name__)


class NotificationService:
    """Service for managing notifications."""

    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        link: str | None = None,
    ) -> "Notification":
        """Create a new notification for a user.

        Args:
            db: Database session
            user_id: User ID
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            link: Optional link for the notification

        Returns:
            Created notification object
        """
        from app.models.notification import Notification

        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            link=link,
            is_read=False,
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        logger.info(f"Created notification for user {user_id}: {title}")
        return notification

    @staticmethod
    async def get_user_notifications(
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
        unread_only: bool = False,
        notification_type: str | None = None,
    ) -> tuple[list["Notification"], int]:
        """Get notifications for a user.

        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            unread_only: If True, only return unread notifications
            notification_type: Optional filter by notification type

        Returns:
            Tuple of (notifications list, total count)
        """
        from sqlalchemy import func

        from app.models.notification import Notification

        # Build base query
        query = select(Notification).filter(Notification.user_id == user_id)

        if unread_only:
            query = query.filter(Notification.is_read.is_(False))

        if notification_type:
            query = query.filter(Notification.type == notification_type)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        total = total if total is not None else 0

        # Get paginated results
        query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        notifications = list(result.scalars().all())

        return notifications, total

    @staticmethod
    async def get_notification(
        db: AsyncSession,
        notification_id: int,
        user_id: int,
    ) -> "Notification | None":
        """Get a specific notification for a user.

        Args:
            db: Database session
            notification_id: Notification ID
            user_id: User ID (for ownership validation)

        Returns:
            Notification object or None if not found or not owned by user
        """
        from app.models.notification import Notification

        result = await db.execute(
            select(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def mark_as_read(
        db: AsyncSession,
        notification_id: int,
        user_id: int,
    ) -> "Notification | None":
        """Mark a notification as read.

        Args:
            db: Database session
            notification_id: Notification ID
            user_id: User ID (for ownership validation)

        Returns:
            Updated notification or None if not found
        """
        notification = await NotificationService.get_notification(db, notification_id, user_id)
        if notification:
            notification.is_read = True
            notification.read_at = datetime.now(UTC)
            await db.commit()
            await db.refresh(notification)

        return notification

    @staticmethod
    async def mark_as_unread(
        db: AsyncSession,
        notification_id: int,
        user_id: int,
    ) -> "Notification | None":
        """Mark a notification as unread.

        Args:
            db: Database session
            notification_id: Notification ID
            user_id: User ID (for ownership validation)

        Returns:
            Updated notification or None if not found
        """
        notification = await NotificationService.get_notification(db, notification_id, user_id)
        if notification:
            notification.is_read = False
            notification.read_at = None
            await db.commit()
            await db.refresh(notification)

        return notification

    @staticmethod
    async def mark_all_as_read(
        db: AsyncSession,
        user_id: int,
    ) -> int:
        """Mark all notifications for a user as read.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Number of notifications marked as read
        """
        from sqlalchemy import update

        from app.models.notification import Notification

        stmt = (
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
            .values(
                is_read=True,
                read_at=datetime.now(UTC),
            )
        )
        result = await db.execute(stmt)
        await db.commit()

        return result.rowcount

    @staticmethod
    async def delete_notification(
        db: AsyncSession,
        notification_id: int,
        user_id: int,
    ) -> bool:
        """Delete a notification.

        Args:
            db: Database session
            notification_id: Notification ID
            user_id: User ID (for ownership validation)

        Returns:
            True if deleted, False if not found
        """
        from app.models.notification import Notification

        result = await db.execute(
            select(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notification = result.scalar_one_or_none()

        if notification:
            await db.delete(notification)
            await db.commit()
            return True

        return False

    @staticmethod
    async def get_unread_count(
        db: AsyncSession,
        user_id: int,
    ) -> int:
        """Get count of unread notifications for a user.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            Number of unread notifications
        """
        from sqlalchemy import func

        from app.models.notification import Notification

        query = (
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        result = await db.execute(query)
        count = result.scalar()
        return count if count is not None else 0

    @staticmethod
    async def notify_race_finished(
        db: AsyncSession,
        user_id: int,
        race_name: str,
        race_id: int,
    ) -> "Notification":
        """Notify user that a race has finished.

        Args:
            db: Database session
            user_id: User ID
            race_name: Name of the race
            race_id: ID of the race

        Returns:
            Created notification
        """
        return await NotificationService.create_notification(
            db,
            user_id=user_id,
            notification_type="race_finished",
            title=f"Race Results: {race_name}",
            message=f"The {race_name} race has finished! Check your team's points.",
            link=f"/races/{race_id}",
        )

    @staticmethod
    async def notify_pick_turn(
        db: AsyncSession,
        user_id: int,
        league_name: str,
        league_id: int,
        draft_id: int,
    ) -> "Notification":
        """Notify user that it's their turn to pick.

        Args:
            db: Database session
            user_id: User ID
            league_name: Name of the league
            league_id: ID of the league
            draft_id: ID of the draft

        Returns:
            Created notification
        """
        return await NotificationService.create_notification(
            db,
            user_id=user_id,
            notification_type="pick_turn",
            title=f"Your Pick: {league_name}",
            message="It's your turn to make a pick in your fantasy league draft!",
            link=f"/leagues/{league_id}/drafts/{draft_id}",
        )

    @staticmethod
    async def notify_points_updated(
        db: AsyncSession,
        user_id: int,
        team_name: str,
        league_name: str,
        league_id: int,
        points: float,
    ) -> "Notification":
        """Notify user that their points have been updated.

        Args:
            db: Database session
            user_id: User ID
            team_name: Name of the team
            league_name: Name of the league
            league_id: ID of the league
            points: Current points

        Returns:
            Created notification
        """
        return await NotificationService.create_notification(
            db,
            user_id=user_id,
            notification_type="points_updated",
            title=f"Points Updated: {team_name}",
            message=f"Your team {team_name} in {league_name} now has {points} points!",
            link=f"/leagues/{league_id}",
        )

    @staticmethod
    async def notify_draft_update(
        db: AsyncSession,
        user_id: int,
        league_name: str,
        league_id: int,
        update_message: str,
    ) -> "Notification":
        """Notify user about draft updates.

        Args:
            db: Database session
            user_id: User ID
            league_name: Name of the league
            league_id: ID of the league
            update_message: Update message

        Returns:
            Created notification
        """
        return await NotificationService.create_notification(
            db,
            user_id=user_id,
            notification_type="draft_update",
            title=f"Draft Update: {league_name}",
            message=update_message,
            link=f"/leagues/{league_id}/drafts",
        )
