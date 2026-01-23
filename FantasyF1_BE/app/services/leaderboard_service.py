"""Service for league leaderboard calculations and caching."""

from typing import TYPE_CHECKING, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cache.client import get_redis_client
from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.models.league import League
    from app.models.race import Race

logger = get_logger(__name__)

# Cache TTL in seconds (5 minutes)
LEADERBOARD_CACHE_TTL = 300


class LeaderboardEntry:
    """Represents a single entry in the leaderboard."""

    def __init__(
        self,
        rank: int,
        team_id: int,
        team_name: str,
        user_id: int,
        username: str,
        total_points: int,
        wins: int = 0,
        podiums: int = 0,
    ):
        self.rank = rank
        self.team_id = team_id
        self.team_name = team_name
        self.user_id = user_id
        self.username = username
        self.total_points = total_points
        self.wins = wins
        self.podiums = podiums
        self.is_tied = False

    def to_dict(self) -> dict[str, int | str | bool]:
        """Convert entry to dictionary."""
        return {
            "rank": self.rank,
            "team_id": self.team_id,
            "team_name": self.team_name,
            "user_id": self.user_id,
            "username": self.username,
            "total_points": self.total_points,
            "wins": self.wins,
            "podiums": self.podiums,
            "is_tied": self.is_tied,
        }


class LeaderboardService:
    """Service for league leaderboard operations."""

    @staticmethod
    def _get_cache_key(league_id: int, race_id: int | None = None) -> str:
        """Generate cache key for leaderboard.

        Args:
            league_id: League ID
            race_id: Optional race ID for race-specific leaderboard

        Returns:
            Cache key string
        """
        if race_id:
            return f"leaderboard:league:{league_id}:race:{race_id}"
        return f"leaderboard:league:{league_id}"

    @staticmethod
    async def _get_redis_client() -> Any:
        """Get Redis client."""
        redis = await get_redis_client()
        return redis

    @staticmethod
    async def _get_cached_leaderboard(
        league_id: int,
        race_id: int | None = None,
    ) -> list[dict[str, Any]] | None:
        """Try to get leaderboard from cache.

        Args:
            league_id: League ID
            race_id: Optional race ID for race-specific leaderboard

        Returns:
            Cached leaderboard entries or None if not cached
        """
        try:
            redis = await LeaderboardService._get_redis_client()
            if redis:
                cache_key = LeaderboardService._get_cache_key(league_id, race_id)
                cached_data = await redis.get(cache_key)

                if cached_data:
                    import json

                    return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Failed to get cached leaderboard: {e}")

        return None

    @staticmethod
    async def _cache_leaderboard(
        league_id: int,
        leaderboard: list[dict[str, Any]],
        race_id: int | None = None,
    ) -> None:
        """Cache leaderboard entries.

        Args:
            league_id: League ID
            leaderboard: List of leaderboard entry dictionaries
            race_id: Optional race ID for race-specific leaderboard
        """
        try:
            import json

            redis = await LeaderboardService._get_redis_client()
            if redis:
                cache_key = LeaderboardService._get_cache_key(league_id, race_id)
                await redis.setex(
                    cache_key,
                    LEADERBOARD_CACHE_TTL,
                    json.dumps(leaderboard),
                )
                logger.debug(f"Cached leaderboard for league {league_id} (race: {race_id})")
        except Exception as e:
            logger.warning(f"Failed to cache leaderboard: {e}")

    @staticmethod
    async def _calculate_wins_and_podiums(
        db: AsyncSession,
        team_id: int,
        league_id: int,  # noqa: ARG004
        race_id: int | None = None,
    ) -> tuple[int, int]:
        """Calculate number of wins and podiums for a team.

        Args:
            db: Database session
            team_id: Team ID
            league_id: League ID
            race_id: Optional race ID to filter by specific race

        Returns:
            Tuple of (wins, podiums)
        """
        from app.models.fantasy_team import TeamPick

        # Get all race result points for this team
        query = select(TeamPick).filter(
            TeamPick.fantasy_team_id == team_id,
            TeamPick.is_active.is_(True),
        )

        if race_id:
            query = query.filter(TeamPick.race_id == race_id)

        result = await db.execute(query)
        picks = result.scalars().all()

        wins = 0
        podiums = 0

        for pick in picks:
            if pick.points_earned and pick.points_earned > 0:
                # Count as win if they got max points (25 or more)
                if pick.points_earned >= 25:
                    wins += 1
                # Count as podium if they got significant points (10 or more)
                if pick.points_earned >= 10:
                    podiums += 1

        return wins, podiums

    @staticmethod
    def _assign_ranks_with_ties(entries: list[LeaderboardEntry]) -> list[LeaderboardEntry]:
        """Assign ranks to leaderboard entries with proper tie handling.

        Tie-breaking rules:
        1. Total points (primary)
        2. Number of wins (secondary)
        3. Number of podiums (tertiary)
        4. Alphabetical team name (final)

        Args:
            entries: List of LeaderboardEntry objects already sorted by points

        Returns:
            List of entries with ranks assigned
        """
        if not entries:
            return []

        # Sort by points (desc), wins (desc), podiums (desc), team_name (asc)
        entries.sort(
            key=lambda e: (
                -e.total_points,
                -e.wins,
                -e.podiums,
                e.team_name.lower(),
            )
        )

        current_rank = 1
        current_tie_group: list[LeaderboardEntry] = []

        for i, entry in enumerate(entries):
            # Start new rank
            if i == 0:
                entry.rank = current_rank
                current_tie_group = [entry]
                continue

            # Check if tied with previous entry
            prev_entry = entries[i - 1]
            is_tied = (
                entry.total_points == prev_entry.total_points
                and entry.wins == prev_entry.wins
                and entry.podiums == prev_entry.podiums
            )

            if is_tied:
                # Same rank as previous tied entries
                entry.rank = prev_entry.rank
                entry.is_tied = True
                current_tie_group.append(entry)
            else:
                # New rank
                current_tie_group = [entry]
                current_rank = i + 1
                entry.rank = current_rank

            # Mark all previous entries in tie group as tied
            if is_tied:
                for tied_entry in current_tie_group:
                    tied_entry.is_tied = True

        return entries

    @staticmethod
    async def generate_leaderboard(
        db: AsyncSession,
        league: "League",
        race: "Race | None" = None,
    ) -> list[LeaderboardEntry]:
        """Generate leaderboard for a league.

        Args:
            db: Database session
            league: League object
            race: Optional race object for race-specific leaderboard

        Returns:
            List of LeaderboardEntry objects
        """
        from app.models.fantasy_team import FantasyTeam, TeamPick
        from app.models.user import User

        # Get all active teams in the league
        teams_query = select(FantasyTeam).filter(
            FantasyTeam.league_id == league.id,
            FantasyTeam.is_active.is_(True),
        )

        result = await db.execute(teams_query)
        teams = result.scalars().all()

        entries: list[LeaderboardEntry] = []

        for team in teams:
            # Get user info
            user_result = await db.execute(select(User).where(User.id == team.user_id))
            user = user_result.scalar_one_or_none()
            if not user:
                continue

            # Get picks for this team
            picks_query = select(TeamPick).filter(
                TeamPick.fantasy_team_id == team.id,
                TeamPick.is_active.is_(True),
            )

            if race:
                picks_query = picks_query.filter(TeamPick.race_id == race.id)

            picks_result = await db.execute(picks_query)
            picks = picks_result.scalars().all()

            # For race-specific leaderboards, skip teams with no picks for this race
            if race and not picks:
                continue

            # Calculate points
            if race:
                # Points for specific race
                points = sum(pick.points_earned or 0 for pick in picks)
            else:
                # Total points across all races
                points = team.total_points or 0

            # Calculate wins and podiums
            wins, podiums = await LeaderboardService._calculate_wins_and_podiums(
                db, team.id, league.id, race.id if race else None
            )

            entry = LeaderboardEntry(
                rank=0,  # Will be assigned later
                team_id=team.id,
                team_name=team.name,
                user_id=team.user_id,
                username=user.username,
                total_points=points,
                wins=wins,
                podiums=podiums,
            )
            entries.append(entry)

        # Assign ranks with tie-breaking
        entries = LeaderboardService._assign_ranks_with_ties(entries)

        return entries

    @staticmethod
    async def get_leaderboard(
        db: AsyncSession,
        league_id: int,
        race_id: int | None = None,
        use_cache: bool = True,
    ) -> list[dict[str, Any]]:
        """Get leaderboard for a league, with optional caching.

        Args:
            db: Database session
            league_id: League ID
            race_id: Optional race ID for race-specific leaderboard
            use_cache: Whether to use cached data if available

        Returns:
            List of leaderboard entry dictionaries
        """
        from app.models.league import League
        from app.models.race import Race

        # Try cache first
        if use_cache:
            cached = await LeaderboardService._get_cached_leaderboard(league_id, race_id)
            if cached:
                logger.debug(f"Returning cached leaderboard for league {league_id}")
                return cached

        # Get league
        result = await db.execute(select(League).where(League.id == league_id))
        league = result.scalar_one_or_none()
        if not league:
            raise ValueError(f"League {league_id} not found")

        # Get race if specified
        race: "Race | None" = None
        if race_id:
            result = await db.execute(select(Race).where(Race.id == race_id))
            race = result.scalar_one_or_none()  # type: ignore[assignment]
            if not race:
                raise ValueError(f"Race {race_id} not found")

        # Generate leaderboard
        entries = await LeaderboardService.generate_leaderboard(db, league, race)

        # Convert to dictionaries
        result_dict = [entry.to_dict() for entry in entries]

        # Cache the result
        await LeaderboardService._cache_leaderboard(league_id, result_dict, race_id)

        return result_dict

    @staticmethod
    async def invalidate_leaderboard(league_id: int, race_id: int | None = None) -> None:
        """Invalidate cached leaderboard for a league.

        Args:
            league_id: League ID
            race_id: Optional race ID for race-specific leaderboard
        """
        try:
            redis = await LeaderboardService._get_redis_client()
            if redis:
                cache_key = LeaderboardService._get_cache_key(league_id, race_id)
                await redis.delete(cache_key)
                logger.info(
                    f"Invalidated leaderboard cache for league {league_id} (race: {race_id})"
                )
        except Exception as e:
            logger.warning(f"Failed to invalidate leaderboard cache: {e}")

    @staticmethod
    async def get_user_rank(
        db: AsyncSession,
        league_id: int,
        user_id: int,
        race_id: int | None = None,
    ) -> tuple[int, dict[str, Any]] | None:
        """Get a user's rank and entry in a league leaderboard.

        Args:
            db: Database session
            league_id: League ID
            user_id: User ID
            race_id: Optional race ID for race-specific leaderboard

        Returns:
            Tuple of (rank, entry_dict) or None if not found
        """
        from app.models.league import League
        from app.models.race import Race

        # Get league
        result = await db.execute(select(League).where(League.id == league_id))
        league = result.scalar_one_or_none()
        if not league:
            return None

        # Get race if specified
        race: "Race | None" = None
        if race_id:
            result = await db.execute(select(Race).where(Race.id == race_id))
            race = result.scalar_one_or_none()  # type: ignore[assignment]
            if not race:
                return None

        # Generate leaderboard
        entries = await LeaderboardService.generate_leaderboard(db, league, race)

        # Find user's entry
        for entry in entries:
            if entry.user_id == user_id:
                return entry.rank, entry.to_dict()

        return None
