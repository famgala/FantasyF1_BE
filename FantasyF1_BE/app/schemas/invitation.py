"""Schemas for league invitations."""

from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.league_invitation import InvitationStatus, InvitationType


class InvitationBase(BaseModel):
    """Base schema for league invitations."""

    message: str | None = Field(None, max_length=500, description="Custom message from inviter")


class InvitationCreateEmail(BaseModel):
    """Schema for creating an email invitation."""

    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$", description="Invitee email address")
    message: str | None = Field(None, max_length=500, description="Custom message from inviter")


class InvitationCreateUserId(BaseModel):
    """Schema for creating an invitation by user ID."""

    user_id: int = Field(..., gt=0, description="Invitee user ID")
    message: str | None = Field(None, max_length=500, description="Custom message from inviter")


class InvitationCreateUsername(BaseModel):
    """Schema for creating an invitation by username."""

    username: str = Field(..., min_length=3, max_length=50, description="Invitee username")
    message: str | None = Field(None, max_length=500, description="Custom message from inviter")


class InvitationCreateCode(BaseModel):
    """Schema for creating an invite code invitation."""

    message: str | None = Field(None, max_length=500, description="Custom message from inviter")


class InvitationResponse(BaseModel):
    """Schema for invitation response."""

    id: int
    league_id: int
    inviter_id: int
    invitee_id: int | None = None
    invitee_email: str | None = None
    invitee_username: str | None = None
    invite_code: str | None = None
    status: str
    invitation_type: str
    message: str | None = None
    expires_at: datetime | None = None
    responded_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        """Validate status is a valid InvitationStatus."""
        allowed_status = [status.value for status in InvitationStatus]
        if v not in allowed_status:
            raise ValueError(f"Invalid status. Must be one of: {allowed_status}")
        return v

    @field_validator("invitation_type", mode="before")
    @classmethod
    def validate_invitation_type(cls, v: str) -> str:
        """Validate invitation_type is a valid InvitationType."""
        allowed_types = [inv_type.value for inv_type in InvitationType]
        if v not in allowed_types:
            raise ValueError(f"Invalid invitation_type. Must be one of: {allowed_types}")
        return v

    class Config:
        """Pydantic config."""

        from_attributes = True


class InvitationDetailResponse(InvitationResponse):
    """Detailed invitation response with related information."""

    league_name: str | None = None
    inviter_username: str | None = None
    invitee_username_full: str | None = None
    invitee_email_full: str | None = None


class InvitationAccept(BaseModel):
    """Schema for accepting an invitation."""

    team_name: str = Field(..., min_length=3, max_length=100, description="Team name to create")


class InvitationReject(BaseModel):
    """Schema for rejecting an invitation."""

    reason: str | None = Field(None, max_length=500, description="Optional reason for rejection")


class InvitationListResponse(BaseModel):
    """Schema for listing invitations."""

    items: list[InvitationResponse]
    total: int
    skip: int
    limit: int
