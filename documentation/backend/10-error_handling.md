# Error Handling

This document describes the error handling strategy for the Fantasy F1 Backend system, including custom exceptions, global handlers, and error response formats.

---

## Error Handling Overview

The system uses a comprehensive error handling strategy to ensure:
- Consistent error responses
- Proper logging of errors
- User-friendly error messages
- Graceful degradation

---

## Custom Exceptions

### Exception Hierarchy

```python
# app/core/exceptions.py
from typing import Any, Dict, Optional

class BaseAPIException(Exception):
    """Base exception for all API errors."""
    
    status_code: int = 500
    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"
    details: Optional[Dict[str, Any]] = None
    
    def __init__(
        self,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if message:
            self.message = message
        if details:
            self.details = details
        super().__init__(self.message)


class ValidationError(BaseAPIException):
    """Validation error (400)."""
    
    status_code: int = 400
    code: str = "VALIDATION_ERROR"
    message: str = "Invalid input data"


class NotFoundError(BaseAPIException):
    """Resource not found error (404)."""
    
    status_code: int = 404
    code: str = "NOT_FOUND"
    message: str = "Resource not found"


class AuthenticationError(BaseAPIException):
    """Authentication error (401)."""
    
    status_code: int = 401
    code: str = "AUTHENTICATION_ERROR"
    message: str = "Authentication required"


class PermissionError(BaseAPIException):
    """Permission error (403)."""
    
    status_code: int = 403
    code: str = "PERMISSION_ERROR"
    message: str = "Insufficient permissions"


class ConflictError(BaseAPIException):
    """Resource conflict error (409)."""
    
    status_code: int = 409
    code: str = "CONFLICT"
    message: str = "Resource conflict"


class DatabaseError(BaseAPIException):
    """Database error (500)."""
    
    status_code: int = 500
    code: str = "DATABASE_ERROR"
    message: str = "Database operation failed"


class ExternalAPIError(BaseAPIException):
    """External API error (502)."""
    
    status_code: int = 502
    code: str = "EXTERNAL_API_ERROR"
    message: str = "External API request failed"
```

---

## Global Exception Handler

### Implementation

```python
# app/core/error_handlers.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.core.exceptions import BaseAPIException
import logging

logger = logging.getLogger(__name__)


async def base_api_exception_handler(
    request: Request,
    exc: BaseAPIException
) -> JSONResponse:
    """Handle custom API exceptions."""
    logger.error(
        f"API Exception: {exc.code} - {exc.message}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "details": exc.details
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    details = []
    for error in exc.errors():
        details.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(
        f"Validation Error: {request.url.path}",
        extra={"details": details}
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "details": details
            }
        }
    )


async def integrity_error_handler(
    request: Request,
    exc: IntegrityError
) -> JSONResponse:
    """Handle database integrity errors."""
    error_message = str(exc.orig)
    
    if "duplicate key" in error_message.lower():
        code = "DUPLICATE_ENTRY"
        message = "Duplicate entry"
    elif "foreign key" in error_message.lower():
        code = "FOREIGN_KEY_ERROR"
        message = "Foreign key constraint failed"
    else:
        code = "DATABASE_ERROR"
        message = "Database integrity error"
    
    logger.error(
        f"Database Integrity Error: {code}",
        extra={
            "error": error_message,
            "path": request.url.path
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message
            }
        }
    )


async def sqlalchemy_error_handler(
    request: Request,
    exc: SQLAlchemyError
) -> JSONResponse:
    """Handle general SQLAlchemy errors."""
    logger.error(
        f"Database Error: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "Database operation failed"
            }
        }
    )


async def generic_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle generic exceptions."""
    logger.error(
        f"Unhandled Exception: {type(exc).__name__}",
        exc_info=exc,
        extra={
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred"
            }
        }
    )
```

### Register Handlers

```python
# app/main.py
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.core.error_handlers import (
    base_api_exception_handler,
    validation_exception_handler,
    integrity_error_handler,
    sqlalchemy_error_handler,
    generic_exception_handler
)
from app.core.exceptions import BaseAPIException

app = FastAPI()

# Register exception handlers
app.add_exception_handler(BaseAPIException, base_api_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_error_handler)
app.add_exception_handler(Exception, generic_exception_handler)
```

---

## Error Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "username",
      "message": "Username must be between 3 and 50 characters"
    }
  }
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| AUTHENTICATION_ERROR | 401 | Authentication required/failed |
| PERMISSION_ERROR | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate, etc.) |
| DUPLICATE_ENTRY | 409 | Database duplicate entry |
| FOREIGN_KEY_ERROR | 409 | Foreign key constraint failed |
| DATABASE_ERROR | 500 | Database operation failed |
| EXTERNAL_API_ERROR | 502 | External API request failed |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Using Custom Exceptions

### In Services

```python
# app/services/team_service.py
from app.core.exceptions import ValidationError, NotFoundError

class TeamService:
    def create_team(self, team_data: TeamCreate, user_id: int):
        # Check if team exists
        existing = self.db.query(Team).filter(
            Team.user_id == user_id,
            Team.league_id == team_data.league_id
        ).first()
        
        if existing:
            raise ValidationError(
                "User already has a team in this league",
                details={"league_id": team_data.league_id}
            )
        
        # Validate budget
        if total_cost > self.BUDGET_LIMIT:
            raise ValidationError(
                f"Team cost {total_cost}M exceeds budget {self.BUDGET_LIMIT}M",
                details={
                    "cost": total_cost,
                    "budget": self.BUDGET_LIMIT
                }
            )
        
        # ... continue with creation
```

### In Endpoints

```python
# app/api/v1/endpoints/teams.py
from fastapi import APIRouter, Depends
from app.core.exceptions import NotFoundError

@router.get("/teams/{team_id}")
async def get_team(team_id: int, db: AsyncSession = Depends(get_db)):
    """Get team by ID."""
    team = await db.query(Team).get(team_id)
    
    if not team:
        raise NotFoundError(
            "Team not found",
            details={"team_id": team_id}
        )
    
    return team
```

---

## Logging

### Error Logging

```python
import logging

logger = logging.getLogger(__name__)

# Different log levels
logger.debug("Detailed debug information")
logger.info("Informational message")
logger.warning("Warning message")
logger.error("Error occurred", exc_info=True)
logger.critical("Critical error")

# Structured logging
logger.error(
    "Database connection failed",
    extra={
        "error_code": "DB_CONN_FAIL",
        "database": "fantasy_f1",
        "host": "localhost"
    }
)
```

### Logging Configuration

```python
# app/core/logging.py
import logging
from app.core.config import settings

def setup_logging():
    """Configure application logging."""
    
    logging.basicConfig(
        level=settings.LOG_LEVEL,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler("logs/app.log")
        ]
    )
    
    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("celery").setLevel(logging.INFO)
```

---

## Retry Logic

### Exponential Backoff

```python
# app/core/retry.py
import time
from functools import wraps
from typing import Type, Tuple

def retry_with_backoff(
    retries: int = 3,
    delays: Tuple[float, ...] = (1, 2, 4),
    exceptions: Tuple[Type[Exception], ...] = (Exception,)
):
    """
    Decorator to retry function with exponential backoff.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt, delay in enumerate(delays, start=1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as exc:
                    last_exception = exc
                    
                    if attempt == retries:
                        break
                    
                    logging.warning(
                        f"Attempt {attempt}/{retries} failed: {exc}. "
                        f"Retrying in {delay}s..."
                    )
                    time.sleep(delay)
            
            logging.error(
                f"All {retries} attempts failed",
                exc_info=last_exception
            )
            raise last_exception
        
        return wrapper
    return decorator


# Usage
@retry_with_backoff(
    retries=3,
    delays=(1, 2, 4),
    exceptions=(ConnectionError, TimeoutError)
)
async def fetch_external_api_data(url: str):
    """Fetch data from external API with retries."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
```

---

## Error Monitoring

### Sentry Integration

```python
# app/core/monitoring.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from app.core.config import settings

def setup_sentry():
    """Initialize Sentry error tracking."""
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[FastApiIntegration()],
            traces_sample_rate=0.1,
            environment=settings.ENVIRONMENT
        )
```

---

## Best Practices

### 1. Error Handling

- Use custom exceptions for business logic errors
- Provide meaningful error messages
- Include relevant details in error responses
- Log all errors with context

### 2. User Experience

- Don't expose internal implementation details
- Provide actionable error messages
- Use appropriate HTTP status codes
- Implement graceful degradation

### 3. Logging

- Log errors at appropriate levels
- Include context in log messages
- Don't log sensitive data
- Use structured logging for better analysis

### 4. Retry Logic

- Use exponential backoff
- Set reasonable retry limits
- Only retry transient errors
- Log retry attempts

---

## Related Documentation

- [API Endpoints](api_endpoints.md) - Error responses in API
- [Security](security.md) - Security-related error handling
- [Testing](testing.md) - Testing error scenarios