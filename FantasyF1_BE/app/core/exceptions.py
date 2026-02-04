"""Custom exceptions for the application"""

from typing import Any


class FantasyF1Error(Exception):
    """Base exception for Fantasy F1 application"""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(FantasyF1Error):
    """Exception raised when a resource is not found"""

    pass


class BadRequestError(FantasyF1Error):
    """Exception raised for bad requests"""

    pass


class UnauthorizedError(FantasyF1Error):
    """Exception raised for unauthorized access"""

    pass


class ForbiddenError(FantasyF1Error):
    """Exception raised for forbidden access"""

    pass


class ConflictError(FantasyF1Error):
    """Exception raised for conflicts (e.g., duplicate resources)"""

    pass


class ValidationError(FantasyF1Error):
    """Exception raised for validation errors"""

    pass


class PermissionError(FantasyF1Error):
    """Exception raised for permission errors"""

    pass
