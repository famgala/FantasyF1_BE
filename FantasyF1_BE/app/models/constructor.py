"""Constructor model for F1 Fantasy game."""

from datetime import datetime

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Constructor(Base):
    """Represents an F1 Constructor (Team).

    This models actual F1 constructors like Ferrari, Mercedes, Red Bull, etc.
    Users will draft these constructors as part of their fantasy teams.

    Attributes:
        id: Primary key
        team_name: Full team name (e.g., "Scuderia Ferrari HP")
        team_code: Short code (e.g., "FER")
        engine: Engine manufacturer
        chassis: Chassis name
        nationality: Team nationality
        year: Season year
        world_wins: Total wins in history
        world_championships: Total championships won
        current_points: Current season points
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "constructors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    team_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    team_code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)
    engine: Mapped[str | None] = mapped_column(String(50), nullable=True)
    chassis: Mapped[str | None] = mapped_column(String(50), nullable=True)
    nationality: Mapped[str | None] = mapped_column(String(50), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    world_wins: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    world_championships: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    current_points: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of Constructor."""
        return f"<Constructor(id={self.id}, name='{self.team_name}', code='{self.team_code}')>"
