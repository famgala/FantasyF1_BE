"""Authentication schemas for login, registration, and tokens."""

from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class CheckEmailRequest(BaseModel):
    """Schema for checking if email exists."""

    email: EmailStr


class CheckEmailResponse(BaseModel):
    """Schema for email check response."""

    action: Literal["login", "register"]
    message: str


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for password reset request."""

    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match."""
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v


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
