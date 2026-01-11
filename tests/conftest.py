"""Pytest configuration and fixtures"""

import asyncio
from collections.abc import AsyncGenerator, Generator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.cache.client import close_redis, init_redis
from app.db.session import engine, get_db
from app.main import app


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture()
async def db():
    """Create database session for testing with transaction rollback"""
    # Use test database URL
    test_session_local = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    # Get a connection and start a transaction
    async with engine.begin() as conn, test_session_local(bind=conn) as session:
        try:
            yield session
        finally:
            # Rollback happens automatically when exiting the conn context
            await session.close()


@pytest.fixture()
async def db_session(db):
    """Alias for db fixture for compatibility"""
    return db


@pytest.fixture()
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for testing with database override"""

    # Override the database dependency
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    # Clean up dependency override
    app.dependency_overrides.clear()


@pytest.fixture(scope="session", autouse=True)
async def _setup_database(event_loop):
    """Create database tables for testing"""
    from app.db.base import Base

    # Import all models to ensure they're registered with Base
    from app.models import constructor, driver, league, race, user  # noqa: F401

    # Create all tables using async connection
    # Use connect() instead of begin() to avoid transaction isolation
    async with engine.connect() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.commit()

    return

    # Cleanup: optionally drop tables (commented out to preserve test data between runs)
    # async with engine.connect() as conn:
    #     await conn.run_sync(Base.metadata.drop_all)
    #     await conn.commit()


@pytest.fixture(scope="session", autouse=True)
async def _setup_redis():
    """Initialize Redis for testing"""
    await init_redis()
    yield
    await close_redis()
