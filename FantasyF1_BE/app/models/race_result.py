"""Race Result model for F1 Fantasy game."""

from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RaceResult(Base):
    """Represents the actual race result for a driver.

    This model stores the official race results for each driver in a specific race,
    which are used to calculate fantasy points.

    Attributes:
        id: Primary key
        race_id: Foreign key to race
        driver_external_id: External ID of the driver from Jolpica API
        driver_name: Driver's name (cached for performance)
        position: Final finishing position (1-20, 0 for DNF)
        grid_position: Starting position on the grid
        laps_completed: Number of laps completed in the race
        points_earned: F1 championship points earned (25, 18, 15, 12, 10, 8, 6, 4, 2, 1)
        fastest_lap: Whether this driver recorded the fastest lap
        fastest_lap_time: Time of the fastest lap (in seconds)
        time_diff: Time difference to winner (in seconds, null for winner)
        time_diff_str: String representation of time difference (e.g., "+5.234")
        dnf: Whether the driver did not finish (Did Not Finish)
        dnf_reason: Reason for DNF (engine failure, accident, etc.)
        dns: Whether the driver did not start (Did Not Start)
        dsq: Whether the driver was disqualified
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """

    __tablename__ = "race_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), nullable=False, index=True)
    driver_external_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    driver_name: Mapped[str] = mapped_column(String(255), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # 1-20, 0 for DNF
    grid_position: Mapped[int] = mapped_column(Integer, nullable=True)
    laps_completed: Mapped[int] = mapped_column(Integer, nullable=True)
    points_earned: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )  # F1 championship points
    fastest_lap: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fastest_lap_time: Mapped[float | None] = mapped_column(
        Numeric(precision=10, scale=3), nullable=True
    )
    time_diff: Mapped[float | None] = mapped_column(Numeric(precision=10, scale=3), nullable=True)
    time_diff_str: Mapped[str | None] = mapped_column(String(20), nullable=True)
    dnf: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dnf_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dns: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dsq: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        """Return string representation of RaceResult."""
        return (
            f"<RaceResult(id={self.id}, race_id={self.race_id}, "
            f"driver='{self.driver_name}', position={self.position}, "
            f"points={self.points_earned})>"
        )
