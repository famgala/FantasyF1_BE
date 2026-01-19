"""Unit tests for UserService."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.schemas.user import UserCreate, UserUpdate
from app.services.user_service import UserService


@pytest.mark.asyncio()
async def test_create_user_success(db_session: AsyncSession):
    """Test successful user creation."""
    user_data = UserCreate(
        username="testuser", email="test@example.com", full_name="Test User", password="TestPass123"
    )

    user = await UserService.create_user(db_session, user_data)

    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.hashed_password != "TestPass123"  # Password should be hashed


@pytest.mark.asyncio()
async def test_create_user_duplicate_username(db_session: AsyncSession):
    """Test creating user with duplicate username raises ConflictError."""
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")

    await UserService.create_user(db_session, user_data)

    # Try to create another user with same username
    user_data2 = UserCreate(username="testuser", email="test2@example.com", password="TestPass123")

    with pytest.raises(ConflictError, match="Username already exists"):
        await UserService.create_user(db_session, user_data2)


@pytest.mark.asyncio()
async def test_create_user_duplicate_email(db_session: AsyncSession):
    """Test creating user with duplicate email raises ConflictError."""
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")

    await UserService.create_user(db_session, user_data)

    # Try to create another user with same email
    user_data2 = UserCreate(username="testuser2", email="test@example.com", password="TestPass123")

    with pytest.raises(ConflictError, match="Email already exists"):
        await UserService.create_user(db_session, user_data2)


@pytest.mark.asyncio()
async def test_create_user_weak_password(db_session: AsyncSession):
    """Test creating user with weak password raises ValidationError."""
    from pydantic import ValidationError as PydanticValidationError

    # Test password too short
    with pytest.raises(PydanticValidationError):
        await UserService.create_user(
            db_session, UserCreate(username="testuser", email="test@example.com", password="short")
        )

    # Test password without uppercase
    with pytest.raises(PydanticValidationError):
        await UserService.create_user(
            db_session,
            UserCreate(username="testuser", email="test@example.com", password="testpass123"),
        )

    # Test password without lowercase
    with pytest.raises(PydanticValidationError):
        await UserService.create_user(
            db_session,
            UserCreate(username="testuser", email="test@example.com", password="TESTPASS123"),
        )

    # Test password without digit
    with pytest.raises(PydanticValidationError):
        await UserService.create_user(
            db_session,
            UserCreate(username="testuser", email="test@example.com", password="TestPass"),
        )


@pytest.mark.asyncio()
async def test_get_user_by_id_success(db_session: AsyncSession):
    """Test getting user by ID."""
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")

    created_user = await UserService.create_user(db_session, user_data)
    retrieved_user = await UserService.get_user_by_id(db_session, created_user.id)

    assert retrieved_user.id == created_user.id
    assert retrieved_user.username == "testuser"


@pytest.mark.asyncio()
async def test_get_user_by_id_not_found(db_session: AsyncSession):
    """Test getting non-existent user raises NotFoundError."""
    with pytest.raises(NotFoundError, match="User not found"):
        await UserService.get_user_by_id(db_session, 99999)


@pytest.mark.asyncio()
async def test_get_user_by_username_success(db_session: AsyncSession):
    """Test getting user by username."""
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")

    await UserService.create_user(db_session, user_data)
    retrieved_user = await UserService.get_user_by_username(db_session, "testuser")

    assert retrieved_user is not None
    assert retrieved_user.username == "testuser"


@pytest.mark.asyncio()
async def test_get_user_by_username_not_found(db_session: AsyncSession):
    """Test getting non-existent user by username returns None."""
    user = await UserService.get_user_by_username(db_session, "nonexistent")
    assert user is None


@pytest.mark.asyncio()
async def test_get_user_by_email_success(db_session: AsyncSession):
    """Test getting user by email."""
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")

    await UserService.create_user(db_session, user_data)
    retrieved_user = await UserService.get_user_by_email(db_session, "test@example.com")

    assert retrieved_user is not None
    assert retrieved_user.email == "test@example.com"


@pytest.mark.asyncio()
async def test_get_user_by_email_not_found(db_session: AsyncSession):
    """Test getting non-existent user by email returns None."""
    user = await UserService.get_user_by_email(db_session, "nonexistent@example.com")
    assert user is None


@pytest.mark.asyncio()
async def test_authenticate_success(db_session: AsyncSession):
    """Test successful authentication."""
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")

    await UserService.create_user(db_session, user_data)
    authenticated_user = await UserService.authenticate(
        db_session, username="testuser", password="TestPass123"
    )

    assert authenticated_user is not None
    assert authenticated_user.username == "testuser"


@pytest.mark.asyncio()
async def test_authenticate_wrong_password(db_session: AsyncSession):
    """Test authentication with wrong password returns None."""
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")

    await UserService.create_user(db_session, user_data)
    authenticated_user = await UserService.authenticate(
        db_session, username="testuser", password="WrongPass123"
    )

    assert authenticated_user is None


@pytest.mark.asyncio()
async def test_authenticate_nonexistent_user(db_session: AsyncSession):
    """Test authentication with non-existent user returns None."""
    authenticated_user = await UserService.authenticate(
        db_session, username="nonexistent", password="TestPass123"
    )

    assert authenticated_user is None


@pytest.mark.asyncio()
async def test_update_user_success(db_session: AsyncSession):
    """Test successful user update."""
    user_data = UserCreate(
        username="testuser", email="test@example.com", full_name="Test User", password="TestPass123"
    )

    user = await UserService.create_user(db_session, user_data)

    update_data = UserUpdate(email="newemail@example.com", full_name="New Name")

    updated_user = await UserService.update_user(db_session, user.id, update_data)

    assert updated_user.email == "newemail@example.com"
    assert updated_user.full_name == "New Name"
    assert updated_user.username == "testuser"  # Username unchanged


@pytest.mark.asyncio()
async def test_update_user_password(db_session: AsyncSession):
    """Test updating user password."""
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")

    user = await UserService.create_user(db_session, user_data)

    # Save the old password hash before updating
    old_password_hash = user.hashed_password

    update_data = UserUpdate(password="NewPass123")
    updated_user = await UserService.update_user(db_session, user.id, update_data)

    assert updated_user.hashed_password != old_password_hash


@pytest.mark.asyncio()
async def test_delete_user_success(db_session: AsyncSession):
    """Test successful user deletion."""
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")

    user = await UserService.create_user(db_session, user_data)
    user_id = user.id

    result = await UserService.delete_user(db_session, user_id)

    assert result is True

    # Verify user no longer exists
    with pytest.raises(NotFoundError):
        await UserService.get_user_by_id(db_session, user_id)


@pytest.mark.asyncio()
async def test_delete_user_not_found(db_session: AsyncSession):
    """Test deleting non-existent user raises NotFoundError."""
    with pytest.raises(NotFoundError):
        await UserService.delete_user(db_session, 99999)
