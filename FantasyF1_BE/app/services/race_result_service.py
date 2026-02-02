"""Race Result service for managing race results."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.race import Race
from app.models.race_result import RaceResult
from app.schemas.race_result import RaceResultListResponse, RaceResultResponse


class RaceResultService:
    """Service for race result operations."""

    def __init__(self, db: AsyncSession):
        """Initialize service with database session."""
        self.db = db

    async def get_race_results(self, race_id: int) -> RaceResultListResponse:
        """Get all race results for a specific race.

        Args:
            race_id: The ID of the race to get results for.

        Returns:
            RaceResultListResponse containing the results.

        Raises:
            NotFoundError: If the race doesn't exist.
        """
        # First verify the race exists
        race_result = await self.db.execute(select(Race).where(Race.id == race_id))
        race = race_result.scalar_one_or_none()

        if race is None:
            raise NotFoundError("Race", race_id)

        # Get all results ordered by position (DNF at the end)
        result = await self.db.execute(
            select(RaceResult)
            .where(RaceResult.race_id == race_id)
            .order_by(
                RaceResult.dnf.asc(), RaceResult.position.asc()  # Non-DNF first  # Then by position
            )
        )
        race_results = result.scalars().all()

        # Convert to response schemas with computed fields
        results_list = []
        for rr in race_results:
            # Calculate position change
            position_change = None
            if rr.grid_position and rr.position and rr.position > 0:
                position_change = rr.grid_position - rr.position

            result_response = RaceResultResponse(
                id=rr.id,
                race_id=rr.race_id,
                driver_external_id=rr.driver_external_id,
                driver_name=rr.driver_name,
                position=rr.position,
                grid_position=rr.grid_position,
                laps_completed=rr.laps_completed,
                points_earned=rr.points_earned,
                fastest_lap=rr.fastest_lap,
                fastest_lap_time=rr.fastest_lap_time,
                time_diff=rr.time_diff,
                time_diff_str=rr.time_diff_str,
                dnf=rr.dnf,
                dnf_reason=rr.dnf_reason,
                dns=rr.dns,
                dsq=rr.dsq,
                created_at=rr.created_at,
                updated_at=rr.updated_at,
                position_change=position_change,
            )
            results_list.append(result_response)

        return RaceResultListResponse(
            results=results_list,
            race_id=race_id,
            race_name=race.name,
            total_results=len(results_list),
        )

    async def get_result_by_id(self, result_id: int) -> RaceResultResponse:
        """Get a specific race result by ID.

        Args:
            result_id: The ID of the race result.

        Returns:
            RaceResultResponse for the result.

        Raises:
            NotFoundError: If the result doesn't exist.
        """
        result = await self.db.execute(select(RaceResult).where(RaceResult.id == result_id))
        race_result = result.scalar_one_or_none()

        if race_result is None:
            raise NotFoundError("Race Result", result_id)

        # Calculate position change
        position_change = None
        if race_result.grid_position and race_result.position and race_result.position > 0:
            position_change = race_result.grid_position - race_result.position

        return RaceResultResponse(
            id=race_result.id,
            race_id=race_result.race_id,
            driver_external_id=race_result.driver_external_id,
            driver_name=race_result.driver_name,
            position=race_result.position,
            grid_position=race_result.grid_position,
            laps_completed=race_result.laps_completed,
            points_earned=race_result.points_earned,
            fastest_lap=race_result.fastest_lap,
            fastest_lap_time=race_result.fastest_lap_time,
            time_diff=race_result.time_diff,
            time_diff_str=race_result.time_diff_str,
            dnf=race_result.dnf,
            dnf_reason=race_result.dnf_reason,
            dns=race_result.dns,
            dsq=race_result.dsq,
            created_at=race_result.created_at,
            updated_at=race_result.updated_at,
            position_change=position_change,
        )
