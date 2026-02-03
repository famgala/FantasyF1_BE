"""Service layer for Driver operations.

Provides read-only access to driver data for the F1 Fantasy game.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.logging import get_logger
from app.models.driver import Driver
from app.models.race import Race
from app.models.race_result import RaceResult
from app.schemas.driver import (
    DriverCreate,
    DriverPerformanceResponse,
    DriverPerformanceStats,
    DriverRaceResult,
    DriverUpdate,
)

logger = get_logger(__name__)


class DriverService:
    """Service for Driver CRUD operations.

    This is a read-only service for driver data that comes from
    the external Jolpica API. Drivers are synced periodically.
    """

    @staticmethod
    async def get_by_id(db: AsyncSession, driver_id: int) -> Driver | None:
        """Get a driver by ID.

        Args:
            db: Database session
            driver_id: Driver ID

        Returns:
            Driver object or None if not found
        """
        result = await db.execute(select(Driver).where(Driver.id == driver_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_external_id(db: AsyncSession, external_id: int) -> Driver | None:
        """Get a driver by external API ID.

        Args:
            db: Database session
            external_id: External driver ID from Jolpica API

        Returns:
            Driver object or None if not found
        """
        result = await db.execute(select(Driver).where(Driver.external_id == external_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_name(db: AsyncSession, name: str) -> Driver | None:
        """Get a driver by name.

        Args:
            db: Database session
            name: Driver name

        Returns:
            Driver object or None if not found
        """
        result = await db.execute(select(Driver).where(Driver.name == name))
        return result.scalars().first()

    @staticmethod
    async def get_by_code(db: AsyncSession, code: str) -> Driver | None:
        """Get a driver by their three-letter code.

        Args:
            db: Database session
            code: Three-letter driver code (e.g., VER, HAM)

        Returns:
            Driver object or None if not found
        """
        result = await db.execute(select(Driver).where(Driver.code == code))
        return result.scalars().first()

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
    ) -> list[Driver]:
        """Get all drivers with optional filtering and pagination.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by status (active, retired, etc.)

        Returns:
            List of Driver objects
        """
        query = select(Driver)

        if status:
            query = query.where(Driver.status == status)

        query = query.order_by(Driver.name).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def search(
        db: AsyncSession,
        search_term: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Driver]:
        """Search drivers by name.

        Args:
            db: Database session
            search_term: Search term for driver name
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of matching Driver objects
        """
        query = select(Driver).where(Driver.name.ilike(f"%{search_term}%"))
        query = query.order_by(Driver.name).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count(db: AsyncSession, status: str | None = None) -> int:
        """Count drivers with optional filtering.

        Args:
            db: Database session
            status: Filter by status

        Returns:
            Count of drivers
        """
        query = select(Driver)

        if status:
            query = query.where(Driver.status == status)

        result = await db.execute(query)
        return len(result.scalars().all())

    @staticmethod
    async def create(db: AsyncSession, driver_data: DriverCreate) -> Driver:
        """Create a new driver record.

        Args:
            db: Database session
            driver_data: Driver creation data

        Returns:
            Created Driver object
        """
        logger.info(f"Creating driver: {driver_data.name} (external_id: {driver_data.external_id})")

        driver = Driver(**driver_data.model_dump())
        db.add(driver)
        await db.commit()
        await db.refresh(driver)

        logger.info(f"Driver created: {driver.id} - {driver.name}")
        return driver

    @staticmethod
    async def update(db: AsyncSession, driver: Driver, driver_data: DriverUpdate) -> Driver:
        """Update an existing driver record.

        Args:
            db: Database session
            driver: Driver object to update
            driver_data: Driver update data

        Returns:
            Updated Driver object
        """
        logger.info(f"Updating driver: {driver.id} - {driver.name}")

        update_data = driver_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(driver, field, value)

        await db.commit()
        await db.refresh(driver)

        logger.info(f"Driver updated: {driver.id} - {driver.name}")
        return driver

    @staticmethod
    async def delete(db: AsyncSession, driver: Driver) -> None:
        """Delete a driver record.

        Args:
            db: Database session
            driver: Driver object to delete
        """
        logger.info(f"Deleting driver: {driver.id} - {driver.name}")

        await db.delete(driver)
        await db.commit()

        logger.info(f"Driver deleted: {driver.id} - {driver.name}")

    @staticmethod
    async def update_or_create(
        db: AsyncSession,
        external_id: int,
        driver_data: DriverCreate,
    ) -> Driver:
        """Update driver if exists by external_id, otherwise create new.

        Args:
            db: Database session
            external_id: External driver ID from Jolpica API
            driver_data: Driver data

        Returns:
            Created or updated Driver object
        """
        existing = await DriverService.get_by_external_id(db, external_id)

        if existing:
            # Update existing driver with new data
            update_data = DriverUpdate(
                team_name=driver_data.team_name,
                number=driver_data.number,
                price=driver_data.price,
                status=driver_data.status,
                total_points=0,
                average_points=0.0,
            )
            return await DriverService.update(db, existing, update_data)
        else:
            # Create new driver
            return await DriverService.create(db, driver_data)

    @staticmethod
    async def get_driver_performance(db: AsyncSession, driver_id: int) -> DriverPerformanceResponse:
        """Get performance data for a driver across all races.

        Args:
            db: Database session
            driver_id: Driver ID

        Returns:
            DriverPerformanceResponse with race results and statistics

        Raises:
            NotFoundError: If the driver doesn't exist
        """
        # First get the driver
        driver = await DriverService.get_by_id(db, driver_id)
        if driver is None:
            raise NotFoundError("Driver", {"driver_id": driver_id})

        # Get all race results for this driver (joined with race data)
        result = await db.execute(
            select(RaceResult, Race)
            .join(Race, RaceResult.race_id == Race.id)
            .where(RaceResult.driver_external_id == driver.external_id)
            .order_by(Race.round_number.asc())
        )

        race_data = result.all()

        # Build race results list
        race_results = []
        for race_result, race in race_data:
            race_results.append(
                DriverRaceResult(
                    race_id=race.id,
                    race_name=race.name,
                    round_number=race.round_number,
                    race_date=race.race_date,
                    position=race_result.position,
                    grid_position=race_result.grid_position,
                    points_earned=race_result.points_earned,
                    fastest_lap=race_result.fastest_lap,
                    dnf=race_result.dnf,
                    dnf_reason=race_result.dnf_reason,
                )
            )

        # Calculate statistics
        total_points = sum(rr.points_earned for rr in race_results)
        races_count = len(race_results)
        races_finished = sum(1 for rr in race_results if not rr.dnf)
        dnf_count = sum(1 for rr in race_results if rr.dnf)

        # Best and worst finish (only for finished races with position > 0)
        finished_positions = [rr.position for rr in race_results if not rr.dnf and rr.position > 0]
        best_finish = min(finished_positions) if finished_positions else None
        worst_finish = max(finished_positions) if finished_positions else None

        # Podium count (positions 1-3)
        podium_count = sum(1 for rr in race_results if not rr.dnf and rr.position <= 3)

        # Average points per race (only counting finished races)
        avg_points_per_race = total_points / races_finished if races_finished > 0 else 0.0

        stats = DriverPerformanceStats(
            total_points=total_points,
            avg_points_per_race=round(avg_points_per_race, 1),
            races_finished=races_finished,
            races_count=races_count,
            best_finish=best_finish,
            worst_finish=worst_finish,
            podium_count=podium_count,
            dnf_count=dnf_count,
        )

        return DriverPerformanceResponse(
            driver_id=driver.id,
            driver_name=driver.name,
            driver_code=driver.code,
            stats=stats,
            race_results=race_results,
        )
