"""Database base and declarative base"""

from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Base class for all database models"""

    pass
