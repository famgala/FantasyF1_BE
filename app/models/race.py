"""Race model for F1 Fantasy game."""

from datetime import datetime

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Race(Base):
    """Represents an F1 race event.

    Attributes:
        id: Primary key
        external_id: External ID from Jolpica API
        name: Race name (e.g., Monaco Grand Prix)
        circuit_name: Circuit name (e.g., Circuit de Monaco)
        country: Country where race is held
        round_number: Round number in the season (1-24)
        race_date: Date and time of the race
        status: Race status (upcoming, completed, cancelled)
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "races"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    external_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    circuit_name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    race_date: Mapped[datetime] = mapped_column(nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="upcoming", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of Race."""
        return (
            f"<Race(id={self.id}, name='{self.name}', "
            f"round={self.round_number}, status='{self.status}')>"
        )
