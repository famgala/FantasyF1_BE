"""Service layer for League operations.

Provides CRUD operations for leagues in the F1 Fantasy game.
"""

import random
import string

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.core.logging import get_logger
from app.models.league import League
from app.schemas.league import LeagueCreate, LeagueUpdate
from app.services.league_role_service import LeagueRoleService

logger = get_logger(__name__)


class LeagueService:
    """Service for League CRUD operations.

    Leagues are the main competitive structure where users
    compete with their constructor teams.
    """

    @staticmethod
    def _generate_league_code(length: int = 8) -> str:
        """Generate a unique league code.

        Args:
            length: Length of the code to generate

        Returns:
            Random uppercase alphanumeric code
        """
        characters = string.ascii_uppercase + string.digits
        return "".join(random.choices(characters, k=length))

    @staticmethod
    async def get(db: AsyncSession, league_id: int) -> League:
        """Get a league by ID.

        Args:
            db: Database session
            league_id: League ID

        Returns:
            League object

        Raises:
            NotFoundError: If league not found
        """
        result = await db.execute(select(League).where(League.id == league_id))
        league = result.scalars().first()
        if league is None:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("League not found")
        return league

    @staticmethod
    async def get_by_id(db: AsyncSession, league_id: int) -> League | None:
        """Get a league by ID.

        Args:
            db: Database session
            league_id: League ID

        Returns:
            League object or None if not found
        """
        result = await db.execute(select(League).where(League.id == league_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_code(db: AsyncSession, code: str) -> League | None:
        """Get a league by join code.

        Args:
            db: Database session
            code: League join code

        Returns:
            League object or None if not found
        """
        result = await db.execute(select(League).where(League.code == code))
        return result.scalars().first()

    @staticmethod
    async def get_by_name(db: AsyncSession, name: str) -> League | None:
        """Get a league by name.

        Args:
            db: Database session
            name: League name

        Returns:
            League object or None if not found
        """
        result = await db.execute(select(League).where(League.name == name))
        return result.scalars().first()

    @staticmethod
    async def get_by_creator(
        db: AsyncSession, creator_id: int, skip: int = 0, limit: int = 100
    ) -> list[League]:
        """Get all leagues created by a user.

        Args:
            db: Database session
            creator_id: User ID of the creator
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of League objects
        """
        query = select(League).where(League.creator_id == creator_id)
        query = query.order_by(League.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count_by_creator(db: AsyncSession, creator_id: int) -> int:
        """Count leagues created by a user.

        Args:
            db: Database session
            creator_id: User ID of the creator

        Returns:
            Count of leagues
        """
        result = await db.execute(
            select(func.count(League.id)).where(League.creator_id == creator_id)
        )
        return result.scalar_one()

    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        creator_id: int | None = None,
        is_private: bool | None = None,
    ) -> list[League]:
        """Get all leagues with optional filtering and pagination.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            creator_id: Filter by creator user ID
            is_private: Filter by privacy status

        Returns:
            List of League objects
        """
        query = select(League)

        if creator_id:
            query = query.where(League.creator_id == creator_id)

        if is_private is not None:
            query = query.where(League.is_private == is_private)

        query = query.order_by(League.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def search(
        db: AsyncSession,
        search_term: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[League]:
        """Search leagues by name.

        Args:
            db: Database session
            search_term: Search term for league name
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of matching League objects
        """
        query = select(League).where(League.name.ilike(f"%{search_term}%"))
        query = query.order_by(League.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def count(
        db: AsyncSession,
        creator_id: int | None = None,
        is_private: bool | None = None,
    ) -> int:
        """Count leagues with optional filtering.

        Args:
            db: Database session
            creator_id: Filter by creator user ID
            is_private: Filter by privacy status

        Returns:
            Count of leagues
        """
        query = select(func.count(League.id))

        if creator_id:
            query = query.where(League.creator_id == creator_id)

        if is_private is not None:
            query = query.where(League.is_private == is_private)

        result = await db.execute(query)
        return result.scalar_one()

    @staticmethod
    async def create(db: AsyncSession, league_data: LeagueCreate, creator_id: int) -> League:
        """Create a new league record.

        Args:
            db: Database session
            league_data: League creation data
            creator_id: User ID of the league creator

        Returns:
            Created League object

        Raises:
            ValidationError: If league name already exists
        """
        # Check if league name already exists
        existing = await LeagueService.get_by_name(db, league_data.name)
        if existing:
            raise ValidationError(f"League with name '{league_data.name}' already exists")

        # Generate unique code
        code = LeagueService._generate_league_code()

        logger.info(f"Creating league: {league_data.name} (code: {code})")

        league = League(
            **league_data.model_dump(),
            code=code,
            creator_id=creator_id,
            is_private=int(league_data.is_private),
        )
        db.add(league)
        await db.flush()

        # Create creator role for the league creator
        await LeagueRoleService.create_creator_role(db, league.id, creator_id)

        await db.commit()
        await db.refresh(league)

        logger.info(f"League created: {league.id} - {league.name}")
        return league

    @staticmethod
    async def update(db: AsyncSession, league: League, league_data: LeagueUpdate) -> League:
        """Update an existing league record.

        Args:
            db: Database session
            league: League object to update
            league_data: League update data

        Returns:
            Updated League object

        Raises:
            ValidationError: If new name already exists
        """
        # Check if name is being changed and if it conflicts
        if league_data.name and league_data.name != league.name:
            existing = await LeagueService.get_by_name(db, league_data.name)
            if existing:
                raise ValidationError(f"League with name '{league_data.name}' already exists")

        logger.info(f"Updating league: {league.id} - {league.name}")

        update_data = league_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "is_private" and value is not None:
                setattr(league, field, int(value))
            else:
                setattr(league, field, value)

        await db.commit()
        await db.refresh(league)

        logger.info(f"League updated: {league.id} - {league.name}")
        return league

    @staticmethod
    async def delete(db: AsyncSession, league: League) -> None:
        """Delete a league.

        Args:
            db: Database session
            league: League object to delete

        Raises:
            ValidationError: If league has existing teams
        """
        logger.info(f"Deleting league: {league.id} - {league.name}")

        await db.delete(league)
        await db.commit()

        logger.info(f"League deleted: {league.id} - {league.name}")
