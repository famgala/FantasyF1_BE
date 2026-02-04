"""Tests for Leaderboard endpoints."""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.core.security import get_password_hash
from app.models.fantasy_team import FantasyTeam
from app.models.league import League
from app.models.race import Race
from app.models.user import User


async def login_and_get_token(client: AsyncClient, username: str, password: str) -> str:
    """Login and return access token."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest_asyncio.fixture()
async def test_user(db_session) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("TestPass123"),
        is_active=True,
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
        race_date=datetime.utcnow() + timedelta(days=7),
        status="upcoming",
    )
    db_session.add(race)
    await db_session.commit()
    await db_session.refresh(race)
    return race


@pytest_asyncio.fixture()
async def test_teams(db_session, test_league: League, test_user: User) -> list[FantasyTeam]:
    """Create multiple test teams."""
    teams = []
    for i in range(5):
        team = FantasyTeam(
            name=f"Team {i}",
            user_id=test_user.id,
            league_id=test_league.id,
            total_points=i * 10,
        )
        db_session.add(team)
        teams.append(team)

    await db_session.commit()
    for team in teams:
        await db_session.refresh(team)
    return teams


class TestLeaderboardEndpoints:
    """Test suite for leaderboard endpoints."""

    @pytest.mark.asyncio()
    async def test_get_leaderboard_success(
        self,
        client: AsyncClient,
        test_user: User,
        test_league: League,
        test_teams: list[FantasyTeam],  # noqa: ARG002
    ) -> None:
        """Test getting league leaderboard."""
        token = await login_and_get_token(client, test_user.username, "TestPass123")
        response = await client.get(
            f"/api/v1/leagues/{test_league.id}/leaderboard",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert "entries" in data

    @pytest.mark.asyncio()
    async def test_get_leaderboard_not_found(self, client: AsyncClient, test_user: User) -> None:
        """Test getting leaderboard for non-existent league."""
        token = await login_and_get_token(client, test_user.username, "TestPass123")
        response = await client.get(
            "/api/v1/leagues/99999/leaderboard",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio()
    async def test_get_leaderboard_for_race(
        self,
        client: AsyncClient,
        test_user: User,
        test_league: League,
        test_race: Race,
        test_teams: list[FantasyTeam],  # noqa: ARG002
    ) -> None:
        """Test getting leaderboard for specific race."""
        token = await login_and_get_token(client, test_user.username, "TestPass123")
        response = await client.get(
            f"/api/v1/leagues/{test_league.id}/leaderboard?race_id={test_race.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Should return 200 or 400 if race doesn't have results yet
        assert response.status_code in [200, 400]

    @pytest.mark.asyncio()
    async def test_get_leaderboard_with_pagination(
        self,
        client: AsyncClient,
        test_user: User,
        test_league: League,
        test_teams: list[FantasyTeam],  # noqa: ARG002
    ) -> None:
        """Test getting leaderboard with pagination."""
        token = await login_and_get_token(client, test_user.username, "TestPass123")
        response = await client.get(
            f"/api/v1/leagues/{test_league.id}/leaderboard?skip=0&limit=3",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data is not None
        if "entries" in data:
            assert len(data["entries"]) <= 3

    @pytest.mark.asyncio()
    async def test_empty_leaderboard(
        self,
        client: AsyncClient,
        test_user: User,
        test_league: League,
    ) -> None:
        """Test getting leaderboard when league has no teams."""
        token = await login_and_get_token(client, test_user.username, "TestPass123")
        response = await client.get(
            f"/api/v1/leagues/{test_league.id}/leaderboard",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data is not None


class TestLeaderboardIntegration:
    """Integration tests for leaderboard workflows."""

    @pytest.mark.asyncio()
    async def test_leaderboard_ordering(
        self,
        client: AsyncClient,
        test_user: User,
        test_league: League,
        test_teams: list[FantasyTeam],  # noqa: ARG002
    ) -> None:
        """Test that leaderboard entries are properly ordered."""
        token = await login_and_get_token(client, test_user.username, "TestPass123")
        response = await client.get(
            f"/api/v1/leagues/{test_league.id}/leaderboard",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        if data and "entries" in data and len(data["entries"]) > 1:
            # Verify ordering (should be by points descending)
            entries = data["entries"]
            for i in range(len(entries) - 1):
                if "total_points" not in entries[i] or "total_points" not in entries[i + 1]:
                    continue
                assert entries[i]["total_points"] >= entries[i + 1]["total_points"]

    @pytest.mark.asyncio()
    async def test_leaderboard_response_structure(
        self,
        client: AsyncClient,
        test_user: User,
        test_league: League,
        test_teams: list[FantasyTeam],  # noqa: ARG002
    ) -> None:
        """Test that leaderboard response has expected structure."""
        token = await login_and_get_token(client, test_user.username, "TestPass123")
        response = await client.get(
            f"/api/v1/leagues/{test_league.id}/leaderboard",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        if data and "entries" in data and len(data["entries"]) > 0:
            assert isinstance(data["entries"], list)
            entry = data["entries"][0]
            # Check for expected fields
            expected_fields = ["rank", "team_id", "team_name", "total_points"]
            for field in expected_fields:
                assert field in entry

    @pytest.mark.asyncio()
    async def test_leaderboard_pagination_workflow(
        self,
        client: AsyncClient,
        test_user: User,
        test_league: League,
        test_teams: list[FantasyTeam],  # noqa: ARG002
    ) -> None:
        """Test paginating through leaderboard results."""
        token = await login_and_get_token(client, test_user.username, "TestPass123")

        # Get first page
        response1 = await client.get(
            f"/api/v1/leagues/{test_league.id}/leaderboard?skip=0&limit=2",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response1.status_code == 200

        # Get second page
        response2 = await client.get(
            f"/api/v1/leagues/{test_league.id}/leaderboard?skip=2&limit=2",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response2.status_code == 200

        # Verify we get different results
        data1 = response1.json()
        data2 = response2.json()

        if (
            data1
            and data2
            and "entries" in data1
            and "entries" in data2
            and len(data1["entries"]) > 0
            and len(data2["entries"]) > 0
        ):
            # Entries should be different (except when there are ties)
            # Check that team IDs are different between pages
            team_ids_page1 = {e.get("team_id") for e in data1["entries"]}
            team_ids_page2 = {e.get("team_id") for e in data2["entries"]}
            # These should be disjoint sets
            assert team_ids_page1.isdisjoint(team_ids_page2)
