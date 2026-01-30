"""Service for calculating F1 Fantasy scoring.

This service handles all scoring calculations including:
- Driver points per race
- Constructor points per league
- Team total points
- League-specific scoring rules
"""

import json
from typing import TYPE_CHECKING, ClassVar

from sqlalchemy.orm import Session

from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.models.constructor import Constructor
    from app.models.fantasy_team import FantasyTeam
    from app.models.league import League
    from app.models.race import Race
    from app.models.race_result import RaceResult

logger = get_logger(__name__)


class ScoringService:
    """Service for F1 Fantasy scoring calculations."""

    # Standard F1 scoring system (2024+)
    F1_SCORING: ClassVar[dict[str, int]] = {
        "1": 25,
        "2": 18,
        "3": 15,
        "4": 12,
        "5": 10,
        "6": 8,
        "7": 6,
        "8": 4,
        "9": 2,
        "10": 1,
    }

    # Bonus points
    FASTEST_LAP_BONUS: ClassVar[int] = 1
    QUALIFYING_POLE = 0  # Not used in current system

    @staticmethod
    def get_position_points(position: int, scoring_rules: dict[str, int] | None = None) -> int:
        """Get points for finishing position.

        Args:
            position: Race finishing position (1-based)
            scoring_rules: Custom scoring rules (defaults to F1 standard)

        Returns:
            Points earned for this position

        Examples:
            >>> ScoringService.get_position_points(1)
            25
            >>> ScoringService.get_position_points(5)
            10
            >>> ScoringService.get_position_points(11)
            0
        """
        rules = scoring_rules or ScoringService.F1_SCORING
        return rules.get(str(position), 0)

    @staticmethod
    def calculate_driver_points(
        race_result: "RaceResult",
        _scoring_rules: dict[str, int] | None = None,
    ) -> int:
        """Calculate total points for a driver in a single race.

        Args:
            race_result: RaceResult object with race data
            _scoring_rules: Custom scoring rules (unused currently, reserved for future)

        Returns:
            Total points earned by the driver in this race

        Examples:
            >>> result = RaceResult(position=1, fastest_lap=True, dnf=False)
            >>> ScoringService.calculate_driver_points(result)
            26
        """
        if race_result.dnf or race_result.dns or race_result.dsq:
            return race_result.points_earned or 0

        points = race_result.points_earned or 0

        # Add fastest lap bonus
        if race_result.fastest_lap:
            points += ScoringService.FASTEST_LAP_BONUS

        return points

    @staticmethod
    def calculate_constructor_points(
        race: "Race",
        constructor_id: int,
        db: Session,
        scoring_rules: dict[str, int] | None = None,
    ) -> int:
        """Calculate total points for a constructor in a single race.

        Args:
            race: Race object
            constructor_id: Constructor ID
            db: Database session
            scoring_rules: Custom scoring rules (defaults to F1 standard)

        Returns:
            Total points earned by the constructor's drivers in this race
        """
        from app.models.constructor import Constructor
        from app.models.driver import Driver
        from app.models.race_result import RaceResult

        constructor = db.get(Constructor, constructor_id)
        if not constructor:
            return 0

        # Get all drivers for this constructor (using team_name match)
        drivers = (
            db.query(Driver).filter(Driver.team_name.ilike(f"%{constructor.team_name}%")).all()
        )

        if not drivers:
            return 0

        total_points = 0

        for driver in drivers:
            # Get race result for this driver
            result = (
                db.query(RaceResult)
                .filter(
                    RaceResult.race_id == race.id,
                    RaceResult.driver_external_id == driver.external_id,
                )
                .first()
            )

            if result:
                total_points += ScoringService.calculate_driver_points(result, scoring_rules)

        return total_points

    @staticmethod
    def parse_league_scoring(league: "League") -> dict[str, int] | None:
        """Parse league scoring settings from JSON string.

        Args:
            league: League object with scoring_settings field

        Returns:
            Parsed scoring rules as dict, or None if not set
        """
        if not league.scoring_settings:
            return None

        try:
            result = json.loads(league.scoring_settings)
            if isinstance(result, dict):
                # Ensure all values are integers
                return {str(k): int(v) for k, v in result.items()}
            return None
        except (json.JSONDecodeError, TypeError, ValueError):
            return None

    @staticmethod
    def calculate_league_constructor_points(
        league: "League",
        race: "Race",
        constructor: "Constructor",
        db: Session,
    ) -> int:
        """Calculate constructor points for a specific league.

        Args:
            league: League object (contains custom scoring settings)
            race: Race object
            constructor: Constructor object
            db: Database session

        Returns:
            Constructor points based on league's scoring rules
        """
        # Get league-specific scoring rules if any
        scoring_rules = ScoringService.parse_league_scoring(league)

        return ScoringService.calculate_constructor_points(race, constructor.id, db, scoring_rules)

    @staticmethod
    def calculate_team_points(
        team: "FantasyTeam",
        race: "Race",
        db: Session,
    ) -> int:
        """Calculate total points for a fantasy team in a single race.

        Args:
            team: FantasyTeam object
            race: Race object
            db: Database session

        Returns:
            Total points earned by the team in this race
        """
        from app.models.driver import Driver
        from app.models.fantasy_team import TeamPick
        from app.models.race_result import RaceResult

        total_points = 0

        # Get active picks for this race
        picks = (
            db.query(TeamPick)
            .filter(
                TeamPick.fantasy_team_id == team.id,
                TeamPick.race_id == race.id,
                TeamPick.is_active.is_(True),
            )
            .all()
        )

        for pick in picks:
            if pick.pick_type == "driver":
                # Get driver and then race result
                driver = db.get(Driver, pick.driver_id)
                if driver:
                    result = (
                        db.query(RaceResult)
                        .filter(
                            RaceResult.race_id == race.id,
                            RaceResult.driver_external_id == driver.external_id,
                        )
                        .first()
                    )

                    if result:
                        total_points += ScoringService.calculate_driver_points(result)

            elif pick.pick_type == "constructor":
                if pick.constructor_id is not None:
                    constructor_points = ScoringService.calculate_constructor_points(
                        race, pick.constructor_id, db
                    )
                    total_points += constructor_points

        return total_points

    @staticmethod
    def determine_race_winner(race: "Race", db: Session) -> int | None:
        """Determine which constructor won the race.

        The winning constructor is the one with the highest total points
        from both drivers in the race.

        Args:
            race: Race object
            db: Database session

        Returns:
            Constructor ID of the race winner, or None if no winner
        """
        from app.models.constructor import Constructor

        constructors = db.query(Constructor).all()

        if not constructors:
            return None

        best_constructor_id = None
        best_points = -1

        for constructor in constructors:
            points = ScoringService.calculate_constructor_points(race, constructor.id, db)

            if points > best_points:
                best_points = points
                best_constructor_id = constructor.id

        return best_constructor_id

    @staticmethod
    def update_season_constructor_points(db: Session) -> dict[int, int]:
        """Update constructor championship standings for the entire season.

        Args:
            db: Database session

        Returns:
            Dictionary mapping constructor IDs to season points
        """
        from app.models.constructor import Constructor
        from app.models.race import Race

        # Get all completed races
        completed_races = db.query(Race).filter(Race.status == "completed").all()

        # Reset all constructor points
        constructors = db.query(Constructor).all()
        constructor_points: dict[int, int] = {}

        for constructor in constructors:
            constructor_points[constructor.id] = 0
            constructor.current_points = 0

        # Calculate points for each race
        for race in completed_races:
            # Determine race winner
            winner_id = ScoringService.determine_race_winner(race, db)
            if winner_id:
                race.winning_constructor_id = winner_id

            # Add points for each constructor
            for constructor in constructors:
                points = ScoringService.calculate_constructor_points(race, constructor.id, db)
                constructor_points[constructor.id] += points
                constructor.current_points = constructor_points[constructor.id]

        db.commit()
        logger.info(f"Updated season constructor points for {len(constructors)} constructors")

        return constructor_points

    @staticmethod
    def get_constructor_standings(db: Session) -> list[tuple[int, int]]:
        """Get current constructor championship standings.

        Args:
            db: Database session

        Returns:
            List of (constructor_id, points) tuples sorted by points descending
        """
        from app.models.constructor import Constructor

        standings = (
            db.query(Constructor.id, Constructor.current_points)
            .order_by(Constructor.current_points.desc())
            .all()
        )

        return [(row.id, row.current_points) for row in standings]

    @staticmethod
    def get_driver_standings(db: Session, race_id: int) -> list[tuple[str, int]]:
        """Get driver championship standings for a race.

        Args:
            db: Database session
            race_id: Race ID

        Returns:
            List of (driver_name, points) tuples sorted by points descending
        """
        from app.models.race_result import RaceResult

        standings = (
            db.query(RaceResult.driver_name, RaceResult.points_earned)
            .filter(RaceResult.race_id == race_id)
            .order_by(RaceResult.points_earned.desc())
            .all()
        )

        return [(row.driver_name, row.points_earned) for row in standings]
