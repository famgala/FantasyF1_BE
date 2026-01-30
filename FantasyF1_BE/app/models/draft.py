"""Draft models for F1 Fantasy game."""

from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DraftPick(Base):
    """Represents a draft selection in a league.

    This records which constructor (team) picked which driver in the draft
    for a specific race. It tracks the draft order and timing of the pick.

    Attributes:
        id: Primary key
        league_id: Foreign key to league
        race_id: Foreign key to race
        fantasy_team_id: Foreign key to fantasy team making the pick
        driver_id: Foreign key to driver selected
        pick_number: Order in which this pick was made (1, 2, 3, etc.)
        pick_round: Draft round number
        draft_position: Position in draft order for this race
        is_auto_pick: Whether this was an auto-pick (user absent)
        picked_at: Timestamp when pick was made
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "draft_picks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    league_id: Mapped[int] = mapped_column(ForeignKey("leagues.id"), nullable=False, index=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), nullable=False, index=True)
    fantasy_team_id: Mapped[int] = mapped_column(
        ForeignKey("fantasy_teams.id"), nullable=False, index=True
    )
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), nullable=False, index=True)
    pick_number: Mapped[int] = mapped_column(Integer, nullable=False)  # 1, 2, 3, etc.
    pick_round: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  # Draft round
    draft_position: Mapped[int] = mapped_column(Integer, nullable=False)  # Position in draft order
    is_auto_pick: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    picked_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of DraftPick."""
        return (
            f"<DraftPick(id={self.id}, league_id={self.league_id}, "
            f"race_id={self.race_id}, driver_id={self.driver_id}, "
            f"pick_number={self.pick_number})>"
        )


class DraftOrder(Base):
    """Represents the draft order for a league and race.

    This model stores the draft order for constructors (teams) in a league
    for a specific race. It supports both sequential and snake draft formats.

    Attributes:
        id: Primary key
        league_id: Foreign key to league
        race_id: Foreign key to race
        draft_method: Method used for draft order ('sequential', 'snake', 'manual')
        order_data: JSON string storing the draft order as array of constructor IDs
        is_manual: Whether this order was manually set (vs auto-generated)
        last_modified_by: User ID who last modified the draft order
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "draft_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    league_id: Mapped[int] = mapped_column(ForeignKey("leagues.id"), nullable=False, index=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), nullable=False, index=True)
    draft_method: Mapped[str] = mapped_column(String(20), default="sequential", nullable=False)
    order_data: Mapped[str] = mapped_column(
        String(1000), nullable=False
    )  # JSON array of constructor/team IDs
    is_manual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_modified_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of DraftOrder."""
        return (
            f"<DraftOrder(id={self.id}, league_id={self.league_id}, "
            f"race_id={self.race_id}, method='{self.draft_method}')>"
        )
