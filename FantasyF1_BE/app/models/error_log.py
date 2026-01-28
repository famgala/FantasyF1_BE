"""Error log model for tracking system errors and failures."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class ErrorLog(Base):
    """Model for logging system errors and failed operations."""

    __tablename__ = "error_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(default=datetime.utcnow, index=True)
    error_type: Mapped[str] = mapped_column(String(255), index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    endpoint: Mapped[str] = mapped_column(String(500), index=True, nullable=True)
    user_id: Mapped[int | None] = mapped_column(index=True, nullable=True)
    stack_trace: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String(50), index=True, nullable=False, default="error")
    request_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    response_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    resolved: Mapped[bool] = mapped_column(default=False, index=True)
    resolved_at: Mapped[datetime | None] = mapped_column(nullable=True)
    resolved_by: Mapped[int | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="error_logs", foreign_keys=[user_id])
    resolver: Mapped["User"] = relationship(
        "User", back_populates="resolved_error_logs", foreign_keys=[resolved_by]
    )

    __table_args__ = (
        Index("idx_error_logs_timestamp_severity", "timestamp", "severity"),
        Index("idx_error_logs_user_resolved", "user_id", "resolved"),
        Index("idx_error_logs_endpoint_severity", "endpoint", "severity"),
    )

    def __repr__(self) -> str:
        return f"<ErrorLog(id={self.id}, type={self.error_type}, severity={self.severity})>"
