"""Common dependency factories for FastAPI endpoints"""

from typing import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db


def get_current_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session (alias for get_db)"""
    return get_db()


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Get async database session"""
    async for session in get_db():
        yield session