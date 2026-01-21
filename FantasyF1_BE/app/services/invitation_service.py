"""Service layer for League Invitation operations.

Provides invitation management for leagues in the F1 Fantasy game.
"""

import secrets
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.core.logging import get_logger
from app.models.league_invitation import (
    InvitationStatus,
    InvitationType,
    LeagueInvitation,
)
from app.models.user import User
from app.schemas.invitation import (
    InvitationCreateCode,
    InvitationCreateEmail,
    InvitationCreateUserId,
    InvitationCreateUsername,
)

logger = get_logger(__name__)


class InvitationService:
    """Service for League Invitation operations.

    League owners/co-managers can invite users to join their league
    via email, user ID, username, or invite code.
    """

    @staticmethod
    def _generate_invite_code() -> str:
        """Generate a unique invite code.

        Returns:
            Random alphanumeric code for invitation
        """
        return secrets.token_urlsafe(24)[:32]

    @staticmethod
    async def get(db: AsyncSession, invitation_id: int) -> LeagueInvitation:
        """Get an invitation by ID.

        Args:
            db: Database session
            invitation_id: Invitation ID

        Returns:
            Invitation object

        Raises:
            NotFoundError: If invitation not found
        """
        result = await db.execute(
            select(LeagueInvitation).where(LeagueInvitation.id == invitation_id)
        )
        invitation = result.scalars().first()
        if invitation is None:
            raise NotFoundError("Invitation not found")
        return invitation

    @staticmethod
    async def get_by_code(db: AsyncSession, code: str) -> LeagueInvitation | None:
        """Get an invitation by invite code.

        Args:
            db: Database session
            code: Invite code

        Returns:
            Invitation object or None if not found
        """
        result = await db.execute(
            select(LeagueInvitation).where(LeagueInvitation.invite_code == code)
        )
        return result.scalars().first()

    @staticmethod
    async def get_user_invitations(
        db: AsyncSession,
        user_id: int,
        status: InvitationStatus | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[LeagueInvitation]:
        """Get invitations for a user.

        Args:
            db: Database session
            user_id: User ID
            status: Filter by status (optional)
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of Invitation objects
        """
        query = select(LeagueInvitation).where(LeagueInvitation.invitee_id == user_id)

        if status:
            query = query.where(LeagueInvitation.status == status.value)

        query = query.order_by(LeagueInvitation.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_received_invitations(
        db: AsyncSession,
        user_id: int,
        status: InvitationStatus | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[LeagueInvitation]:
        """Get invitations received by a user.

        Args:
            db: Database session
            user_id: User ID
            status: Filter by status (optional)
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of Invitation objects
        """
        query = select(LeagueInvitation).where(LeagueInvitation.invitee_id == user_id)

        if status:
            query = query.where(LeagueInvitation.status == status.value)

        query = query.order_by(LeagueInvitation.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_sent_invitations(
        db: AsyncSession,
        user_id: int,
        league_id: int | None = None,
        status: InvitationStatus | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[LeagueInvitation]:
        """Get invitations sent by a user.

        Args:
            db: Database session
            user_id: User ID (inviter)
            league_id: Filter by league ID (optional)
            status: Filter by status (optional)
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of Invitation objects
        """
        query = select(LeagueInvitation).where(LeagueInvitation.inviter_id == user_id)

        if league_id:
            query = query.where(LeagueInvitation.league_id == league_id)

        if status:
            query = query.where(LeagueInvitation.status == status.value)

        query = query.order_by(LeagueInvitation.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def create_email_invitation(
        db: AsyncSession, league_id: int, inviter_id: int, data: InvitationCreateEmail
    ) -> LeagueInvitation:
        """Create an email invitation.

        Args:
            db: Database session
            league_id: League ID
            inviter_id: User ID of the inviter
            data: Email invitation data

        Returns:
            Created Invitation object

        Raises:
            ValidationError: If invitation already exists
        """
        # Check for existing pending invitation
        existing = await db.execute(
            select(LeagueInvitation).where(
                LeagueInvitation.league_id == league_id,
                LeagueInvitation.invitee_email == data.email.lower(),
                LeagueInvitation.status == InvitationStatus.PENDING.value,
            )
        )
        if existing.scalars().first():
            raise ValidationError(f"Pending invitation already exists for {data.email}")

        # Generate invite code and set expiration
        invite_code = InvitationService._generate_invite_code()
        expires_at = datetime.utcnow() + timedelta(days=7)

        logger.info(f"Creating email invitation for {data.email} to league {league_id}")

        invitation = LeagueInvitation(
            league_id=league_id,
            inviter_id=inviter_id,
            invitee_email=data.email.lower(),
            invite_code=invite_code,
            status=InvitationStatus.PENDING.value,
            invitation_type=InvitationType.EMAIL.value,
            message=data.message,
            expires_at=expires_at,
        )
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)

        logger.info(f"Email invitation created: {invitation.id}")
        return invitation

    @staticmethod
    async def create_user_id_invitation(
        db: AsyncSession, league_id: int, inviter_id: int, data: InvitationCreateUserId
    ) -> LeagueInvitation:
        """Create an invitation by user ID.

        Args:
            db: Database session
            league_id: League ID
            inviter_id: User ID of the inviter
            data: User ID invitation data

        Returns:
            Created Invitation object

        Raises:
            NotFoundError: If invitee user not found
            ValidationError: If invitation already exists
        """
        # Check if user exists
        result = await db.execute(select(User).where(User.id == data.user_id))
        invitee = result.scalars().first()
        if not invitee:
            raise NotFoundError(f"User with ID {data.user_id} not found")

        # Check for existing pending invitation
        existing = await db.execute(
            select(LeagueInvitation).where(
                LeagueInvitation.league_id == league_id,
                LeagueInvitation.invitee_id == data.user_id,
                LeagueInvitation.status == InvitationStatus.PENDING.value,
            )
        )
        if existing.scalars().first():
            raise ValidationError(f"Pending invitation already exists for user {data.user_id}")

        logger.info(f"Creating user ID invitation for user {data.user_id} to league {league_id}")

        invitation = LeagueInvitation(
            league_id=league_id,
            inviter_id=inviter_id,
            invitee_id=data.user_id,
            invitee_username=invitee.username,
            status=InvitationStatus.PENDING.value,
            invitation_type=InvitationType.USER_ID.value,
            message=data.message,
        )
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)

        logger.info(f"User ID invitation created: {invitation.id}")
        return invitation

    @staticmethod
    async def create_username_invitation(
        db: AsyncSession, league_id: int, inviter_id: int, data: InvitationCreateUsername
    ) -> LeagueInvitation:
        """Create an invitation by username.

        Args:
            db: Database session
            league_id: League ID
            inviter_id: User ID of the inviter
            data: Username invitation data

        Returns:
            Created Invitation object

        Raises:
            NotFoundError: If invitee username not found
            ValidationError: If invitation already exists
        """
        # Check if user exists
        result = await db.execute(select(User).where(User.username == data.username))
        invitee = result.scalars().first()
        if not invitee:
            raise NotFoundError(f"User with username '{data.username}' not found")

        # Check for existing pending invitation
        existing = await db.execute(
            select(LeagueInvitation).where(
                LeagueInvitation.league_id == league_id,
                LeagueInvitation.invitee_id == invitee.id,
                LeagueInvitation.status == InvitationStatus.PENDING.value,
            )
        )
        if existing.scalars().first():
            raise ValidationError(f"Pending invitation already exists for user '{data.username}'")

        logger.info(
            f"Creating username invitation for user '{data.username}' to league {league_id}"
        )

        invitation = LeagueInvitation(
            league_id=league_id,
            inviter_id=inviter_id,
            invitee_id=invitee.id,
            invitee_username=invitee.username,
            status=InvitationStatus.PENDING.value,
            invitation_type=InvitationType.USERNAME.value,
            message=data.message,
        )
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)

        logger.info(f"Username invitation created: {invitation.id}")
        return invitation

    @staticmethod
    async def create_code_invitation(
        db: AsyncSession, league_id: int, inviter_id: int, data: InvitationCreateCode
    ) -> LeagueInvitation:
        """Create an invite code invitation.

        Args:
            db: Database session
            league_id: League ID
            inviter_id: User ID of the inviter
            data: Code invitation data

        Returns:
            Created Invitation object

        Raises:
            ValidationError: If too many active codes
        """
        # Check for existing active codes (limit to 5 per league)
        result = await db.execute(
            select(func.count(LeagueInvitation.id)).where(
                LeagueInvitation.league_id == league_id,
                LeagueInvitation.invitation_type == InvitationType.CODE.value,
                LeagueInvitation.status == InvitationStatus.PENDING.value,
            )
        )
        active_count = result.scalar_one()
        if active_count >= 5:
            raise ValidationError("Maximum of 5 active invite codes reached")

        # Generate invite code and set expiration
        invite_code = InvitationService._generate_invite_code()
        expires_at = datetime.utcnow() + timedelta(days=7)

        logger.info(f"Creating invite code invitation for league {league_id}")

        invitation = LeagueInvitation(
            league_id=league_id,
            inviter_id=inviter_id,
            invite_code=invite_code,
            status=InvitationStatus.PENDING.value,
            invitation_type=InvitationType.CODE.value,
            message=data.message,
            expires_at=expires_at,
        )
        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)

        logger.info(f"Invite code invitation created: {invitation.id} - code: {invite_code}")
        return invitation

    @staticmethod
    async def accept_invitation(
        db: AsyncSession,
        invitation: LeagueInvitation,
        user_id: int,
        team_name: str,
    ) -> LeagueInvitation:
        """Accept an invitation.

        Args:
            db: Database session
            invitation: Invitation object
            user_id: User ID accepting the invitation
            team_name: Team name to create

        Returns:
            Updated Invitation object

        Raises:
            ValidationError: If invitation cannot be accepted
        """
        from app.services.fantasy_team_service import FantasyTeamService

        # Check if invitation can be accepted
        if invitation.status != InvitationStatus.PENDING.value:
            raise ValidationError(f"Cannot accept invitation with status '{invitation.status}'")

        # Check if expired
        if invitation.expires_at and invitation.expires_at < datetime.utcnow():
            invitation.status = InvitationStatus.EXPIRED.value
            await db.commit()
            raise ValidationError("Invitation has expired")

        # For email/username/user_id invitations, verify user matches
        if invitation.invitation_type in [
            InvitationType.EMAIL.value,
            InvitationType.USERNAME.value,
            InvitationType.USER_ID.value,
        ]:
            # Try to find user by email if invitation_type is email
            if invitation.invitation_type == InvitationType.EMAIL.value:
                result = await db.execute(
                    select(User).where(User.email == invitation.invitee_email)
                )
                invitee = result.scalars().first()
                if not invitee or invitee.id != user_id:
                    raise ValidationError("You are not the invited user")
            elif invitation.invitee_id and invitation.invitee_id != user_id:
                raise ValidationError("You are not the invited user")

        logger.info(f"Accepting invitation {invitation.id} for user {user_id}")

        # Create team in the league
        try:
            await FantasyTeamService.create_team(
                session=db,
                user_id=user_id,
                league_id=invitation.league_id,
                name=team_name,
            )
        except (ConflictError, ValueError) as e:
            raise ValidationError(str(e)) from e

        # Update invitation status
        invitation.status = InvitationStatus.ACCEPTED.value
        invitation.responded_at = datetime.utcnow()
        await db.commit()
        await db.refresh(invitation)

        logger.info(f"Invitation {invitation.id} accepted by user {user_id}")
        return invitation

    @staticmethod
    async def reject_invitation(
        db: AsyncSession,
        invitation: LeagueInvitation,
        user_id: int,
        reason: str | None = None,
    ) -> LeagueInvitation:
        """Reject an invitation.

        Args:
            db: Database session
            invitation: Invitation object
            user_id: User ID rejecting the invitation
            reason: Optional reason for rejection

        Returns:
            Updated Invitation object

        Raises:
            ValidationError: If invitation cannot be rejected
        """
        # Check if invitation can be rejected
        if invitation.status != InvitationStatus.PENDING.value:
            raise ValidationError(f"Cannot reject invitation with status '{invitation.status}'")

        # For email/username/user_id invitations, verify user matches
        if invitation.invitation_type in [
            InvitationType.EMAIL.value,
            InvitationType.USERNAME.value,
            InvitationType.USER_ID.value,
        ]:
            # Try to find user by email if invitation_type is email
            if invitation.invitation_type == InvitationType.EMAIL.value:
                result = await db.execute(
                    select(User).where(User.email == invitation.invitee_email)
                )
                invitee = result.scalars().first()
                if not invitee or invitee.id != user_id:
                    raise ValidationError("You are not the invited user")
            elif invitation.invitee_id and invitation.invitee_id != user_id:
                raise ValidationError("You are not the invited user")

        logger.info(f"Rejecting invitation {invitation.id} for user {user_id}")

        # Update invitation status
        invitation.status = InvitationStatus.REJECTED.value
        invitation.responded_at = datetime.utcnow()
        if reason:
            invitation.message = f"Rejected: {reason}"
        await db.commit()
        await db.refresh(invitation)

        logger.info(f"Invitation {invitation.id} rejected by user {user_id}")
        return invitation

    @staticmethod
    async def cancel_invitation(db: AsyncSession, invitation: LeagueInvitation) -> None:
        """Cancel an invitation (delete it).

        Args:
            db: Database session
            invitation: Invitation object to cancel

        Raises:
            ValidationError: If invitation cannot be cancelled
        """
        if invitation.status != InvitationStatus.PENDING.value:
            raise ValidationError(
                f"Cannot cancel invitation with status '{invitation.status}'. "
                "Only pending invitations can be cancelled."
            )

        logger.info(f"Cancelling invitation {invitation.id}")

        await db.delete(invitation)
        await db.commit()

        logger.info(f"Invitation {invitation.id} cancelled")

    @staticmethod
    async def expire_old_invitations(db: AsyncSession) -> int:
        """Expire invitations that are past their expiration date.

        Args:
            db: Database session

        Returns:
            Number of invitations expired
        """
        result = await db.execute(
            select(LeagueInvitation).where(
                LeagueInvitation.status == InvitationStatus.PENDING.value,
                LeagueInvitation.expires_at < datetime.utcnow(),
            )
        )
        invitations = result.scalars().all()

        count = 0
        for invitation in invitations:
            invitation.status = InvitationStatus.EXPIRED.value
            count += 1

        await db.commit()

        logger.info(f"Expired {count} old invitations")
        return count
