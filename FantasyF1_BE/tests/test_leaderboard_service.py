"""Tests for LeaderboardService."""

import pytest
import pytest_asyncio

from app.models.fantasy_team import FantasyTeam
from app.models.league import League
from app.models.race import Race
from app.models.user import User
from app.services.leaderboard_service import (
    LeaderboardEntry,
    LeaderboardService,
)


@pytest_asyncio.fixture()
async def test_user(db) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture()
async def test_league(db, test_user: User) -> League:
    """Create a test league."""
    league = League(
        name="Test League",
        code="TEST123",
        creator_id=test_user.id,
        draft_method="snake",
    )
    db.add(league)
    await db.commit()
    await db.refresh(league)
    return league


@pytest_asyncio.fixture()
async def test_race(db) -> Race:
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
    db.add(race)
    await db.commit()
    await db.refresh(race)
    return race


@pytest_asyncio.fixture()
async def test_teams(db, test_league: League, test_user: User) -> list[FantasyTeam]:
    """Create multiple test teams."""
    teams = []
    for i in range(5):
        team = FantasyTeam(
            name=f"Team {chr(65 + i)}",  # Team A, B, C, D, E for alphabetical testing
            user_id=test_user.id,
            league_id=test_league.id,
            total_points=i * 10,
        )
        db.add(team)
        teams.append(team)

    await db.commit()
    for team in teams:
        await db.refresh(team)
    return teams


@pytest_asyncio.fixture()
async def test_team_picks(db, test_teams: list[FantasyTeam], test_race: Race) -> list:
    """Create test team picks for a race."""
    from app.models.driver import Driver
    from app.models.fantasy_team import TeamPick

    # Create test drivers
    drivers = []
    for i in range(5):
        driver = Driver(
            external_id=i + 1,
            name=f"Driver{i} Last{i}",
            code=f"DL{i}",
            number=i + 1,
            team_name="Test Team",
        )
        db.add(driver)
        drivers.append(driver)

    await db.commit()
    for driver in drivers:
        await db.refresh(driver)

    # Create picks for each team for the race
    picks = []
    for team in test_teams:
        for i, driver in enumerate(drivers):
            pick = TeamPick(
                fantasy_team_id=team.id,
                race_id=test_race.id,
                driver_id=driver.id,
                pick_type="driver",
                points_earned=i * 5,
                is_active=True,
            )
            db.add(pick)
            picks.append(pick)

    await db.commit()
    for pick in picks:
        await db.refresh(pick)

    return picks


class TestLeaderboardService:
    """Test suite for LeaderboardService."""

    @pytest.mark.asyncio()
    async def test_get_leaderboard(
        self, db, test_league: League, test_teams  # noqa: ARG002
    ) -> None:
        """Test getting league leaderboard."""
        leaderboard = await LeaderboardService.get_leaderboard(
            db, league_id=test_league.id, use_cache=False
        )

        assert leaderboard is not None
        assert len(leaderboard) == 5

        # Verify ordering (should be by total_points descending)
        assert leaderboard[0]["total_points"] >= leaderboard[-1]["total_points"]

        # Verify entry structure
        entry = leaderboard[0]
        assert "rank" in entry
        assert "team_id" in entry
        assert "team_name" in entry
        assert "total_points" in entry

    @pytest.mark.asyncio()
    async def test_league_for_race(
        self,
        db,
        test_league: League,
        test_race: Race,
        test_team_picks,  # noqa: ARG002
    ) -> None:
        """Test getting leaderboard for specific race."""
        leaderboard = await LeaderboardService.get_leaderboard(
            db,
            league_id=test_league.id,
            race_id=test_race.id,
            use_cache=False,
        )

        assert leaderboard is not None
        assert len(leaderboard) == 5

    @pytest.mark.asyncio()
    async def test_leaderboard_with_ties(self, db, test_league: League) -> None:
        """Test leaderboard with tied scores."""
        # Create users for teams
        user1 = User(
            username="user1",
            email="user1@example.com",
            hashed_password="hashed_password",
        )
        user2 = User(
            username="user2",
            email="user2@example.com",
            hashed_password="hashed_password",
        )
        db.add_all([user1, user2])
        await db.commit()
        await db.refresh(user1)
        await db.refresh(user2)

        # Create teams with tied scores
        team1 = FantasyTeam(
            name="Team Z",  # Should sort after Team A alphabetically
            user_id=user1.id,
            league_id=test_league.id,
            total_points=50,
        )
        team2 = FantasyTeam(
            name="Team A",  # Should sort first alphabetically
            user_id=user2.id,
            league_id=test_league.id,
            total_points=50,
        )
        db.add_all([team1, team2])
        await db.commit()
        await db.refresh(team1)
        await db.refresh(team2)

        # Get leaderboard
        leaderboard = await LeaderboardService.get_leaderboard(
            db, league_id=test_league.id, use_cache=False
        )

        # Find our teams
        team1_entry = next((e for e in leaderboard if e["team_id"] == team1.id), None)
        team2_entry = next((e for e in leaderboard if e["team_id"] == team2.id), None)

        assert team1_entry is not None
        assert team2_entry is not None
        # Both teams should have same rank (tie)
        assert team1_entry["rank"] == team2_entry["rank"]
        # Team A should come before Team Z due to alphabetical tie-breaker
        assert leaderboard.index(team2_entry) < leaderboard.index(team1_entry)

    @pytest.mark.asyncio()
    async def test_rank_assignment_with_wins_and_podiums(
        self,
        db,
        test_league: League,
    ) -> None:
        """Test that leaderboard uses caching."""
        # First call (no cache)
        leaderboard1 = await LeaderboardService.get_leaderboard(
            db, league_id=test_league.id, use_cache=False
        )

        # Cache the result
        await LeaderboardService._cache_leaderboard(test_league.id, leaderboard1, None)

        # Second call (should use cache)
        leaderboard2 = await LeaderboardService.get_leaderboard(
            db, league_id=test_league.id, use_cache=True
        )

        # Results should be identical
        assert len(leaderboard1) == len(leaderboard2)
        for e1, e2 in zip(leaderboard1, leaderboard2, strict=False):
            assert e1["team_id"] == e2["team_id"]
            assert e1["total_points"] == e2["total_points"]

    @pytest.mark.asyncio()
    async def test_invalidate_cache(
        self,
        db,
        test_league: League,
    ) -> None:
        """Test cache invalidation."""
        # Cache leaderboard
        leaderboard1 = await LeaderboardService.get_leaderboard(
            db, league_id=test_league.id, use_cache=False
        )
        await LeaderboardService._cache_leaderboard(test_league.id, leaderboard1, None)

        # Invalidate cache
        await LeaderboardService.invalidate_leaderboard(test_league.id)

        # Get fresh leaderboard (shouldn't use cache)
        leaderboard2 = await LeaderboardService.get_leaderboard(
            db, league_id=test_league.id, use_cache=False
        )

        assert leaderboard2 == leaderboard1

    @pytest.mark.asyncio()
    async def test_empty_leaderboard(self, db, test_league: League) -> None:
        """Test leaderboard when league has no teams."""
        leaderboard = await LeaderboardService.get_leaderboard(
            db, league_id=test_league.id, use_cache=False
        )

        assert leaderboard is not None
        assert len(leaderboard) == 0

    @pytest.mark.asyncio()
    async def test_leaderboard_with_different_orderings(self, db, test_league: League) -> None:
        """Test leaderboard with different scoring orderings."""
        # Create user
        user = User(
            username="testuser2",
            email="test2@example.com",
            hashed_password="hashed_password",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        teams_to_create = [
            ("Team Low", 10.0),
            ("Team Medium", 50.0),
            ("Team High", 100.0),
        ]

        for name, score in teams_to_create:
            team = FantasyTeam(
                name=name,
                user_id=user.id,
                league_id=test_league.id,
                total_points=int(score),
            )
            db.add(team)

        await db.commit()

        leaderboard = await LeaderboardService.get_leaderboard(
            db, league_id=test_league.id, use_cache=False
        )

        # Verify ordering
        assert leaderboard[0]["total_points"] == 100.0
        assert leaderboard[1]["total_points"] == 50.0
        assert leaderboard[2]["total_points"] == 10.0

    @pytest.mark.asyncio()
    async def test_leaderboard_entry_properties(
        self,
        db,
        test_league: League,
        test_teams,  # noqa: ARG002
    ) -> None:
        """Test leaderboard entry contains all expected properties."""
        leaderboard = await LeaderboardService.get_leaderboard(
            db, league_id=test_league.id, use_cache=False
        )

        entry = leaderboard[0]

        # Verify entry has expected fields
        assert "rank" in entry
        assert "team_id" in entry
        assert "team_name" in entry
        assert "total_points" in entry
        assert "wins" in entry
        assert "podiums" in entry
        assert "is_tied" in entry

        # Verify values are set
        assert entry["rank"] > 0
        assert entry["team_id"] > 0
        assert entry["team_name"] is not None
        assert entry["total_points"] >= 0

    def test_leaderboard_entry_to_dict(self) -> None:
        """Test LeaderboardEntry to_dict method."""
        entry = LeaderboardEntry(
            rank=1,
            team_id=1,
            team_name="Test Team",
            user_id=1,
            username="testuser",
            total_points=100,
            wins=5,
            podiums=10,
        )

        entry_dict = entry.to_dict()

        assert entry_dict["rank"] == 1
        assert entry_dict["team_id"] == 1
        assert entry_dict["team_name"] == "Test Team"
        assert entry_dict["user_id"] == 1
        assert entry_dict["username"] == "testuser"
        assert entry_dict["total_points"] == 100
        assert entry_dict["wins"] == 5
        assert entry_dict["podiums"] == 10

    def test_assign_ranks_with_ties(self) -> None:
        """Test rank assignment with tie handling."""
        entries = [
            LeaderboardEntry(
                rank=0,
                team_id=1,
                team_name="Team C",
                user_id=1,
                username="user1",
                total_points=50,
                wins=2,
                podiums=3,
            ),
            LeaderboardEntry(
                rank=0,
                team_id=2,
                team_name="Team B",  # Same points, should sort by team name
                user_id=2,
                username="user2",
                total_points=50,
                wins=2,
                podiums=3,
            ),
            LeaderboardEntry(
                rank=0,
                team_id=3,
                team_name="Team A",
                user_id=3,
                username="user3",
                total_points=100,
                wins=5,
                podiums=8,
            ),
        ]

        ranked = LeaderboardService._assign_ranks_with_ties(entries)

        assert ranked[0].team_id == 3  # Team A with highest points
        assert ranked[0].rank == 1

        # Teams B and C are tied
        assert ranked[1].team_id == 2
        assert ranked[1].rank == 2
        assert ranked[1].is_tied

        assert ranked[2].team_id == 1
        assert ranked[2].rank == 2
        assert ranked[2].is_tied

    def test_cache_key_generation(self) -> None:
        """Test cache key generation."""
        key_no_race = LeaderboardService._get_cache_key(1)
        assert key_no_race == "leaderboard:league:1"

        key_with_race = LeaderboardService._get_cache_key(1, 5)
        assert key_with_race == "leaderboard:league:1:race:5"

    @pytest.mark.asyncio()
    async def test_get_user_rank(
        self,
        db,
        test_league: League,
        test_teams,
    ) -> None:
        """Test getting a user's rank."""
        # Get user rank for the first team's user
        user_id = test_teams[0].user_id
        rank_result = await LeaderboardService.get_user_rank(
            db, league_id=test_league.id, user_id=user_id
        )

        assert rank_result is not None
        rank, entry_dict = rank_result
        assert rank > 0
        assert entry_dict["user_id"] == user_id
