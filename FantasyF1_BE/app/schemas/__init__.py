"""Schemas package for Pydantic models."""

from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    TokenPayload,
    TokenResponse,
)
from app.schemas.constructor import (
    ConstructorBase,
    ConstructorCreate,
    ConstructorListResponse,
    ConstructorResponse,
    ConstructorUpdate,
)
from app.schemas.driver import (
    DriverBase,
    DriverCreate,
    DriverListResponse,
    DriverResponse,
    DriverUpdate,
)
from app.schemas.league import (
    LeagueBase,
    LeagueCreate,
    LeagueDetailResponse,
    LeagueJoinRequest,
    LeagueListResponse,
    LeagueResponse,
    LeagueUpdate,
)
from app.schemas.race import (
    RaceBase,
    RaceCreate,
    RaceListResponse,
    RaceResponse,
    RaceUpdate,
)
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserResponse,
    UserUpdate,
)

__all__ = [
    # Constructor
    "ConstructorBase",
    "ConstructorCreate",
    "ConstructorListResponse",
    "ConstructorResponse",
    "ConstructorUpdate",
    # Driver
    "DriverBase",
    "DriverCreate",
    "DriverListResponse",
    "DriverResponse",
    "DriverUpdate",
    # League
    "LeagueBase",
    "LeagueCreate",
    "LeagueDetailResponse",
    "LeagueJoinRequest",
    "LeagueListResponse",
    "LeagueResponse",
    "LeagueUpdate",
    # Auth
    "LoginRequest",
    # Race
    "RaceBase",
    "RaceCreate",
    "RaceListResponse",
    "RaceResponse",
    "RaceUpdate",
    "RefreshTokenRequest",
    "TokenPayload",
    "TokenResponse",
    # User
    "UserBase",
    "UserCreate",
    "UserResponse",
    "UserUpdate",
]
