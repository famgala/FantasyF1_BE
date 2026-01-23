"""Tests for the NotificationService."""

import pytest

from app.services.notification_service import NotificationService


class TestNotificationService:
    """Test cases for NotificationService."""

    @pytest.mark.asyncio()
    async def test_create_notification(self, db_session) -> None:
        """Test creating a notification."""
        user_id = 1

        notification = await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="race_finished",
            title="Test Race Finished",
            message="The test race has finished!",
            link="/races/1",
        )

        assert notification is not None
        assert notification.user_id == user_id
        assert notification.type == "race_finished"
        assert notification.title == "Test Race Finished"
        assert notification.message == "The test race has finished!"
        assert notification.link == "/races/1"
        assert notification.is_read is False or notification.is_read == 0
        assert notification.read_at is None

    @pytest.mark.asyncio()
    async def test_get_user_notifications(self, db_session) -> None:
        """Test getting notifications for a user."""
        user_id = 1

        # Create multiple notifications
        await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="race_finished",
            title="Notification 1",
            message="Message 1",
        )
        await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="pick_turn",
            title="Notification 2",
            message="Message 2",
        )
        await NotificationService.create_notification(
            db_session,
            user_id=2,
            notification_type="draft_update",
            title="Other User",
            message="Other",
        )

        notifications, total = await NotificationService.get_user_notifications(
            db_session, user_id=user_id
        )

        assert len(notifications) == 2
        assert total == 2

    @pytest.mark.asyncio()
    async def test_get_unread_notifications(self, db_session) -> None:
        """Test getting unread notifications."""
        user_id = 1

        # Create notifications
        notif1 = await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="race_finished",
            title="Unread",
            message="Message",
        )
        await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="pick_turn",
            title="Read",
            message="Message",
        )

        # Mark one as read
        await NotificationService.mark_as_read(db_session, notif1.id, user_id)

        notifications, total = await NotificationService.get_user_notifications(
            db_session, user_id=user_id, unread_only=True
        )

        assert len(notifications) == 1
        assert total == 1

    @pytest.mark.asyncio()
    async def test_mark_as_read(self, db_session) -> None:
        """Test marking notification as read."""
        user_id = 1

        notification = await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="race_finished",
            title="Test",
            message="Message",
        )

        assert notification.is_read is False or notification.is_read == 0
        assert notification.read_at is None

        updated = await NotificationService.mark_as_read(
            db_session, notification.id, user_id
        )

        assert updated is not None
        assert updated.is_read is True or updated.is_read == 1
        assert updated.read_at is not None

    @pytest.mark.asyncio()
    async def test_mark_all_as_read(self, db_session) -> None:
        """Test marking all notifications as read."""
        user_id = 1

        # Create multiple unread notifications
        await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="race_finished",
            title="Test 1",
            message="Message 1",
        )
        await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="pick_turn",
            title="Test 2",
            message="Message 2",
        )

        count = await NotificationService.mark_all_as_read(db_session, user_id)

        assert count == 2

    @pytest.mark.asyncio()
    async def test_delete_notification(self, db_session) -> None:
        """Test deleting a notification."""
        user_id = 1

        notification = await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="race_finished",
            title="Test",
            message="Message",
        )

        deleted = await NotificationService.delete_notification(
            db_session, notification.id, user_id
        )

        assert deleted is True

        # Verify it's deleted
        found = await NotificationService.get_notification(
            db_session, notification.id, user_id
        )
        assert found is None

    @pytest.mark.asyncio()
    async def test_count_unread(self, db_session) -> None:
        """Test counting unread notifications."""
        user_id = 1

        # Create notifications
        await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="race_finished",
            title="Test 1",
            message="Message 1",
        )
        await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="pick_turn",
            title="Test 2",
            message="Message 2",
        )

        count = await NotificationService.get_unread_count(db_session, user_id)

        assert count == 2

    @pytest.mark.asyncio()
    async def test_get_by_id(self, db_session) -> None:
        """Test getting notification by ID."""
        user_id = 1

        notification = await NotificationService.create_notification(
            db_session,
            user_id=user_id,
            notification_type="race_finished",
            title="Test",
            message="Message",
        )

        found = await NotificationService.get_notification(
            db_session, notification.id, user_id
        )

        assert found is not None
        assert found.id == notification.id

    @pytest.mark.asyncio()
    async def test_notification_types(self, db_session) -> None:
        """Test different notification types."""
        user_id = 1

        # Test RACE_FINISHED
        notif1 = await NotificationService.notify_race_finished(
            db_session, user_id=user_id, race_name="Monaco", race_id=1
        )
        assert notif1.type == "race_finished"

        # Test PICK_TURN
        notif2 = await NotificationService.notify_pick_turn(
            db_session,
            user_id=user_id,
            league_name="Test League",
            league_id=1,
            draft_id=1,
        )
        assert notif2.type == "pick_turn"

        # Test POINTS_UPDATED
        notif3 = await NotificationService.notify_points_updated(
            db_session,
            user_id=user_id,
            team_name="Team A",
            league_name="League A",
            league_id=1,
            points=25,
        )
        assert notif3.type == "points_updated"

        # Test DRAFT_UPDATE
        notif4 = await NotificationService.notify_draft_update(
            db_session,
            user_id=user_id,
            league_name="Test League",
            league_id=1,
            update_message="Draft started!",
        )
        assert notif4.type == "draft_update"
