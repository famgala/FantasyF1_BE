"""Add league invitation system

Revision ID: 006
Revises: 005
Create Date: 2026-01-20

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "006"
down_revision: str | None = "005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create league_invitations table."""
    op.create_table(
        "league_invitations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("inviter_id", sa.Integer(), nullable=False),
        sa.Column("invitee_id", sa.Integer(), nullable=True),
        sa.Column(
            "invitee_email",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "invitee_username",
            sa.String(length=50),
            nullable=True,
        ),
        sa.Column(
            "invite_code",
            sa.String(length=32),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "invitation_type",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("responded_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("(datetime('utc')::timestamp)"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("(datetime('utc')::timestamp)"),
        ),
        sa.ForeignKeyConstraint(["inviter_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["invitee_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_league_invitations_id"), "league_invitations", ["id"])
    op.create_index(
        op.f("ix_league_invitations_league_id"), "league_invitations", ["league_id"]
    )
    op.create_index(
        op.f("ix_league_invitations_inviter_id"), "league_invitations", ["inviter_id"]
    )
    op.create_index(
        op.f("ix_league_invitations_invitee_id"), "league_invitations", ["invitee_id"]
    )
    op.create_index(
        op.f("ix_league_invitations_invitee_email"),
        "league_invitations",
        ["invitee_email"],
    )
    op.create_index(
        op.f("ix_league_invitations_invitee_username"),
        "league_invitations",
        ["invitee_username"],
    )
    op.create_index(
        op.f("ix_league_invitations_invite_code"),
        "league_invitations",
        ["invite_code"],
        unique=True,
    )
    op.create_index(
        op.f("ix_league_invitations_status"), "league_invitations", ["status"]
    )
    op.create_index(
        op.f("ix_league_invitations_expires_at"),
        "league_invitations",
        ["expires_at"],
    )


def downgrade() -> None:
    """Drop league_invitations table."""
    op.drop_index(
        op.f("ix_league_invitations_expires_at"), table_name="league_invitations"
    )
    op.drop_index(op.f("ix_league_invitations_status"), table_name="league_invitations")
    op.drop_index(
        op.f("ix_league_invitations_invite_code"), table_name="league_invitations"
    )
    op.drop_index(
        op.f("ix_league_invitations_invitee_username"), table_name="league_invitations"
    )
    op.drop_index(
        op.f("ix_league_invitations_invitee_email"), table_name="league_invitations"
    )
    op.drop_index(
        op.f("ix_league_invitations_invitee_id"), table_name="league_invitations"
    )
    op.drop_index(
        op.f("ix_league_invitations_inviter_id"), table_name="league_invitations"
    )
    op.drop_index(
        op.f("ix_league_invitations_league_id"), table_name="league_invitations"
    )
    op.drop_index(op.f("ix_league_invitations_id"), table_name="league_invitations")
    op.drop_table("league_invitations")
