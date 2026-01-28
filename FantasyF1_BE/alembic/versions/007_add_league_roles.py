"""Add league roles for co-manager support

Revision ID: 007_add_league_roles
Revises: 006_add_invitation_system
Create Date: 2026-01-20 17:55:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "007_add_league_roles"
down_revision: str | None = "006_add_invitation_system"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create league_roles table for managing league roles."""
    op.create_table(
        "league_roles",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "role", sa.String(length=20), nullable=False, server_default="member"
        ),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")
        ),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.Index("ix_league_roles_league_id", "league_id"),
        sa.Index("ix_league_roles_user_id", "user_id"),
    )


def downgrade() -> None:
    """Drop league_roles table."""
    op.drop_table("league_roles")
