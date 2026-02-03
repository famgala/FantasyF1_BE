"""ActivityLog model for tracking league activities."""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.league import League
    from app.models.user import User


class ActivityType(str, Enum):
    """Types of league activities."""

    MEMBER_JOINED = "member_joined"
    TEAM_CREATED = "team_created"
    DRAFT_PICK_MADE = "draft_pick_made"
    RACE_COMPLETED = "race_completed"
    POINTS_UPDATED = "points_updated"
    LEAGUE_CREATED = "league_created"
    INVITATION_SENT = "invitation_sent"
    INVITATION_ACCEPTED = "invitation_accepted"


class ActivityLog(Base):
    """ActivityLog model for tracking league activities.

    This model stores a log of activities that occur within a league,
    providing an activity feed for league members.

    Attributes:
        id: Primary key
        league_id: ID of the league where activity occurred
        user_id: ID of the user who performed the action (nullable)
        activity_type: Type of activity (e.g., member_joined, draft_pick_made)
        title: Short title of the activity
        message: Detailed description of the activity
        reference_id: Optional reference to related entity (team_id, race_id, etc.)
        reference_type: Type of referenced entity (team, race, etc.)
        created_at: Timestamp when activity occurred
    """

    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    league_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("leagues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    activity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    reference_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )
    reference_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    # Relationships
    league: Mapped["League"] = relationship(
        "League",
        back_populates="activities",
    )
    user: Mapped["User | None"] = relationship(
        "User",
        back_populates="activities",
    )

    __table_args__ = (
        Index("idx_activity_logs_league_created", "league_id", "created_at"),
        Index("idx_activity_logs_league_type", "league_id", "activity_type"),
    )

    def to_dict(self) -> dict[str, Any]:
        """Convert activity log to dictionary.

        Returns:
            Dictionary representation of the activity log
        """
        return {
            "id": self.id,
            "league_id": self.league_id,
            "user_id": self.user_id,
            "activity_type": self.activity_type,
            "title": self.title,
            "message": self.message,
            "reference_id": self.reference_id,
            "reference_type": self.reference_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        """String representation."""
        return (
            f"<ActivityLog(id={self.id}, league_id={self.league_id}, "
            f"type='{self.activity_type}', title='{self.title}')>"
        )
