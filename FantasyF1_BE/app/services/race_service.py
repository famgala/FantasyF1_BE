"""Service layer for Race operations.

Provides read-only access to race data for the F1 Fantasy game.
"""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.race import Race
from app.schemas.race import RaceCreate, RaceUpdate

logger = get_logger(__name__)


class RaceService:
    """Service for Race CRUD operations.

    This is a read-only service for race data that comes from
    the external Jolpica API. Races are synced periodically.
    """

    @staticmethod
    async def get(db: AsyncSession, race_id: int) -> Race:
        """Get a race by ID.

        Args:
            db: Database session
            race_id: Race ID

        Returns:
            Race object

        Raises:
            NotFoundError: If race not found
        """
        result = await db.execute(select(Race).where(Race.id == race_id))
        race = result.scalars().first()
        if race is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Race not found")
        return race

    @staticmethod
    async def get_by_id(db: AsyncSession, race_id: int) -> Race | None:
        """Get a race by ID.

        Args:
            db: Database session
            race_id: Race ID

        Returns:
            Race object or None if not found
        """
        result = await db.execute(select(Race).where(Race.id == race_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_external_id(db: AsyncSession, external_id: int) -> Race | None:
        """Get a race by external API ID.

        Args:
            db: Database session
            external_id: External race ID from Jolpica API

        Returns:
            Race object or None if not found
        """
        result = await db.execute(select(Race).where(Race.external_id == external_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_round(db: AsyncSession, round_number: int) -> Race | None:
        """Get a race by round number.

        Args:
            db: Database session
            round_number: Race round number

        Returns:
            Race object or None if not found
        """
        result = await db.execute(select(Race).where(Race.round_number == round_number))
        return result.scalars().first()

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
        country: str | None = None,
    ) -> list[Race]:
        """Get all races with optional filtering and pagination.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by status (upcoming, completed, cancelled)
            country: Filter by country

        Returns:
            List of Race objects
        """
        query = select(Race)

        if status:
            query = query.where(Race.status == status)

        if country:
            query = query.where(Race.country.ilike(f"%{country}%"))

        query = query.order_by(Race.round_number).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_upcoming(db: AsyncSession, limit: int = 10) -> list[Race]:
        """Get upcoming races sorted by date.

        Args:
            db: Database session
            limit: Maximum number of races to return

        Returns:
            List of upcoming Race objects
        """
        query = select(Race).where(Race.status == "upcoming", Race.race_date >= datetime.utcnow())
        query = query.order_by(Race.race_date).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_completed(
        db: AsyncSession,
        limit: int = 10,
    ) -> list[Race]:
        """Get completed races sorted by date descending.

        Args:
            db: Database session
            limit: Maximum number of races to return

        Returns:
            List of completed Race objects
        """
        query = select(Race).where(Race.status == "completed")
        query = query.order_by(Race.race_date.desc()).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_date_range(
        db: AsyncSession,
        start_date: datetime,
        end_date: datetime,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Race]:
        """Get races in a date range.

        Args:
            db: Database session
            start_date: Start of date range
            end_date: End of date range
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of Race objects in date range
        """
        query = select(Race).where(Race.race_date >= start_date, Race.race_date <= end_date)
        query = query.order_by(Race.race_date).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count(db: AsyncSession, status: str | None = None) -> int:
        """Count races with optional filtering.

        Args:
            db: Database session
            status: Filter by status

        Returns:
            Count of races
        """
        query = select(func.count(Race.id))

        if status:
            query = query.where(Race.status == status)

        result = await db.execute(query)
        return result.scalar_one()

    @staticmethod
    async def create(db: AsyncSession, race_data: RaceCreate) -> Race:
        """Create a new race record.

        Args:
            db: Database session
            race_data: Race creation data

        Returns:
            Created Race object
        """
        logger.info(
            f"Creating race: {race_data.name} (round "
            f"{race_data.round_number}, external_id: {race_data.external_id})"
        )

        race = Race(**race_data.model_dump())
        db.add(race)
        await db.commit()
        await db.refresh(race)

        logger.info(f"Race created: {race.id} - {race.name}")
        return race

    @staticmethod
    async def update(db: AsyncSession, race: Race, race_data: RaceUpdate) -> Race:
        """Update an existing race record.

        Args:
            db: Database session
            race: Race object to update
            race_data: Race update data

        Returns:
            Updated Race object
        """
        logger.info(f"Updating race: {race.id} - {race.name}")

        update_data = race_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(race, field, value)

        await db.commit()
        await db.refresh(race)

        logger.info(f"Race updated: {race.id} - {race.name}")
        return race

    @staticmethod
    async def update_or_create(
        db: AsyncSession,
        external_id: int,
        race_data: RaceCreate,
    ) -> Race:
        """Update race if exists by external_id, otherwise create new.

        Args:
            db: Database session
            external_id: External race ID from Jolpica API
            race_data: Race data

        Returns:
            Created or updated Race object
        """
        existing = await RaceService.get_by_external_id(db, external_id)

        if existing:
            # Update existing race with new data
            update_data = RaceUpdate(
                status=race_data.status,
                race_date=race_data.race_date if race_data.status == "completed" else None,
            )
            return await RaceService.update(db, existing, update_data)
        else:
            # Create new race
            return await RaceService.create(db, race_data)
