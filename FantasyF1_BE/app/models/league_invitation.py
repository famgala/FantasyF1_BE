"""League invitation model for inviting users to join leagues."""

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class InvitationStatus(str, Enum):
    """Status of a league invitation."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class InvitationType(str, Enum):
    """Type of invitation method."""

    EMAIL = "email"
    USER_ID = "user_id"
    USERNAME = "username"
    CODE = "code"


class LeagueInvitation(Base):
    """Represents an invitation to join a fantasy racing league.

    League owners/co-managers can invite users to join their league
    via email, user ID, username, or invite code.

    Attributes:
        id: Primary key
        league_id: Foreign key to the league
        inviter_id: Foreign key to the user who sent the invitation
        invitee_id: Foreign key to the invited user (if registered)
        invitee_email: Email of the invitee (if not yet registered)
        invitee_username: Username of the invitee (if searching by username)
        invite_code: Unique code for email/code-based invitations
        status: Current status of the invitation
        invitation_type: Method used for invitation
        message: Custom message from inviter
        expires_at: Timestamp when invitation expires
        responded_at: Timestamp when invitee responded
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "league_invitations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    league_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("leagues.id"), nullable=False, index=True
    )
    inviter_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    invitee_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )
    invitee_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    invitee_username: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    invite_code: Mapped[str | None] = mapped_column(
        String(32), unique=True, nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default=InvitationStatus.PENDING.value, nullable=False, index=True
    )
    invitation_type: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of LeagueInvitation."""
        return (
            f"<LeagueInvitation(id={self.id}, league_id={self.league_id}, "
            f"invite_code='{self.invite_code}', status='{self.status}')>"
        )
