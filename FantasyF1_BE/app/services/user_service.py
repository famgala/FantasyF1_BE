"""User business logic."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Service for user operations."""

    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        """Create a new user.

        Args:
            db: Database session
            user_data: User creation data

        Returns:
            Created user

        Raises:
            ConflictError: If username or email already exists
            ValidationError: If password doesn't meet requirements
        """
        # Validate password strength
        UserService._validate_password(user_data.password)

        # Check if username already exists
        result = await db.execute(select(User).where(User.username == user_data.username))
        if result.scalar_one_or_none() is not None:
            raise ConflictError("Username already exists")

        # Check if email already exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalar_one_or_none() is not None:
            raise ConflictError("Email already exists")

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        try:
            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)
        except IntegrityError:
            await db.rollback()
            raise ConflictError("Username or email already exists") from None

        return db_user

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> User:
        """Get user by ID.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            User object

        Raises:
            NotFoundError: If user not found
        """
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise NotFoundError("User not found")
        return user

    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
        """Get user by username.

        Args:
            db: Database session
            username: Username

        Returns:
            User object or None
        """
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
        """Get user by email.

        Args:
            db: Database session
            email: Email address

        Returns:
            User object or None
        """
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def authenticate(db: AsyncSession, username: str, password: str) -> User | None:
        """Authenticate user with username and password.

        Args:
            db: Database session
            username: Username
            password: Plain text password

        Returns:
            User object if authentication successful, None otherwise
        """
        user = await UserService.get_user_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    async def update_user(db: AsyncSession, user_id: int, user_data: UserUpdate) -> User:
        """Update user information.

        Args:
            db: Database session
            user_id: User ID
            user_data: Update data

        Returns:
            Updated user

        Raises:
            NotFoundError: If user not found
            ConflictError: If email already taken by another user
            ValidationError: If password doesn't meet requirements
        """
        user = await UserService.get_user_by_id(db, user_id)

        # Validate password strength if provided
        if user_data.password:
            UserService._validate_password(user_data.password)
            # Expire and refresh to ensure SQLAlchemy tracks the change
            db.expire(user)
            await db.refresh(user)
            user.hashed_password = get_password_hash(user_data.password)

        # Update email if provided
        if user_data.email is not None and user_data.email != user.email:
            # Check if email already taken
            result = await db.execute(select(User).where(User.email == user_data.email))
            existing = result.scalar_one_or_none()
            if existing and existing.id != user_id:
                raise ConflictError("Email already exists")
            user.email = user_data.email

        # Update other fields
        if user_data.full_name is not None:
            user.full_name = user_data.full_name
        if user_data.is_active is not None:
            user.is_active = user_data.is_active

        user.updated_at = datetime.utcnow()

        try:
            await db.flush()
            await db.commit()
            await db.refresh(user)
        except IntegrityError:
            await db.rollback()
            raise ConflictError("Email already exists") from None

        return user

    @staticmethod
    async def delete_user(db: AsyncSession, user_id: int) -> bool:
        """Delete a user.

        Args:
            db: Database session
            user_id: User ID

        Returns:
            True if deleted successfully

        Raises:
            NotFoundError: If user not found
        """
        user = await UserService.get_user_by_id(db, user_id)
        await db.delete(user)
        await db.commit()
        return True

    @staticmethod
    async def search_users(
        db: AsyncSession,
        query: str,
        skip: int = 0,
        limit: int = 10,
    ) -> list[User]:
        """Search users by username or email.

        Args:
            db: Database session
            query: Search query string
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of User objects matching the query
        """
        # Search by username or email (case-insensitive partial match)
        search_pattern = f"%{query.lower()}%"
        result = await db.execute(
            select(User)
            .where((User.username.ilike(search_pattern)) | (User.email.ilike(search_pattern)))
            .where(User.is_active)
            .order_by(User.username.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    def _validate_password(password: str) -> None:
        """Validate password strength.

        Args:
            password: Password to validate

        Raises:
            ValidationError: If password doesn't meet requirements
        """
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in password):
            raise ValidationError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in password):
            raise ValidationError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in password):
            raise ValidationError("Password must contain at least one digit")
