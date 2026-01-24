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
from app.schemas.invitation import (
    InvitationAccept,
    InvitationCreateCode,
    InvitationCreateEmail,
    InvitationCreateUserId,
    InvitationCreateUsername,
    InvitationDetailResponse,
    InvitationListResponse,
    InvitationReject,
    InvitationResponse,
)
from app.schemas.leaderboard import (
    LeaderboardEntry,
    LeaderboardResponse,
    UserRankResponse,
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
from app.schemas.notification import (
    MarkAsReadRequest,
    NotificationCreate,
    NotificationListResponse,
    NotificationResponse,
    NotificationType,
    NotificationUpdate,
)
from app.schemas.race import (
    RaceBase,
    RaceCreate,
    RaceListResponse,
    RaceResponse,
    RaceUpdate,
)
from app.schemas.team import (
    TeamBase,
    TeamCreate,
    TeamListResponse,
    TeamPickCreate,
    TeamPickResponse,
    TeamResponse,
    TeamUpdate,
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
    # Invitation
    "InvitationAccept",
    "InvitationCreateCode",
    "InvitationCreateEmail",
    "InvitationCreateUserId",
    "InvitationCreateUsername",
    "InvitationDetailResponse",
    "InvitationListResponse",
    "InvitationReject",
    "InvitationResponse",
    # League
    "LeagueBase",
    "LeagueCreate",
    "LeagueDetailResponse",
    "LeagueJoinRequest",
    "LeagueListResponse",
    "LeagueResponse",
    "LeagueUpdate",
    # Leaderboard
    "LeaderboardEntry",
    "LeaderboardResponse",
    "UserRankResponse",
    # Notification
    "MarkAsReadRequest",
    "NotificationCreate",
    "NotificationListResponse",
    "NotificationResponse",
    "NotificationType",
    "NotificationUpdate",
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
    # Team
    "TeamBase",
    "TeamCreate",
    "TeamListResponse",
    "TeamPickCreate",
    "TeamPickResponse",
    "TeamResponse",
    "TeamUpdate",
    # User
    "UserBase",
    "UserCreate",
    "UserResponse",
    "UserUpdate",
]
