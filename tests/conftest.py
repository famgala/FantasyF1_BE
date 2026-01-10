"""Pytest configuration and fixtures"""

import asyncio
from collections.abc import AsyncGenerator, Generator

import pytest
from httpx import AsyncClient

from app.cache.client import close_redis, init_redis
from app.db.session import engine
from app.main import app


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create async HTTP client for testing"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="session")
async def db_session():
    """Create database session for testing"""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    # Use test database URL
    test_session_local = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with test_session_local() as session:
        yield session


@pytest.fixture(scope="session", autouse=True)
async def _setup_redis():
    """Initialize Redis for testing"""
    await init_redis()
    yield
    await close_redis()
