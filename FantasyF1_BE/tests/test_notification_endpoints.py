"""Tests for Notification endpoints."""

from datetime import timezone

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

from app.main import app
from app.models.fantasy_team import FantasyTeam
from app.models.league import League
from app.models.race import Race
from app.models.user import User
from app.services.notification_service import NotificationService


@pytest.fixture
def client() -> TestClient:
    """Create test client."""
    return TestClient(app)


@pytest_asyncio.fixture()
async def test_user(db_session) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture()
async def test_league(db_session, test_user: User) -> League:
    """Create a test league."""
    league = League(
        name="Test League",
        code="TESTLEAG",
        creator_id=test_user.id,
        draft_method="snake",
    )
    db_session.add(league)
    await db_session.commit()
    await db_session.refresh(league)
    return league


@pytest_asyncio.fixture()
async def test_race(db_session) -> Race:
    """Create a test race."""
    from datetime import datetime, timedelta

    race = Race(
        external_id=1,
        round_number=1,
        name="Test Grand Prix",
        circuit_name="Test Circuit",
        country="Test Country",
        race_date=datetime.now(timezone.utc) + timedelta(days=7),
        status="upcoming",
    )
    db_session.add(race)
    await db_session.commit()
    await db_session.refresh(race)
    return race


@pytest_asyncio.fixture()
async def test_teams(db_session, test_league: League, test_user: User):
    """Create multiple test teams."""
    teams = []
    for i in range(5):
        team = FantasyTeam(
            name=f"Team {i}",
            user_id=test_user.id,
            league_id=test_league.id,
            drivers=[],
            constructor=None,
            total_points=float(i * 10),
        )
        db_session.add(team)
        teams.append(team)

    await db_session.commit()
    for team in teams:
        await db_session.refresh(team)
    return teams


class TestNotificationEndpoints:
    """Test suite for notification endpoints."""

    @pytest.mark.asyncio
    async def test_get_notifications_empty(
        self,
        db_session,
        test_user: User,
    ) -> None:
        """Test getting notifications when user has none."""
        notifications, total = await NotificationService.get_user_notifications(
            db_session, user_id=test_user.id
        )
        assert notifications == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_get_notification_by_id_not_found(
        self,
        db_session,
        test_user: User,
    ) -> None:
        """Test getting non-existent notification by ID."""
        notification = await NotificationService.get_notification(
            db_session, notification_id=99999, user_id=test_user.id
        )
        assert notification is None

    @pytest.mark.asyncio
    async def test_mark_notification_as_read(
        self,
        db_session,
        test_user: User,
    ) -> None:
        """Test marking a notification as read."""
        notification = await NotificationService.create_notification(
            db_session,
            user_id=test_user.id,
            notification_type="pick_turn",
            title="Your turn",
            message="Pick a driver",
            link="/drafts/1",
        )

        updated = await NotificationService.mark_as_read(db_session, notification.id, test_user.id)
        assert updated is not None
        assert updated.is_read is True or updated.is_read == 1

    @pytest.mark.asyncio
    async def test_mark_all_notifications_as_read(
        self,
        db_session,
        test_user: User,
    ) -> None:
        """Test marking all notifications as read."""
        # Create multiple notifications
        await NotificationService.create_notification(
            db_session,
            user_id=test_user.id,
            notification_type="pick_turn",
            title="Turn 1",
            message="Pick",
        )
        await NotificationService.create_notification(
            db_session,
            user_id=test_user.id,
            notification_type="race_finished",
            title="Race done",
            message="Results",
        )

        count = await NotificationService.mark_all_as_read(db_session, test_user.id)
        assert count == 2

    @pytest.mark.asyncio
    async def test_delete_notification(
        self,
        db_session,
        test_user: User,
    ) -> None:
        """Test deleting a notification."""
        notification = await NotificationService.create_notification(
            db_session,
            user_id=test_user.id,
            notification_type="pick_turn",
            title="Delete me",
            message="To delete",
        )

        deleted = await NotificationService.delete_notification(
            db_session, notification.id, test_user.id
        )
        assert deleted is True

    @pytest.mark.asyncio
    async def test_get_unread_count(
        self,
        db_session,
        test_user: User,
    ) -> None:
        """Test getting unread notification count."""
        # Create unread notifications
        await NotificationService.create_notification(
            db_session,
            user_id=test_user.id,
            notification_type="pick_turn",
            title="Unread 1",
            message="Message",
        )
        await NotificationService.create_notification(
            db_session,
            user_id=test_user.id,
            notification_type="race_finished",
            title="Unread 2",
            message="Message",
        )

        count = await NotificationService.get_unread_count(db_session, test_user.id)
        assert count == 2


class TestNotificationIntegration:
    """Integration tests for notification workflows."""

    @pytest.mark.asyncio
    async def test_notification_lifetime(
        self,
        db_session,
        test_user: User,
    ) -> None:
        """Test complete notification lifecycle."""
        # Create notification via service
        notification = await NotificationService.create_notification(
            db_session,
            user_id=test_user.id,
            notification_type="pick_turn",
            title="Your turn",
            message="Pick a driver",
            link="/drafts/1",
        )

        # Get notification
        retrieved = await NotificationService.get_notification(
            db_session, notification.id, test_user.id
        )
        assert retrieved is not None
        assert retrieved.title == "Your turn"

        # Mark as read
        marked = await NotificationService.mark_as_read(db_session, notification.id, test_user.id)
        assert marked is not None
        assert marked.is_read is True or marked.is_read == 1

        # Delete notification
        deleted = await NotificationService.delete_notification(
            db_session, notification.id, test_user.id
        )
        assert deleted is True

    @pytest.mark.asyncio
    async def test_bulk_mark_as_read(
        self,
        db_session,
        test_user: User,
    ) -> None:
        """Test marking multiple notifications as read."""
        # Create multiple notifications
        notification_ids = []
        for i in range(3):
            notification = await NotificationService.create_notification(
                db_session,
                user_id=test_user.id,
                notification_type="pick_turn",
                title=f"Notification {i}",
                message=f"Message {i}",
            )
            notification_ids.append(notification.id)

        # Verify unread count
        unread_before = await NotificationService.get_unread_count(db_session, test_user.id)
        assert unread_before == 3

        # Mark all as read
        count = await NotificationService.mark_all_as_read(db_session, test_user.id)
        assert count == 3

        # Verify all are now read
        unread_after = await NotificationService.get_unread_count(db_session, test_user.id)
        assert unread_after == 0

    @pytest.mark.asyncio
    async def test_notification_pagination(
        self,
        db_session,
        test_user: User,
    ) -> None:
        """Test notification pagination."""
        # Create many notifications
        num_notifications = 10
        for i in range(num_notifications):
            await NotificationService.create_notification(
                db_session,
                user_id=test_user.id,
                notification_type="pick_turn",
                title=f"Notification {i}",
                message=f"Message {i}",
            )

        # Get first page
        notifications1, total = await NotificationService.get_user_notifications(
            db_session, user_id=test_user.id, skip=0, limit=5
        )
        assert len(notifications1) == 5
        assert total == num_notifications

        # Get second page
        notifications2, total = await NotificationService.get_user_notifications(
            db_session, user_id=test_user.id, skip=5, limit=5
        )
        assert len(notifications2) == 5
        assert total == num_notifications

        # Verify different notifications on each page
        ids_page1 = {n.id for n in notifications1}
        ids_page2 = {n.id for n in notifications2}
        assert ids_page1.isdisjoint(ids_page2)
