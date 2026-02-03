"""User schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Base user schema with common fields."""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str | None = Field(None, max_length=255)


class UserCreate(UserBase):
    """Schema for user registration."""

    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "username": "testuser",
                    "email": "test@example.com",
                    "full_name": "Test User",
                    "password": "TestPass123",
                }
            ]
        }
    )


class UserUpdate(BaseModel):
    """Schema for updating user information."""

    email: EmailStr | None = None
    full_name: str | None = Field(None, max_length=255)
    password: str | None = None
    is_active: bool | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str | None) -> str | None:
        """Validate password strength if provided."""
        if v is not None:
            if len(v) < 8:
                raise ValueError("Password must be at least 8 characters long")
            if not any(c.isupper() for c in v):
                raise ValueError("Password must contain at least one uppercase letter")
            if not any(c.islower() for c in v):
                raise ValueError("Password must contain at least one lowercase letter")
            if not any(c.isdigit() for c in v):
                raise ValueError("Password must contain at least one digit")
        return v


class UserInDBBase(UserBase):
    """Base schema for user data from database."""

    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserInDBBase):
    """Schema for user response."""

    pass


class UserInDB(UserInDBBase):
    """Schema for user data in database (includes hashed password)."""

    hashed_password: str


class UserSearchResponse(BaseModel):
    """Schema for user search results."""

    id: int
    username: str
    email: str
    full_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class UserPreferencesResponse(BaseModel):
    """Schema for user preferences response."""

    # Email notification preferences
    notify_race_completed: bool
    notify_draft_turn: bool
    notify_league_invitations: bool
    notify_team_updates: bool

    # Display preferences
    theme_preference: str
    language_preference: str
    timezone_preference: str

    # Privacy settings
    profile_visibility: str
    show_email_to_league_members: bool

    # Auto-pick preferences
    auto_pick_enabled: bool
    auto_pick_strategy: str

    model_config = ConfigDict(from_attributes=True)


class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences."""

    # Email notification preferences
    notify_race_completed: bool | None = None
    notify_draft_turn: bool | None = None
    notify_league_invitations: bool | None = None
    notify_team_updates: bool | None = None

    # Display preferences
    theme_preference: str | None = Field(None, pattern="^(light|dark|system)$")
    language_preference: str | None = Field(None, min_length=2, max_length=10)
    timezone_preference: str | None = Field(None, min_length=1, max_length=50)

    # Privacy settings
    profile_visibility: str | None = Field(None, pattern="^(public|private|league_only)$")
    show_email_to_league_members: bool | None = None

    # Auto-pick preferences
    auto_pick_enabled: bool | None = None
    auto_pick_strategy: str | None = Field(None, pattern="^(highest_ranked|random|balanced)$")
