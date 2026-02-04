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
        fp1_date: Date and time of Free Practice 1
        fp2_date: Date and time of Free Practice 2
        fp3_date: Date and time of Free Practice 3
        qualifying_date: Date and time of Qualifying
        sprint_date: Date and time of Sprint (if applicable)
        status: Race status (upcoming, completed, cancelled)
        winning_constructor_id: Constructor ID that won this race
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
    fp1_date: Mapped[datetime | None] = mapped_column(default=None, nullable=True)
    fp2_date: Mapped[datetime | None] = mapped_column(default=None, nullable=True)
    fp3_date: Mapped[datetime | None] = mapped_column(default=None, nullable=True)
    qualifying_date: Mapped[datetime | None] = mapped_column(default=None, nullable=True)
    sprint_date: Mapped[datetime | None] = mapped_column(default=None, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="upcoming", nullable=False, index=True)
    winning_constructor_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
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
