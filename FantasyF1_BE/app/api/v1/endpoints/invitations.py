"""Invitations API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.league_invitation import InvitationStatus
from app.models.user import User
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
from app.schemas.team import TeamResponse
from app.services.invitation_service import InvitationService
from app.services.league_service import LeagueService

router = APIRouter()


@router.get("/received", response_model=InvitationListResponse, status_code=status.HTTP_200_OK)
async def list_received_invitations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> InvitationListResponse:
    """List invitations received by the current user."""
    status_enum = None
    if status_filter:
        try:
            status_enum = InvitationStatus(status_filter)
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}",
            ) from err

    invitations = await InvitationService.get_received_invitations(
        db=db,
        user_id=current_user.id,
        status=status_enum,
        skip=skip,
        limit=limit,
    )
    return InvitationListResponse(
        items=[InvitationResponse.model_validate(inv) for inv in invitations],
        total=len(invitations),
        skip=skip,
        limit=limit,
    )


@router.get("/sent", response_model=InvitationListResponse, status_code=status.HTTP_200_OK)
async def list_sent_invitations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    league_id: int | None = Query(None, description="Filter by league ID"),
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> InvitationListResponse:
    """List invitations sent by the current user."""
    status_enum = None
    if status_filter:
        try:
            status_enum = InvitationStatus(status_filter)
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}",
            ) from err

    invitations = await InvitationService.get_sent_invitations(
        db=db,
        user_id=current_user.id,
        league_id=league_id,
        status=status_enum,
        skip=skip,
        limit=limit,
    )
    return InvitationListResponse(
        items=[InvitationResponse.model_validate(inv) for inv in invitations],
        total=len(invitations),
        skip=skip,
        limit=limit,
    )


@router.get(
    "/leagues/{league_id}/invitations",
    response_model=InvitationListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_league_invitations(
    league_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> InvitationListResponse:
    """List all invitations for a league (creator/co-manager only)."""
    # Check if user is league creator or co-manager
    league = await LeagueService.get(db, league_id)
    if league.creator_id != current_user.id and not current_user.is_superuser:
        # TODO: Add co-manager check when co-manager system is implemented
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league creator can view invitations",
        )

    status_enum = None
    if status_filter:
        try:
            status_enum = InvitationStatus(status_filter)
        except ValueError as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}",
            ) from err

    invitations = await InvitationService.get_sent_invitations(
        db=db,
        user_id=current_user.id,
        league_id=league_id,
        status=status_enum,
        skip=skip,
        limit=limit,
    )
    return InvitationListResponse(
        items=[InvitationResponse.model_validate(inv) for inv in invitations],
        total=len(invitations),
        skip=skip,
        limit=limit,
    )


@router.post(
    "/leagues/{league_id}/invites/email",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_email_invitation(
    league_id: int,
    invitation_data: InvitationCreateEmail,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationResponse:
    """Create an email invitation to join a league (creator/co-manager only)."""
    # Check if user is league creator or co-manager
    league = await LeagueService.get(db, league_id)
    if league.creator_id != current_user.id and not current_user.is_superuser:
        # TODO: Add co-manager check when co-manager system is implemented
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league creator can send invitations",
        )

    try:
        invitation = await InvitationService.create_email_invitation(
            db=db, league_id=league_id, inviter_id=current_user.id, data=invitation_data
        )
        return InvitationResponse.model_validate(invitation)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post(
    "/leagues/{league_id}/invites/user-id",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_user_id_invitation(
    league_id: int,
    invitation_data: InvitationCreateUserId,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationResponse:
    """Create an invitation by user ID to join a league (creator/co-manager only)."""
    # Check if user is league creator or co-manager
    league = await LeagueService.get(db, league_id)
    if league.creator_id != current_user.id and not current_user.is_superuser:
        # TODO: Add co-manager check when co-manager system is implemented
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league creator can send invitations",
        )

    try:
        invitation = await InvitationService.create_user_id_invitation(
            db=db, league_id=league_id, inviter_id=current_user.id, data=invitation_data
        )
        return InvitationResponse.model_validate(invitation)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post(
    "/leagues/{league_id}/invites/username",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_username_invitation(
    league_id: int,
    invitation_data: InvitationCreateUsername,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationResponse:
    """Create an invitation by username to join a league (creator/co-manager only)."""
    # Check if user is league creator or co-manager
    league = await LeagueService.get(db, league_id)
    if league.creator_id != current_user.id and not current_user.is_superuser:
        # TODO: Add co-manager check when co-manager system is implemented
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league creator can send invitations",
        )

    try:
        invitation = await InvitationService.create_username_invitation(
            db=db, league_id=league_id, inviter_id=current_user.id, data=invitation_data
        )
        return InvitationResponse.model_validate(invitation)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post(
    "/leagues/{league_id}/invites/code",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_code_invitation(
    league_id: int,
    invitation_data: InvitationCreateCode,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationResponse:
    """Create an invite code for a league (creator/co-manager only)."""
    # Check if user is league creator or co-manager
    league = await LeagueService.get(db, league_id)
    if league.creator_id != current_user.id and not current_user.is_superuser:
        # TODO: Add co-manager check when co-manager system is implemented
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league creator can create invite codes",
        )

    try:
        invitation = await InvitationService.create_code_invitation(
            db=db, league_id=league_id, inviter_id=current_user.id, data=invitation_data
        )
        return InvitationResponse.model_validate(invitation)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get(
    "/invitations/{invitation_id}",
    response_model=InvitationDetailResponse,
    status_code=status.HTTP_200_OK,
)
async def get_invitation(
    invitation_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationDetailResponse:
    """Get invitation details."""
    invitation = await InvitationService.get(db, invitation_id)

    # Check if user is the invitee or inviter
    if (
        invitation.invitee_id != current_user.id
        and invitation.inviter_id != current_user.id
        and not current_user.is_superuser
    ):
        # For email invitations, check if current user's email matches
        if invitation.invitee_email:
            if current_user.email != invitation.invitee_email.lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to view this invitation",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this invitation",
            )

    # Get related information
    league = await LeagueService.get(db, invitation.league_id)

    response = InvitationDetailResponse.model_validate(invitation)
    response.league_name = league.name
    response.inviter_username = (
        current_user.username if current_user.id == invitation.inviter_id else None
    )

    return response


@router.post(
    "/invitations/{invitation_id}/accept",
    response_model=TeamResponse,
    status_code=status.HTTP_200_OK,
)
async def accept_invitation(
    invitation_id: int,
    accept_data: InvitationAccept,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TeamResponse:
    """Accept an invitation and join the league."""
    invitation = await InvitationService.get(db, invitation_id)

    try:
        invitation = await InvitationService.accept_invitation(
            db=db,
            invitation=invitation,
            user_id=current_user.id,
            team_name=accept_data.team_name,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    # Get the created team
    from app.services.fantasy_team_service import FantasyTeamService

    teams = await FantasyTeamService.get_user_teams(
        session=db, user_id=current_user.id, league_id=invitation.league_id
    )
    if teams:
        return TeamResponse.model_validate(teams[0])

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to create team after accepting invitation",
    )


@router.post(
    "/invitations/{invitation_id}/reject",
    response_model=InvitationResponse,
    status_code=status.HTTP_200_OK,
)
async def reject_invitation(
    invitation_id: int,
    reject_data: InvitationReject,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> InvitationResponse:
    """Reject an invitation."""
    invitation = await InvitationService.get(db, invitation_id)

    try:
        invitation = await InvitationService.reject_invitation(
            db=db,
            invitation=invitation,
            user_id=current_user.id,
            reason=reject_data.reason,
        )
        return InvitationResponse.model_validate(invitation)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.delete(
    "/invitations/{invitation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def cancel_invitation(
    invitation_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """Cancel an invitation (creator/co-manager only)."""
    invitation = await InvitationService.get(db, invitation_id)

    # Check if user is the inviter
    if invitation.inviter_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the inviter can cancel an invitation",
        )

    try:
        await InvitationService.cancel_invitation(db=db, invitation=invitation)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
