"""Scoring service for F1 Fantasy game.

This service handles the calculation of fantasy points based on race results
according to the F1 Fantasy scoring rules.
"""

from typing import Any, ClassVar

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.race_result import RaceResult


class ScoringService:
    """Service for calculating fantasy points based on race results."""

    # F1 Championship points for positions 1-10
    F1_POINTS: ClassVar[dict[int, int]] = {
        1: 25,
        2: 18,
        3: 15,
        4: 12,
        5: 10,
        6: 8,
        7: 6,
        8: 4,
        9: 2,
        10: 1,
    }

    # Fantasy game additional points
    FASTEST_LAP_POINTS: ClassVar[int] = 1
    POLE_POSITION_POINTS: ClassVar[int] = 2

    @staticmethod
    def calculate_driver_points(
        race_result: RaceResult,
        grid_position: int | None = None,
    ) -> int:
        """Calculate fantasy points for a driver based on race result.

        Args:
            race_result: The race result containing driver performance
            grid_position: Starting position on grid (if available)

        Returns:
            Total fantasy points earned by the driver
        """
        points = 0

        # Base points from finishing position
        if race_result.position in ScoringService.F1_POINTS:
            points += ScoringService.F1_POINTS[race_result.position]

        # Fastest lap bonus
        if race_result.fastest_lap:
            points += ScoringService.FASTEST_LAP_POINTS

        # Pole position bonus (if grid position provided)
        if grid_position == 1:
            points += ScoringService.POLE_POSITION_POINTS

        return points

    @staticmethod
    async def calculate_team_points(
        session: AsyncSession,
        race_id: int,
        fantasy_team_id: int,
    ) -> dict[str, int]:
        """Calculate total fantasy points for a team in a specific race.

        Args:
            session: Database session
            race_id: ID of the race
            fantasy_team_id: ID of the fantasy team

        Returns:
            Dictionary with points breakdown:
            {
                'total_points': int,
                'driver_points': int,
                'constructor_points': int,
                'bonuses': int
            }
        """
        from sqlalchemy import select

        from app.models.fantasy_team import TeamPick  # type: ignore[attr-defined]
        from app.models.race_result import RaceResult

        # Get all team picks for this team and race
        picks_query = select(TeamPick).where(
            TeamPick.fantasy_team_id == fantasy_team_id,
            TeamPick.race_id == race_id,
            TeamPick.is_active,
        )
        result = await session.execute(picks_query)
        picks = result.scalars().all()

        driver_points = 0
        constructor_points = 0
        bonuses = 0

        for pick in picks:
            # Get race result for this pick
            if pick.pick_type == "driver" and pick.driver_id:
                race_result_query = select(RaceResult).where(
                    RaceResult.race_id == race_id,
                    RaceResult.driver_external_id == pick.driver_id,
                )
                result = await session.execute(race_result_query)
                race_result = result.scalar_one_or_none()

                if race_result:
                    points = ScoringService.calculate_driver_points(race_result)  # type: ignore[arg-type]
                    driver_points += points

            elif pick.pick_type == "constructor":
                # Constructor points are calculated differently
                # Sum of points from both drivers of that constructor
                # This would need to be implemented based on business rules
                pass

        total_points = driver_points + constructor_points + bonuses

        return {
            "total_points": total_points,
            "driver_points": driver_points,
            "constructor_points": constructor_points,
            "bonuses": bonuses,
        }

    @staticmethod
    async def calculate_league_standings(
        session: AsyncSession,
        league_id: int,
        _race_id: int | None = None,
    ) -> list[dict[str, Any]]:
        """Calculate league standings for all teams.

        Args:
            session: Database session
            league_id: ID of the league
            race_id: Optional race ID to calculate standings for specific race only

        Returns:
            List of team standings sorted by total points
        """
        from sqlalchemy import desc, select

        from app.models.fantasy_team import FantasyTeam

        # Get all fantasy teams in the league
        teams_query = (
            select(FantasyTeam)
            .where(
                FantasyTeam.league_id == league_id,
                FantasyTeam.is_active,
            )
            .order_by(desc(FantasyTeam.total_points))
        )

        result = await session.execute(teams_query)
        teams = result.scalars().all()

        standings = []
        for rank, team in enumerate(teams, start=1):
            standings.append(
                {
                    "rank": rank,
                    "team_id": team.id,
                    "team_name": team.name,
                    "user_id": team.user_id,
                    "total_points": team.total_points,
                    "budget_remaining": team.budget_remaining,
                }
            )

        return standings

    @staticmethod
    def calculate_overtake_points(
        grid_position: int,
        finish_position: int,
    ) -> int:
        """Calculate overtaking points (positions gained from start to finish).

        Args:
            grid_position: Starting position on the grid
            finish_position: Final finishing position

        Returns:
            Points earned from overtaking (1 point per position gained)
        """
        positions_gained = grid_position - finish_position
        return max(0, positions_gained)

    @staticmethod
    def calculate_consistency_bonus(
        recent_positions: list[int],
    ) -> int:
        """Calculate consistency bonus for consistent performance.

        Args:
            recent_positions: List of recent finishing positions

        Returns:
            Bonus points for consistency
        """
        if len(recent_positions) < 3:
            return 0

        # Calculate variance in positions
        avg_position = sum(recent_positions) / len(recent_positions)
        variance = sum((pos - avg_position) ** 2 for pos in recent_positions) / len(
            recent_positions
        )

        # Bonus points for low variance (consistent performance)
        if variance < 2.0:  # Very consistent (average variance < 2 positions)
            return 3
        elif variance < 4.0:  # Consistent
            return 2
        elif variance < 6.0:  # Somewhat consistent
            return 1
        else:
            return 0

    @staticmethod
    async def recalculate_team_points(
        session: AsyncSession,
        team_id: int,
    ) -> int:
        """Recalculate total points for a team across all races.

        Args:
            session: Database session
            team_id: ID of the fantasy team

        Returns:
            Total points across all races
        """
        from sqlalchemy import select

        from app.models.fantasy_team import FantasyTeam, TeamPick  # type: ignore[attr-defined]
        from app.models.race_result import RaceResult

        # Get all active picks for the team
        picks_query = select(TeamPick).where(
            TeamPick.fantasy_team_id == team_id,
            TeamPick.is_active,
        )
        result = await session.execute(picks_query)
        picks = result.scalars().all()

        total_points = 0
        groups: dict[str, list[TeamPick]] = {"driver_id": [], "constructor_id": []}

        # Group picks by type
        for pick in picks:
            if pick.pick_type == "driver" and pick.driver_id:
                groups["driver_id"].append(pick)
            elif pick.pick_type == "constructor" and pick.constructor_id:
                groups["constructor_id"].append(pick)

        # Calculate points for all picks
        for pick in groups["driver_id"]:
            race_result_query = select(RaceResult).where(
                RaceResult.race_id == pick.race_id,
                RaceResult.driver_external_id == pick.driver_id,
            )
            result = await session.execute(race_result_query)
            race_result = result.scalar_one_or_none()

            if race_result:
                points = ScoringService.calculate_driver_points(race_result)  # type: ignore[arg-type]
                total_points += points

        # Update team total points
        team_query = select(FantasyTeam).where(FantasyTeam.id == team_id)
        result = await session.execute(team_query)
        team = result.scalar_one_or_none()

        if team:
            team.total_points = total_points  # type: ignore[attr-defined]
            await session.commit()

        return total_points

    @staticmethod
    def get_position_points(position: int) -> int:
        """Get F1 points for a given finishing position.

        Args:
            position: Finishing position (1-10)

        Returns:
            Points earned for that position
        """
        return ScoringService.F1_POINTS.get(position, 0)

    @staticmethod
    def get_points_structure() -> dict[int, int]:
        """Get the complete F1 points structure.

        Returns:
            Dictionary mapping positions to points
        """
        return ScoringService.F1_POINTS.copy()
