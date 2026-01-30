"""Driver Statistics model for F1 Fantasy game."""

from datetime import datetime

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DriverStats(Base):
    """Represents detailed statistics for a driver over a season.

    This model stores aggregated statistics for each driver, calculated from
    race results. These stats are used for driver analysis and fantasy recommendations.

    Attributes:
        id: Primary key
        driver_id: Foreign key to driver
        season: The year of the season (e.g., 2026)
        races_entered: Number of races the driver participated in
        races_finished: Number of races the driver finished (not DNF/DNS/DSQ)
        total_points: Total F1 championship points earned in season
        wins: Number of race wins (1st place)
        podiums: Number of podium finishes (1st, 2nd, or 3rd place)
        pole_positions: Number of pole positions (started race in 1st)
        fastest_laps: Number of fastest laps recorded
        dnf_count: Number of Did Not Finish results
        dns_count: Number of Did Not Start results
        dsq_count: Number of disqualifications
        average_finish_position: Average finishing position (lower is better)
        best_finish_position: Best finishing position in season
        worst_finish_position: Worst finishing position in season
        average_grid_position: Average grid starting position
        retirement_rate: Percentage of races ended in retirement (DNF)
        podium_rate: Percentage of races resulting in podium (1st-3rd)
        win_rate: Percentage of races won (1st place)
        top10_rate: Percentage of races finished in top 10
        points_per_race: Average points earned per race
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "driver_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), nullable=False, index=True)
    season: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    # Participation stats
    races_entered: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    races_finished: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Achievement stats
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    wins: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    podiums: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    pole_positions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    fastest_laps: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Negative stats
    dnf_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    dns_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    dsq_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Position stats
    average_finish_position: Mapped[float | None] = mapped_column(
        Numeric(precision=5, scale=2), nullable=True
    )
    best_finish_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    worst_finish_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    average_grid_position: Mapped[float | None] = mapped_column(
        Numeric(precision=5, scale=2), nullable=True
    )

    # Rate stats (stored as decimals, e.g., 0.25 = 25%)
    retirement_rate: Mapped[float | None] = mapped_column(
        Numeric(precision=5, scale=4), nullable=True
    )  # Percentage as decimal
    podium_rate: Mapped[float | None] = mapped_column(
        Numeric(precision=5, scale=4), nullable=True
    )  # Percentage as decimal
    win_rate: Mapped[float | None] = mapped_column(
        Numeric(precision=5, scale=4), nullable=True
    )  # Percentage as decimal
    top10_rate: Mapped[float | None] = mapped_column(
        Numeric(precision=5, scale=4), nullable=True
    )  # Percentage as decimal

    # Points stats
    points_per_race: Mapped[float | None] = mapped_column(
        Numeric(precision=5, scale=2), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of DriverStats."""
        return (
            f"<DriverStats(id={self.id}, driver_id={self.driver_id}, "
            f"season={self.season}, wins={self.wins}, podiums={self.podiums}, "
            f"total_points={self.total_points})>"
        )
