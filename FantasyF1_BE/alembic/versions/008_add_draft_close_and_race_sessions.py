"""Add draft close condition and race session times.

Revision ID: 008_add_draft_close_and_race_sessions
Revises: 007_add_league_roles
Create Date: 2026-01-21

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "008_add_draft_close_and_race_sessions"
down_revision: str | None = "007_add_league_roles"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add draft_close_condition to leagues
    op.add_column(
        "leagues",
        sa.Column(
            "draft_close_condition",
            sa.String(20),
            nullable=False,
            server_default="manual",
        ),
    )

    # Add scoring_settings to leagues
    op.add_column("leagues", sa.Column("scoring_settings", sa.Text(), nullable=True))

    # Add practice session times to races
    op.add_column("races", sa.Column("fp1_date", sa.DateTime(), nullable=True))
    op.add_column("races", sa.Column("fp2_date", sa.DateTime(), nullable=True))
    op.add_column("races", sa.Column("fp3_date", sa.DateTime(), nullable=True))
    op.add_column("races", sa.Column("qualifying_date", sa.DateTime(), nullable=True))
    op.add_column("races", sa.Column("sprint_date", sa.DateTime(), nullable=True))

    # Add winning_constructor_id to races
    op.add_column(
        "races", sa.Column("winning_constructor_id", sa.Integer(), nullable=True)
    )
    op.create_index(
        "ix_races_winning_constructor_id", "races", ["winning_constructor_id"]
    )


def downgrade() -> None:
    # Remove winning_constructor_id from races
    op.drop_index("ix_races_winning_constructor_id", "races")
    op.drop_column("races", "winning_constructor_id")

    # Remove practice session times from races
    op.drop_column("races", "sprint_date")
    op.drop_column("races", "qualifying_date")
    op.drop_column("races", "fp3_date")
    op.drop_column("races", "fp2_date")
    op.drop_column("races", "fp1_date")

    # Remove scoring_settings from leagues
    op.drop_column("leagues", "scoring_settings")

    # Remove draft_close_condition from leagues
    op.drop_column("leagues", "draft_close_condition")
