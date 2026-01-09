"""Pytest configuration and fixtures"""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
from httpx import AsyncClient
from pytest_asyncio import is_async_test

from app.cache.client import init_redis, close_redis
from app.db.session import engine
from app.main import app


# Only mark async tests with asyncio
def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    pytest_asyncio_tests = (item for item in items if is_async_test(item))
    session_scope_marker = pytest.mark.asyncio(scope="session")
    for async_test_item in pytest_asyncio_tests:
        async_test_item.add_marker(session_scope_marker)


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
    TestSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with TestSessionLocal() as session:
        yield session


@pytest.fixture(scope="session", autouse=True)
async def setup_redis():
    """Initialize Redis for testing"""
    await init_redis()
    yield
    await close_redis()
