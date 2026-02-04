"""League role model for co-manager support."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.league import League
    from app.models.user import User


class LeagueRole(Base):
    """League role model for managing co-managers and other roles."""

    __tablename__ = "league_roles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    league_id: Mapped[int] = mapped_column(
        ForeignKey("leagues.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # 'creator', 'co_manager', 'member'
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    league: Mapped["League"] = relationship(back_populates="roles")
    user: Mapped["User"] = relationship(back_populates="league_roles")

    def __repr__(self) -> str:
        """String representation of LeagueRole."""
        return (
            f"<LeagueRole(league_id={self.league_id}, "
            f"user_id={self.user_id}, role='{self.role}')>"
        )
