"""Driver model for F1 Fantasy game."""

from datetime import datetime

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Driver(Base):
    """Represents an F1 driver.

    Attributes:
        id: Primary key
        external_id: External ID from Jolpica API
        name: Driver's full name
        team_name: Current team name
        number: Driver's number
        code: Three-letter driver code (e.g., VER, HAM)
        country: Driver's nationality
        price: Driver's fantasy price (in millions)
        status: Driver status (active, retired, etc.)
        total_points: Total fantasy points earned (computed field)
        average_points: Average points per race (computed field)
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    team_name: Mapped[str] = mapped_column(String(255), nullable=False)
    number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    code: Mapped[str | None] = mapped_column(String(3), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Price in millions
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False, index=True)

    # Computed fields - will be populated by business logic
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_points: Mapped[float] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of Driver."""
        return f"<Driver(id={self.id}, name='{self.name}', code='{self.code}')>"
