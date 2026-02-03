"""Add draft timer fields to leagues and draft_picks tables.

This migration adds:
- pick_timer_seconds to leagues table (default: 60)
- is_draft_paused to leagues table (default: false)
- pick_started_at to draft_picks table (nullable)

Revision ID: 002_add_draft_timer_fields
Revises: 001_initial_schema
Create Date: 2026-02-03
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_add_draft_timer_fields"
down_revision: str | None = "001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add draft timer fields to leagues and draft_picks tables."""
    # Add pick_timer_seconds to leagues
    op.add_column(
        "leagues",
        sa.Column("pick_timer_seconds", sa.Integer(), server_default="60", nullable=False),
    )

    # Add is_draft_paused to leagues
    op.add_column(
        "leagues",
        sa.Column("is_draft_paused", sa.Boolean(), server_default="false", nullable=False),
    )

    # Add pick_started_at to draft_picks
    op.add_column(
        "draft_picks",
        sa.Column("pick_started_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Create index on pick_started_at for efficient queries
    op.create_index("ix_draft_picks_pick_started_at", "draft_picks", ["pick_started_at"])


def downgrade() -> None:
    """Remove draft timer fields from leagues and draft_picks tables."""
    # Drop index on pick_started_at
    op.drop_index("ix_draft_picks_pick_started_at", table_name="draft_picks")

    # Remove pick_started_at from draft_picks
    op.drop_column("draft_picks", "pick_started_at")

    # Remove is_draft_paused from leagues
    op.drop_column("leagues", "is_draft_paused")

    # Remove pick_timer_seconds from leagues
    op.drop_column("leagues", "pick_timer_seconds")