"""Fantasy Team service for F1 Fantasy game.

This service handles the creation, management, and operations of fantasy teams,
including team creation, pick management, and team validation.
"""


from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.models.constructor import Constructor
from app.models.driver import Driver
from app.models.fantasy_team import FantasyTeam, TeamPick
from app.models.race import Race
from app.services.scoring_service import ScoringService


class FantasyTeamService:
    """Service for managing fantasy teams."""

    DEFAULT_BUDGET = 100

    @staticmethod
    async def create_team(
        session: AsyncSession,
        user_id: int,
        league_id: int,
        name: str,
    ) -> FantasyTeam:
        """Create a new fantasy team for a user in a league.

        Args:
            session: Database session
            user_id: ID of the user creating the team
            league_id: ID of the league
            name: Name of the fantasy team

        Returns:
            Created FantasyTeam instance

        Raises:
            ConflictError: If user already has a team in this league
        """
        # Check if user already has a team in this league
        existing_query = select(FantasyTeam).where(
            and_(
                FantasyTeam.user_id == user_id,
                FantasyTeam.league_id == league_id,
            )
        )
        result = await session.execute(existing_query)
        existing_team = result.scalar_one_or_none()

        if existing_team:
            raise ConflictError(f"User {user_id} already has a team in league {league_id}")

        # Create the team
        team = FantasyTeam(
            user_id=user_id,
            league_id=league_id,
            name=name,
            total_points=0,
            budget_remaining=FantasyTeamService.DEFAULT_BUDGET,
            is_active=True,
        )

        session.add(team)
        await session.commit()
        await session.refresh(team)

        return team

    @staticmethod
    async def get_team(
        session: AsyncSession,
        team_id: int,
        user_id: int | None = None,
    ) -> FantasyTeam:
        """Get a fantasy team by ID, optionally filtered by user.

        Args:
            session: Database session
            team_id: ID of the team to retrieve
            user_id: Optional user ID to ensure team ownership

        Returns:
            FantasyTeam instance

        Raises:
            NotFoundError: If team not found
        """
        query = select(FantasyTeam).where(FantasyTeam.id == team_id)

        if user_id is not None:
            query = query.where(FantasyTeam.user_id == user_id)

        result = await session.execute(query)
        team = result.scalar_one_or_none()

        if not team:
            raise NotFoundError(f"Fantasy team {team_id} not found")

        return team

    @staticmethod
    async def get_user_teams(
        session: AsyncSession,
        user_id: int | None,
        league_id: int | None = None,
    ) -> list[FantasyTeam]:
        """Get all fantasy teams for a user, optionally filtered by league.

        Args:
            session: Database session
            user_id: ID of the user (None to get all teams in league)
            league_id: Optional league ID to filter by

        Returns:
            List of FantasyTeam instances
        """
        query = select(FantasyTeam)

        if user_id is not None:
            query = query.where(FantasyTeam.user_id == user_id)

        if league_id is not None:
            query = query.where(FantasyTeam.league_id == league_id)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def add_driver_pick(
        session: AsyncSession,
        team_id: int,
        driver_id: int,
        race_id: int,
        pick_number: int = 1,
    ) -> TeamPick:
        """Add a driver pick to a fantasy team.

        Args:
            session: Database session
            team_id: ID of the fantasy team
            driver_id: ID of the driver to pick
            race_id: ID of the race
            pick_number: Pick number (1-5 for 5 driver slots)

        Returns:
            Created TeamPick instance

        Raises:
            NotFoundError: If team, driver, or race not found
            ValidationError: If pick number is invalid or already used
        """
        # Validate pick number
        if not 1 <= pick_number <= 5:
            raise ValidationError("Pick number must be between 1 and 5")

        # Check if team exists
        await FantasyTeamService.get_team(session, team_id)

        # Check if driver exists
        driver_query = select(Driver).where(Driver.id == driver_id)
        result = await session.execute(driver_query)
        driver = result.scalar_one_or_none()

        if not driver:
            raise NotFoundError(f"Driver {driver_id} not found")

        # Check if race exists
        race_query = select(Race).where(Race.id == race_id)
        result = await session.execute(race_query)
        race = result.scalar_one_or_none()

        if not race:
            raise NotFoundError(f"Race {race_id} not found")

        # Check if driver already picked for this team and race
        existing_query = select(TeamPick).where(
            and_(
                TeamPick.fantasy_team_id == team_id,
                TeamPick.race_id == race_id,
                TeamPick.pick_type == "driver",
                TeamPick.driver_id == driver_id,
            )
        )
        result = await session.execute(existing_query)
        existing_pick = result.scalar_one_or_none()

        if existing_pick:
            raise ValidationError(f"Driver {driver_id} already picked for this team and race")

        # Create the driver pick
        pick = TeamPick(
            fantasy_team_id=team_id,
            driver_id=driver_id,
            pick_type="driver",
            points_earned=0,
            race_id=race_id,
            is_active=True,
        )

        session.add(pick)
        await session.commit()
        await session.refresh(pick)

        return pick

    @staticmethod
    async def add_constructor_pick(
        session: AsyncSession,
        team_id: int,
        constructor_id: int,
        race_id: int,
    ) -> TeamPick:
        """Add a constructor pick to a fantasy team.

        Args:
            session: Database session
            team_id: ID of the fantasy team
            constructor_id: ID of the constructor to pick
            race_id: ID of the race

        Returns:
            Created TeamPick instance

        Raises:
            NotFoundError: If team, constructor, or race not found
            ValidationError: If team already has a constructor for this race
        """
        # Check if team exists
        await FantasyTeamService.get_team(session, team_id)

        # Check if constructor exists
        constructor_query = select(Constructor).where(Constructor.id == constructor_id)
        result = await session.execute(constructor_query)
        constructor = result.scalar_one_or_none()

        if not constructor:
            raise NotFoundError(f"Constructor {constructor_id} not found")

        # Check if race exists
        race_query = select(Race).where(Race.id == race_id)
        result = await session.execute(race_query)
        race = result.scalar_one_or_none()

        if not race:
            raise NotFoundError(f"Race {race_id} not found")

        # Check if team already has a constructor for this race
        existing_query = select(TeamPick).where(
            and_(
                TeamPick.fantasy_team_id == team_id,
                TeamPick.race_id == race_id,
                TeamPick.pick_type == "constructor",
            )
        )
        result = await session.execute(existing_query)
        existing_pick = result.scalar_one_or_none()

        if existing_pick:
            raise ValidationError("Team already has a constructor pick for this race")

        # Create the constructor pick
        pick = TeamPick(
            fantasy_team_id=team_id,
            constructor_id=constructor_id,
            pick_type="constructor",
            points_earned=0,
            race_id=race_id,
            is_active=True,
        )

        session.add(pick)
        await session.commit()
        await session.refresh(pick)

        return pick

    @staticmethod
    async def get_team_picks(
        session: AsyncSession,
        team_id: int,
        race_id: int | None = None,
        pick_type: str | None = None,
    ) -> list[TeamPick]:
        """Get all picks for a fantasy team, optionally filtered by race and type.

        Args:
            session: Database session
            team_id: ID of the fantasy team
            race_id: Optional race ID to filter by
            pick_type: Optional pick type to filter by ("driver" or "constructor")

        Returns:
            List of TeamPick instances
        """
        query = select(TeamPick).where(
            and_(
                TeamPick.fantasy_team_id == team_id,
                TeamPick.is_active,
            )
        )

        if race_id is not None:
            query = query.where(TeamPick.race_id == race_id)

        if pick_type is not None:
            query = query.where(TeamPick.pick_type == pick_type)

        query = query.order_by(TeamPick.pick_type)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def remove_pick(
        session: AsyncSession,
        pick_id: int,
        team_id: int,
    ) -> None:
        """Remove/deactivate a pick from a fantasy team.

        Args:
            session: Database session
            pick_id: ID of the pick to remove
            team_id: ID of the fantasy team (for ownership validation)

        Raises:
            NotFoundError: If pick not found
            ValidationError: If pick doesn't belong to the team
        """
        query = select(TeamPick).where(TeamPick.id == pick_id)
        result = await session.execute(query)
        pick = result.scalar_one_or_none()

        if not pick:
            raise NotFoundError(f"Pick {pick_id} not found")

        if pick.fantasy_team_id != team_id:
            raise ValidationError("Pick does not belong to this team")

        # Deactivate rather than delete for audit trail
        pick.is_active = False
        await session.commit()

    @staticmethod
    async def update_pick(
        session: AsyncSession,
        pick_id: int,
        team_id: int,
        driver_id: int | None = None,
        constructor_id: int | None = None,
    ) -> TeamPick:
        """Update a pick (change driver or constructor).

        Args:
            session: Database session
            pick_id: ID of the pick to update
            team_id: ID of the fantasy team (for ownership validation)
            driver_id: New driver ID (for driver picks)
            constructor_id: New constructor ID (for constructor picks)

        Returns:
            Updated TeamPick instance

        Raises:
            NotFoundError: If pick not found
            ValidationError: If invalid update or pick doesn't belong to team
        """
        query = select(TeamPick).where(TeamPick.id == pick_id)
        result = await session.execute(query)
        pick = result.scalar_one_or_none()

        if not pick:
            raise NotFoundError(f"Pick {pick_id} not found")

        if pick.fantasy_team_id != team_id:
            raise ValidationError("Pick does not belong to this team")

        # Update based on pick type
        if pick.pick_type == "driver" and driver_id is not None:
            # Validate driver exists
            driver_query = select(Driver).where(Driver.id == driver_id)
            result = await session.execute(driver_query)
            driver = result.scalar_one_or_none()

            if not driver:
                raise NotFoundError(f"Driver {driver_id} not found")

            pick.driver_id = driver_id
        elif pick.pick_type == "constructor" and constructor_id is not None:
            # Validate constructor exists
            constructor_query = select(Constructor).where(Constructor.id == constructor_id)
            result = await session.execute(constructor_query)
            constructor = result.scalar_one_or_none()

            if not constructor:
                raise NotFoundError(f"Constructor {constructor_id} not found")

            pick.constructor_id = constructor_id
        else:
            raise ValidationError("Invalid update for this pick type")

        await session.commit()
        await session.refresh(pick)

        return pick

    @staticmethod
    async def calculate_team_points_for_race(
        session: AsyncSession,
        team_id: int,
        race_id: int,
    ) -> dict[str, int]:
        """Calculate total fantasy points for a team in a specific race.

        Args:
            session: Database session
            team_id: ID of the fantasy team
            race_id: ID of the race

        Returns:
            Dictionary with points breakdown
        """
        return await ScoringService.calculate_team_points(session, race_id, team_id)

    @staticmethod
    async def update_team_points(
        session: AsyncSession,
        team_id: int,
    ) -> int:
        """Recalculate and update total points for a team across all races.

        Args:
            session: Database session
            team_id: ID of the fantasy team

        Returns:
            Updated total points
        """
        return await ScoringService.recalculate_team_points(session, team_id)

    @staticmethod
    async def delete_team(
        session: AsyncSession,
        team_id: int,
        user_id: int | None = None,
    ) -> None:
        """Delete a fantasy team (deactivate it).

        Args:
            session: Database session
            team_id: ID of the team to delete
            user_id: Optional user ID to verify ownership

        Raises:
            NotFoundError: If team not found
        """
        team = await FantasyTeamService.get_team(session, team_id, user_id)

        # Deactivate rather than delete for audit trail
        team.is_active = False
        await session.commit()
