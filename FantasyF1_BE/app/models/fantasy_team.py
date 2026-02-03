"""FantasyTeam model for F1 Fantasy game."""

from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TeamPick(Base):
    """Represents a pick (driver or constructor) in a fantasy team.

    This is a through table that links FantasyTeams to both Drivers and Constructors.
    It stores the points earned for each pick and the pick type.

    Attributes:
        id: Primary key
        fantasy_team_id: Foreign key to fantasy team
        driver_id: Foreign key to driver (optional if constructor is selected)
        constructor_id: Foreign key to constructor (optional if driver is selected)
        pick_type: Type of pick ('driver' or 'constructor')
        points_earned: Points earned from this pick in a specific race
        race_id: Foreign key to race (for race-specific picks)
        is_active: Whether this pick is currently active
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "team_picks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fantasy_team_id: Mapped[int] = mapped_column(
        ForeignKey("fantasy_teams.id"), nullable=False, index=True
    )
    driver_id: Mapped[int | None] = mapped_column(
        ForeignKey("drivers.id"), nullable=True, index=True
    )
    constructor_id: Mapped[int | None] = mapped_column(
        ForeignKey("constructors.id"), nullable=True, index=True
    )
    pick_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'driver' or 'constructor'
    points_earned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    race_id: Mapped[int | None] = mapped_column(ForeignKey("races.id"), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Computed fields for API responses (not stored in DB)
    budget_remaining: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of TeamPick."""
        return (
            f"<TeamPick(id={self.id}, fantasy_team_id={self.fantasy_team_id}, "
            f"pick_type='{self.pick_type}', points={self.points_earned})>"
        )


class FantasyTeam(Base):
    """Represents a user's fantasy racing team.

    A fantasy team consists of selected drivers and constructors that compete
    in a league. The team earns points based on actual race results.

    Attributes:
        id: Primary key
        user_id: Foreign key to user who owns the team
        league_id: Foreign key to league the team belongs to
        name: Team name
        total_points: Total fantasy points earned across all races
        budget_remaining: Remaining budget for team (in millions)
        is_active: Whether the team is currently active
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "fantasy_teams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    league_id: Mapped[int] = mapped_column(ForeignKey("leagues.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    total_budget: Mapped[int] = mapped_column(Integer, default=100, nullable=False)  # 100M default
    budget_remaining: Mapped[int] = mapped_column(
        Integer, default=100, nullable=False
    )  # 100M default
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    picks: Mapped[list["TeamPick"]] = relationship(
        "TeamPick", backref="fantasy_team", lazy="dynamic"
    )

    def __repr__(self) -> str:
        """Return string representation of FantasyTeam."""
        return (
            f"<FantasyTeam(id={self.id}, name='{self.name}', "
            f"user_id={self.user_id}, league_id={self.league_id}, "
            f"total_points={self.total_points})>"
        )
