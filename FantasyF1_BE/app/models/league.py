"""League model for F1 Fantasy game."""

from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class League(Base):
    """Represents a fantasy racing league.

    A league is where multiple users compete with their fantasy teams.
    Users can create leagues and others can join with unique codes.

    Attributes:
        id: Primary key
        name: League name
        code: Unique code for joining the league
        description: League description
        creator_id: User ID who created the league (nullable)
        max_teams: Maximum number of teams allowed
        is_private: Whether the league is private or public
        draft_method: Method for draft (manual, auto)
        draft_date: When draft is scheduled
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "leagues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    creator_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )
    max_teams: Mapped[int] = mapped_column(Integer, server_default="10", nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, server_default="false", nullable=False)
    draft_method: Mapped[str] = mapped_column(String(20), server_default="manual", nullable=False)
    draft_date: Mapped[datetime | None] = mapped_column(default=None, nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of League."""
        return (
            f"<League(id={self.id}, name='{self.name}', "
            f"code='{self.code}', private={self.is_private})>"
        )
