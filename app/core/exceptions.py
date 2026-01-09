"""Custom exceptions for the application"""

from typing import Any


class FantasyF1Exception(Exception):
    """Base exception for Fantasy F1 application"""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class NotFoundException(FantasyF1Exception):
    """Exception raised when a resource is not found"""

    pass


class BadRequestException(FantasyF1Exception):
    """Exception raised for bad requests"""

    pass


class UnauthorizedException(FantasyF1Exception):
    """Exception raised for unauthorized access"""

    pass


class ForbiddenException(FantasyF1Exception):
    """Exception raised for forbidden access"""

    pass


class ConflictException(FantasyF1Exception):
    """Exception raised for conflicts (e.g., duplicate resources)"""

    pass


class ValidationException(FantasyF1Exception):
    """Exception raised for validation errors"""

    pass
