"""Error log model for tracking system errors."""

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ErrorSeverity(str, Enum):
    """Error severity levels."""

    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ErrorLog(Base):
    """Error log model for tracking system errors."""

    __tablename__ = "error_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )
    level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    module: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)
    function: Mapped[str | None] = mapped_column(String(200), nullable=True)
    line_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    endpoint: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    method: Mapped[str | None] = mapped_column(String(10), nullable=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    request_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    stack_trace: Mapped[str | None] = mapped_column(Text, nullable=True)
    additional_data: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("idx_error_logs_timestamp_level", "timestamp", "level"),
        Index("idx_error_logs_module_level", "module", "level"),
    )

    def to_dict(self) -> dict:
        """Convert error log to dictionary.

        Returns:
            Dictionary representation of the error log
        """
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "level": self.level,
            "message": self.message,
            "module": self.module,
            "function": self.function,
            "line_number": self.line_number,
            "endpoint": self.endpoint,
            "method": self.method,
            "user_id": self.user_id,
            "request_id": self.request_id,
            "stack_trace": self.stack_trace,
            "additional_data": self.additional_data,
        }

    def __repr__(self) -> str:
        """String representation."""
        return (
            f"<ErrorLog(id={self.id}, level='{self.level}', "
            f"message='{self.message[:50]}...', timestamp={self.timestamp})>"
        )
