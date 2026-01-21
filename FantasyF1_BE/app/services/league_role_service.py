"""Service for league role management."""


from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, PermissionError
from app.models.league_role import LeagueRole
from app.schemas.league_role import UserRole


class LeagueRoleService:
    """Service for managing league roles."""

    @staticmethod
    async def get_user_role(
        session: AsyncSession,
        league_id: int,
        user_id: int,
    ) -> LeagueRole | None:
        """Get user's role in a league."""
        result = await session.execute(
            select(LeagueRole).where(
                and_(LeagueRole.league_id == league_id, LeagueRole.user_id == user_id)
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_league_roles(
        session: AsyncSession,
        league_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[LeagueRole]:
        """Get all roles in a league."""
        result = await session.execute(
            select(LeagueRole).where(LeagueRole.league_id == league_id).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def create_creator_role(
        session: AsyncSession,
        league_id: int,
        user_id: int,
    ) -> LeagueRole:
        """Create a creator role for the league creator."""
        role = LeagueRole(
            league_id=league_id,
            user_id=user_id,
            role=UserRole.CREATOR.value,
        )
        session.add(role)
        await session.flush()
        return role

    @staticmethod
    async def promote_to_co_manager(
        session: AsyncSession,
        league_id: int,
        user_id: int,
        promoter_id: int,
    ) -> LeagueRole:
        """Promote a user to co-manager role."""
        # Check if promoter has permission (must be creator or co-manager)
        promoter_role = await LeagueRoleService.get_user_role(session, league_id, promoter_id)
        if not promoter_role or promoter_role.role not in [
            UserRole.CREATOR.value,
            UserRole.CO_MANAGER.value,
        ]:
            raise PermissionError("You don't have permission to promote users")

        # Get or create role for the user
        user_role = await LeagueRoleService.get_user_role(session, league_id, user_id)
        if user_role:
            if user_role.role == UserRole.CREATOR.value:
                raise ConflictError("Cannot promote the creator")
            user_role.role = UserRole.CO_MANAGER.value
            await session.flush()
            return user_role
        else:
            # Create co-manager role
            role = LeagueRole(
                league_id=league_id,
                user_id=user_id,
                role=UserRole.CO_MANAGER.value,
            )
            session.add(role)
            await session.flush()
            return role

    @staticmethod
    async def demote_to_member(
        session: AsyncSession,
        league_id: int,
        user_id: int,
        demoter_id: int,
    ) -> LeagueRole:
        """Demote a co-manager to member role."""
        # Check if demoter has permission (must be creator)
        demoter_role = await LeagueRoleService.get_user_role(session, league_id, demoter_id)
        if not demoter_role or demoter_role.role != UserRole.CREATOR.value:
            raise PermissionError("Only the creator can demote co-managers")

        # Get user role
        user_role = await LeagueRoleService.get_user_role(session, league_id, user_id)
        if not user_role:
            raise NotFoundError("User role not found")

        if user_role.role == UserRole.CREATOR.value:
            raise ConflictError("Cannot demote the creator")

        user_role.role = UserRole.MEMBER.value
        await session.flush()
        return user_role

    @staticmethod
    async def has_permission(
        session: AsyncSession,
        league_id: int,
        user_id: int,
        required_roles: set[str],
    ) -> bool:
        """Check if user has required permission for league."""
        user_role = await LeagueRoleService.get_user_role(session, league_id, user_id)
        if user_role is None:
            return False
        return user_role.role in required_roles

    @staticmethod
    async def is_creator(
        session: AsyncSession,
        league_id: int,
        user_id: int,
    ) -> bool:
        """Check if user is the league creator."""
        return await LeagueRoleService.has_permission(
            session, league_id, user_id, {UserRole.CREATOR.value}
        )

    @staticmethod
    async def is_co_manager(
        session: AsyncSession,
        league_id: int,
        user_id: int,
    ) -> bool:
        """Check if user is a co-manager of the league."""
        return await LeagueRoleService.has_permission(
            session, league_id, user_id, {UserRole.CO_MANAGER.value}
        )

    @staticmethod
    async def is_admin(
        session: AsyncSession,
        league_id: int,
        user_id: int,
    ) -> bool:
        """Check if user is an admin (creator or co-manager)."""
        return await LeagueRoleService.has_permission(
            session, league_id, user_id, {UserRole.CREATOR.value, UserRole.CO_MANAGER.value}
        )

    @staticmethod
    async def is_member(
        session: AsyncSession,
        league_id: int,
        user_id: int,
    ) -> bool:
        """Check if user is a member of the league (has any role)."""
        user_role = await LeagueRoleService.get_user_role(session, league_id, user_id)
        return bool(user_role is not None)

    @staticmethod
    async def ensure_access(
        session: AsyncSession,
        league_id: int,
        user_id: int | None,
        is_private: bool,
    ) -> None:
        """Ensure user has access to a league.

        Raises PermissionError if user doesn't have access.
        """
        if not is_private:
            return

        if user_id is None:
            raise PermissionError("You must be logged in to view private leagues")

        # Check if user is a member
        has_access = await LeagueRoleService.is_member(session, league_id, user_id)
        if not has_access:
            raise PermissionError("You must be a member to view this private league")
