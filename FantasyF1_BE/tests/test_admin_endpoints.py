"""Integration tests for admin endpoints including system health check."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.user import User


async def create_test_superuser(db: AsyncSession, username: str = "admin") -> User:
    """Create a test superuser for authentication.

    Args:
        db: Database session
        username: Username for the superuser

    Returns:
        Created superuser
    """
    user = User(
        username=username,
        email=f"{username}@example.com",
        hashed_password=get_password_hash("AdminPass123"),
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def create_test_user(db: AsyncSession, username: str = "testuser") -> User:
    """Create a test regular user for authentication.

    Args:
        db: Database session
        username: Username for the user

    Returns:
        Created user
    """
    user = User(
        username=username,
        email=f"{username}@example.com",
        hashed_password=get_password_hash("TestPass123"),
        full_name="Test User",
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def login_and_get_token(client: AsyncClient, username: str, password: str) -> str:
    """Login and return access token.

    Args:
        client: Test client
        username: Username to login
        password: Password to login

    Returns:
        Access token
    """
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_health_check_success(client: AsyncClient, db: AsyncSession):
    """Test successful health check by superuser.

    Tests:
    - [Story 39, Step 5] Call endpoint with admin token and verify 200 status
    - [Story 39, Step 5] Verify all required fields are present in response
    """
    # Create superuser
    admin = await create_test_superuser(db)

    # Login and get token
    token = await login_and_get_token(client, admin.username, "AdminPass123")

    # Call health check endpoint
    response = await client.get(
        "/api/v1/admin/health",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Verify 200 status
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    # Verify response structure
    data = response.json()
    assert "api_status" in data
    assert "api_response_time_ms" in data
    assert "database_status" in data
    assert "database_response_time_ms" in data
    assert "redis_status" in data
    assert "redis_response_time_ms" in data
    assert "celery_status" in data
    assert "celery_response_time_ms" in data
    assert "overall_status" in data
    assert "timestamp" in data

    # Verify status values are valid
    valid_statuses = ["healthy", "degraded", "unhealthy"]
    assert data["api_status"] in valid_statuses
    assert data["database_status"] in valid_statuses
    assert data["redis_status"] in valid_statuses
    assert data["celery_status"] in valid_statuses
    assert data["overall_status"] in valid_statuses

    # Verify response times are positive numbers or zero
    assert data["api_response_time_ms"] >= 0
    assert data["database_response_time_ms"] >= 0
    assert data["redis_response_time_ms"] >= 0
    assert data["celery_response_time_ms"] >= 0


@pytest.mark.asyncio
async def test_admin_health_check_unauthorized_no_token(client: AsyncClient):
    """Test health check without authentication token.

    Tests:
    - [Story 39, Step 6] Call endpoint without token and verify 401
    """
    response = await client.get("/api/v1/admin/health")

    # Should return 401 unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_health_check_forbidden_regular_user(client: AsyncClient, db: AsyncSession):
    """Test health check with regular user token (not superuser).

    Tests:
    - [Story 39, Step 6] Call endpoint with regular user token and verify 403
    """
    # Create regular user
    user = await create_test_user(db)

    # Login and get token
    token = await login_and_get_token(client, user.username, "TestPass123")

    # Call health check endpoint with regular user token
    response = await client.get(
        "/api/v1/admin/health",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Should return 403 forbidden
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_health_check_invalid_token(client: AsyncClient):
    """Test health check with invalid token.

    Tests:
    - Verify endpoint rejects invalid tokens
    """
    response = await client.get(
        "/api/v1/admin/health",
        headers={"Authorization": "Bearer invalid_token"},
    )

    # Should return 401 unauthorized
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_statistics_success(client: AsyncClient, db: AsyncSession):
    """Test successful admin statistics retrieval by superuser.

    Tests:
    - Verify admin can access statistics endpoint
    - Verify statistics response structure
    """
    # Create superuser
    admin = await create_test_superuser(db)

    # Login and get token
    token = await login_and_get_token(client, admin.username, "AdminPass123")

    # Call statistics endpoint
    response = await client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Verify 200 status
    assert response.status_code == 200

    # Verify response structure
    data = response.json()
    assert "total_users" in data
    assert "active_users_7d" in data
    assert "total_leagues" in data
    assert "active_leagues" in data
    assert "completed_races" in data
    assert "upcoming_races" in data
    assert "registrations_by_day" in data
    assert "leagues_by_day" in data


@pytest.mark.asyncio
async def test_admin_statistics_unauthorized(client: AsyncClient):
    """Test statistics endpoint without authentication."""
    response = await client.get("/api/v1/admin/stats")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_statistics_forbidden_regular_user(client: AsyncClient, db: AsyncSession):
    """Test statistics endpoint with regular user token."""
    # Create regular user
    user = await create_test_user(db)

    # Login and get token
    token = await login_and_get_token(client, user.username, "TestPass123")

    # Call statistics endpoint with regular user token
    response = await client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Should return 403 forbidden
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_error_logs_success(client: AsyncClient, db: AsyncSession):
    """Test successful error logs retrieval by superuser.

    Tests:
    - Verify admin can access error logs endpoint
    - Verify error logs response structure and pagination
    """
    # Create superuser
    admin = await create_test_superuser(db)

    # Login and get token
    token = await login_and_get_token(client, admin.username, "AdminPass123")

    # Call error logs endpoint
    response = await client.get(
        "/api/v1/admin/logs",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Verify 200 status
    assert response.status_code == 200

    # Verify response structure
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data

    # Verify items is a list
    assert isinstance(data["items"], list)

    # Verify total is a number
    assert isinstance(data["total"], int)


@pytest.mark.asyncio
async def test_admin_error_logs_filtering(client: AsyncClient, db: AsyncSession):
    """Test error logs with filtering parameters.

    Tests:
    - Verify error logs can be filtered by various parameters
    - Verify pagination works correctly
    """
    # Create superuser
    admin = await create_test_superuser(db)

    # Login and get token
    token = await login_and_get_token(client, admin.username, "AdminPass123")

    # Call error logs with filters
    response = await client.get(
        "/api/v1/admin/logs?offset=0&limit=10",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Verify 200 status
    assert response.status_code == 200

    # Verify pagination parameters are respected
    data = response.json()
    assert len(data["items"]) <= 10
    assert data["page"] == 1
    assert data["page_size"] == 10


@pytest.mark.asyncio
async def test_admin_error_logs_unauthorized(client: AsyncClient):
    """Test error logs endpoint without authentication."""
    response = await client.get("/api/v1/admin/logs")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_error_logs_forbidden_regular_user(client: AsyncClient, db: AsyncSession):
    """Test error logs endpoint with regular user token."""
    # Create regular user
    user = await create_test_user(db)

    # Login and get token
    token = await login_and_get_token(client, user.username, "TestPass123")

    # Call error logs endpoint with regular user token
    response = await client.get(
        "/api/v1/admin/logs",
        headers={"Authorization": f"Bearer {token}"},
    )

    # Should return 403 forbidden
    assert response.status_code == 403
