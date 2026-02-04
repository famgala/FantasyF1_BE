"""Integration tests for authentication endpoints."""

# type: ignore

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.schemas.user import UserCreate
from app.services.user_service import UserService


@pytest.mark.asyncio()
async def test_register_success(client: AsyncClient, db_session: AsyncSession):
    """Test successful user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "TestPass123",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["is_active"] is True
    assert "hashed_password" not in data  # Password should not be exposed


@pytest.mark.asyncio()
async def test_register_duplicate_username(client: AsyncClient, db_session: AsyncSession):
    """Test registration with duplicate username."""
    # Create first user
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")
    await UserService.create_user(db_session, user_data)

    # Try to register with same username
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "test2@example.com",
            "password": "TestPass123",
        },
    )

    assert response.status_code == 400
    assert "Username already exists" in response.json()["detail"]


@pytest.mark.asyncio()
async def test_register_weak_password(client: AsyncClient, db_session: AsyncSession):
    """Test registration with weak password."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "weak",
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio()
async def test_login_success(client: AsyncClient, db_session: AsyncSession):
    """Test successful login."""
    # Create user
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")
    await UserService.create_user(db_session, user_data)

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "TestPass123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    # Verify access token
    access_payload = verify_token(data["access_token"])
    assert access_payload is not None
    assert access_payload["type"] == "access"

    # Verify refresh token
    refresh_payload = verify_token(data["refresh_token"])
    assert refresh_payload is not None
    assert refresh_payload["type"] == "refresh"


@pytest.mark.asyncio()
async def test_login_wrong_password(client: AsyncClient, db_session: AsyncSession):
    """Test login with wrong password."""
    # Create user
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")
    await UserService.create_user(db_session, user_data)

    # Try to login with wrong password
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "WrongPass123",
        },
    )

    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]


@pytest.mark.asyncio()
async def test_login_nonexistent_user(client: AsyncClient, db_session: AsyncSession):
    """Test login with non-existent user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "nonexistent",
            "password": "TestPass123",
        },
    )

    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]


@pytest.mark.asyncio()
async def test_refresh_token_success(client: AsyncClient, db_session: AsyncSession):
    """Test successful token refresh."""
    # Create user and login
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")
    await UserService.create_user(db_session, user_data)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "TestPass123",
        },
    )
    tokens = login_response.json()

    # Refresh token
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio()
async def test_refresh_token_invalid(client: AsyncClient, db_session: AsyncSession):
    """Test refresh with invalid token."""
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token"},
    )

    assert response.status_code == 401
    assert "Invalid refresh token" in response.json()["detail"]


@pytest.mark.asyncio()
async def test_get_current_user_profile(client: AsyncClient, db_session: AsyncSession):
    """Test getting current user profile."""
    # Create user and login
    user_data = UserCreate(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        password="TestPass123",
    )
    await UserService.create_user(db_session, user_data)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "TestPass123",
        },
    )
    token = login_response.json()["access_token"]

    # Get profile
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


@pytest.mark.asyncio()
async def test_get_current_user_profile_unauthorized(client: AsyncClient):
    """Test getting profile without token."""
    response = await client.get("/api/v1/users/me")

    assert response.status_code == 401


@pytest.mark.asyncio()
async def test_update_current_user_profile(client: AsyncClient, db_session: AsyncSession):
    """Test updating current user profile."""
    # Create user and login
    user_data = UserCreate(
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        password="TestPass123",
    )
    await UserService.create_user(db_session, user_data)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "TestPass123",
        },
    )
    token = login_response.json()["access_token"]

    # Update profile
    response = await client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "full_name": "Updated Name",
            "email": "updated@example.com",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["email"] == "updated@example.com"


@pytest.mark.asyncio()
async def test_update_user_password(client: AsyncClient, db_session: AsyncSession):
    """Test updating user password."""
    # Create user and login
    user_data = UserCreate(username="testuser", email="test@example.com", password="TestPass123")
    await UserService.create_user(db_session, user_data)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "TestPass123",
        },
    )
    token = login_response.json()["access_token"]

    # Update password
    response = await client.put(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "password": "NewPass123",
        },
    )

    assert response.status_code == 200

    # Verify new password works
    new_login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "NewPass123",
        },
    )
    assert new_login_response.status_code == 200

    # Old password should not work
    old_login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "TestPass123",
        },
    )
    assert old_login_response.status_code == 401
