"""Notification model for user notifications."""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(str, Enum):
    """Types of notifications."""

    RACE_FINISHED = "race_finished"
    DRAFT_UPDATE = "draft_update"
    PICK_TURN = "pick_turn"
    LEAGUE_INVITE = "league_invite"
    TEAM_UPDATE = "team_update"
    POINTS_UPDATED = "points_updated"
    SYSTEM = "system"


class Notification(Base):
    """Notification model."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    link: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    is_read: Mapped[bool] = mapped_column(Integer, default=False, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Additional metadata (JSON fields for flexibility)
    # Note: Using key_value_data instead of metadata to avoid conflict with
    # SQLAlchemy's DeclarativeBase.metadata attribute
    key_value_data: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="notifications",
    )

    __table_args__ = (
        Index("idx_notifications_user_read", "user_id", "is_read"),
        Index("idx_notifications_user_type", "user_id", "type"),
    )

    def to_dict(self) -> dict[str, Any]:
        """Convert notification to dictionary.

        Returns:
            Dictionary representation of the notification
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "link": self.link,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "metadata": self.key_value_data,
        }

    def __repr__(self) -> str:
        """String representation."""
        return (
            f"<Notification(id={self.id}, user_id={self.user_id}, "
            f"type='{self.type}', title='{self.title}')>"
        )
