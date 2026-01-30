"""Service layer for Constructor operations.

Provides read-only access to F1 constructor data for the F1 Fantasy game.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.constructor import Constructor
from app.schemas.constructor import ConstructorCreate, ConstructorUpdate

logger = get_logger(__name__)


class ConstructorService:
    """Service for Constructor CRUD operations.

    This is a read-only service for F1 constructor data that comes from
    the external Jolpica API. Constructors are synced periodically.
    """

    @staticmethod
    async def get(db: AsyncSession, constructor_id: int) -> Constructor:
        """Get a constructor by ID.

        Args:
            db: Database session
            constructor_id: Constructor ID

        Returns:
            Constructor object

        Raises:
            NotFoundError: If constructor not found
        """
        result = await db.execute(select(Constructor).where(Constructor.id == constructor_id))
        constructor = result.scalars().first()
        if constructor is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Constructor not found")
        return constructor

    @staticmethod
    async def get_by_id(db: AsyncSession, constructor_id: int) -> Constructor | None:
        """Get a constructor by ID.

        Args:
            db: Database session
            constructor_id: Constructor ID

        Returns:
            Constructor object or None if not found
        """
        result = await db.execute(select(Constructor).where(Constructor.id == constructor_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_code(db: AsyncSession, team_code: str) -> Constructor | None:
        """Get a constructor by team code.

        Args:
            db: Database session
            team_code: Team code (e.g., FER, MER)

        Returns:
            Constructor object or None if not found
        """
        result = await db.execute(select(Constructor).where(Constructor.team_code == team_code))
        return result.scalars().first()

    @staticmethod
    async def get_by_name(db: AsyncSession, team_name: str) -> Constructor | None:
        """Get a constructor by name.

        Args:
            db: Database session
            team_name: Team name

        Returns:
            Constructor object or None if not found
        """
        result = await db.execute(select(Constructor).where(Constructor.team_name == team_name))
        return result.scalars().first()

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        year: int | None = None,
        nationality: str | None = None,
    ) -> list[Constructor]:
        """Get all constructors with optional filtering and pagination.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            year: Filter by season year
            nationality: Filter by nationality

        Returns:
            List of Constructor objects
        """
        query = select(Constructor)

        if year:
            query = query.where(Constructor.year == year)

        if nationality:
            query = query.where(Constructor.nationality.ilike(f"%{nationality}%"))

        query = query.order_by(Constructor.current_points.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_by_year(db: AsyncSession, year: int) -> list[Constructor]:
        """Get all constructors for a specific year.

        Args:
            db: Database session
            year: Season year

        Returns:
            List of Constructor objects for the year
        """
        query = select(Constructor).where(Constructor.year == year)
        query = query.order_by(Constructor.current_points.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def search(
        db: AsyncSession,
        search_term: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Constructor]:
        """Search constructors by name or code.

        Args:
            db: Database session
            search_term: Search term for team name or code
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of matching Constructor objects
        """
        query = select(Constructor).where(
            Constructor.team_name.ilike(f"%{search_term}%")
            | Constructor.team_code.ilike(f"%{search_term}%")
        )
        query = query.order_by(Constructor.current_points.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count(
        db: AsyncSession,
        year: int | None = None,
        nationality: str | None = None,
    ) -> int:
        """Count constructors with optional filtering.

        Args:
            db: Database session
            year: Filter by season year
            nationality: Filter by nationality

        Returns:
            Count of constructors
        """
        query = select(func.count(Constructor.id))

        if year:
            query = query.where(Constructor.year == year)

        if nationality:
            query = query.where(Constructor.nationality.ilike(f"%{nationality}%"))

        result = await db.execute(query)
        return result.scalar_one()

    @staticmethod
    async def create(db: AsyncSession, constructor_data: ConstructorCreate) -> Constructor:
        """Create a new constructor record.

        Args:
            db: Database session
            constructor_data: Constructor creation data

        Returns:
            Created Constructor object
        """
        logger.info(
            f"Creating constructor: {constructor_data.team_name} "
            f"(code: {constructor_data.team_code}, year: {constructor_data.year})"
        )

        constructor = Constructor(**constructor_data.model_dump())
        db.add(constructor)
        await db.commit()
        await db.refresh(constructor)

        logger.info(f"Constructor created: {constructor.id} - {constructor.team_name}")
        return constructor

    @staticmethod
    async def update(
        db: AsyncSession, constructor: Constructor, constructor_data: ConstructorUpdate
    ) -> Constructor:
        """Update an existing constructor record.

        Args:
            db: Database session
            constructor: Constructor object to update
            constructor_data: Constructor update data

        Returns:
            Updated Constructor object
        """
        logger.info(f"Updating constructor: {constructor.id} - {constructor.team_name}")

        update_data = constructor_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(constructor, field, value)

        await db.commit()
        await db.refresh(constructor)

        logger.info(f"Constructor updated: {constructor.id} - {constructor.team_name}")
        return constructor

    @staticmethod
    async def update_or_create_by_code(
        db: AsyncSession,
        team_code: str,
        constructor_data: ConstructorCreate,
    ) -> Constructor:
        """Update constructor if exists by team_code, otherwise create new.

        Args:
            db: Database session
            team_code: Team code to match
            constructor_data: Constructor data

        Returns:
            Created or updated Constructor object
        """
        existing = await ConstructorService.get_by_code(db, team_code)

        if existing:
            # Update existing constructor with new data
            update_data = ConstructorUpdate(
                engine=constructor_data.engine,
                chassis=constructor_data.chassis,
                current_points=constructor_data.current_points,
            )
            return await ConstructorService.update(db, existing, update_data)
        else:
            # Create new constructor
            return await ConstructorService.create(db, constructor_data)
