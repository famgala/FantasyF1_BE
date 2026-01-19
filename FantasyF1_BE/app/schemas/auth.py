"""Authentication schemas for login, registration, and tokens."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Schema for user login request."""

    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""

    sub: str  # user_id
    exp: int  # expiration timestamp


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh request."""

    refresh_token: str
