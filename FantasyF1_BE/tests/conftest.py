"""Pytest configuration and fixtures"""

import asyncio
from collections.abc import AsyncGenerator, Generator

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.sql import text

from app.cache.client import close_redis, init_redis
from app.core.dependencies import get_async_db
from app.db.session import get_db
from app.main import app

# Test database URL (using SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Global test engine and session maker
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture()
async def db() -> AsyncGenerator[AsyncSession, None]:
    """Create database session for testing.

    This fixture creates a session that can be used for test operations.
    Note: Data created via this session will be visible across operations
    due to dependency overrides in the client fixture.
    """
    async with TestSessionLocal() as session:
        yield session


# Alias for db fixture
db_session = db


@pytest_asyncio.fixture()
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for testing with database override.

    This fixture ensures the same database session is used across all
    API requests by overriding both get_db and get_async_db dependencies globally.
    """
    # Create a global reference to the session
    test_session = db

    # Override both database dependencies
    async def override_get_db():
        """Override that yields the same test session for all requests."""
        yield test_session

    async def override_get_async_db():
        """Override that yields the same test session for all requests."""
        yield test_session

    # Override at the app level
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_async_db] = override_get_async_db

    try:
        async with AsyncClient(app=app, base_url="http://test") as ac:
            yield ac
    finally:
        # Clean up dependency override
        app.dependency_overrides.clear()
        # Commit any pending changes and close the session
        await test_session.commit()
        await test_session.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _setup_database(event_loop):
    """Create database tables for testing (runs once per test session)"""
    from app.db.base import Base

    # Import all models to ensure they're registered with Base

    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    # Cleanup: drop tables after all tests are done
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def _reset_database():
    """Reset database tables before each test function.

    This fixture truncates all tables to ensure test isolation
    without requiring transaction rollback.
    """
    from app.db.base import Base
    from app.models import constructor, driver, league, race, user  # noqa: F401

    # Get the metadata
    metadata = Base.metadata

    # Delete all rows from tables in reverse order (respecting foreign keys)
    async with test_engine.begin() as conn:
        # For SQLite, we need to delete all rows instead of truncating
        for table in reversed(metadata.sorted_tables):
            await conn.execute(text(f"DELETE FROM {table.name}"))


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _setup_redis():
    """Initialize Redis for testing"""
    await init_redis()
    yield
    await close_redis()
