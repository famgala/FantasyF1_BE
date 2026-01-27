"""Fix database schema mismatch between models and migration 003.

This migration aligns the database schema with the actual model definitions
for Drivers and Races tables, as identified in State of Affairs report.

Revision ID: 004_fix_schema_mismatch
Revises: 003_add_phase3_models
Create Date: 2026-01-18

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_fix_schema_mismatch"
down_revision: str | None = "003_add_phase3_models"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ========================================
    # FIX DRIVERS TABLE
    # ========================================

    # Add missing columns
    op.add_column(
        "drivers",
        sa.Column("external_id", sa.Integer(), nullable=True),
    )
    op.create_index(op.f("ix_drivers_external_id"), "drivers", ["external_id"], unique=True)

    op.add_column(
        "drivers",
        sa.Column("team_name", sa.String(length=255), nullable=True),
    )

    op.add_column(
        "drivers",
        sa.Column("code", sa.String(length=3), nullable=True),
    )

    op.add_column(
        "drivers",
        sa.Column("country", sa.String(length=100), nullable=True),
    )

    op.add_column(
        "drivers",
        sa.Column("price", sa.Integer(), server_default="0", nullable=False),
    )

    op.add_column(
        "drivers",
        sa.Column("status", sa.String(length=50), server_default="active", nullable=False),
    )
    op.create_index(op.f("ix_drivers_status"), "drivers", ["status"], unique=False)

    # Rename column: team -> temp_team_name (for migration)
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.alter_column(
            "name",
            existing_type=sa.String(length=100),
            existing_nullable=False,
            type_=sa.String(length=255),
            nullable=False,
        )
        batch_op.add_column(sa.Column("temp_team_name", sa.String(length=100), nullable=True))

    # Migrate data from team to temp_team_name
    op.execute("UPDATE drivers SET temp_team_name = team WHERE team IS NOT NULL")

    # Drop old columns and rename temp columns
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.drop_column("points")
        batch_op.drop_column("wins")
        batch_op.drop_column("podiums")
        batch_op.drop_column("world_championships")
        batch_op.drop_column("year")
        batch_op.drop_column("team")

    with op.batch_alter_table("drivers") as batch_op:
        batch_op.alter_column(
            "temp_team_name",
            new_column_name="team_name",
            existing_type=sa.String(length=100),
            type_=sa.String(length=255),
            nullable=False,
        )

    # Make external_id non-nullable after migration (set defaults)
    op.execute("UPDATE drivers SET external_id = id WHERE external_id IS NULL")
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.alter_column("external_id", nullable=False)

    # ========================================
    # FIX RACES TABLE
    # ========================================

    # Add missing columns
    op.add_column(
        "races",
        sa.Column("external_id", sa.Integer(), nullable=True),
    )
    op.create_index(op.f("ix_races_external_id"), "races", ["external_id"], unique=True)

    op.add_column(
        "races",
        sa.Column("round_number", sa.Integer(), nullable=True),
    )

    op.add_column(
        "races",
        sa.Column("race_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f("ix_races_race_date"), "races", ["race_date"], unique=False)

    # Rename column: circuit -> temp_circuit_name
    with op.batch_alter_table("races") as batch_op:
        batch_op.alter_column(
            "name",
            existing_type=sa.String(length=100),
            existing_nullable=False,
            type_=sa.String(length=255),
            nullable=False,
        )
        batch_op.add_column(sa.Column("temp_circuit_name", sa.String(length=100), nullable=True))

    # Migrate data from circuit to temp_circuit_name
    op.execute("UPDATE races SET temp_circuit_name = circuit WHERE circuit IS NOT NULL")

    # Migrate data from round to round_number
    op.execute("UPDATE races SET round_number = round WHERE round IS NOT NULL")

    # Migrate data from date to race_date
    op.execute("UPDATE races SET race_date = date WHERE date IS NOT NULL")

    # Drop old columns and rename temp columns
    with op.batch_alter_table("races") as batch_op:
        batch_op.drop_column("city")
        batch_op.drop_column("year")
        batch_op.drop_column("date")
        batch_op.drop_column("is_sprint")
        batch_op.drop_column("laps")
        batch_op.drop_column("fastest_lap_time")
        batch_op.drop_column("fastest_lap_driver")
        batch_op.drop_column("circuit")
        batch_op.drop_column("round")

    with op.batch_alter_table("races") as batch_op:
        batch_op.alter_column(
            "temp_circuit_name",
            new_column_name="circuit_name",
            existing_type=sa.String(length=100),
            type_=sa.String(length=255),
            nullable=False,
        )

    # Make external_id non-nullable after migration (set defaults)
    op.execute("UPDATE races SET external_id = id WHERE external_id IS NULL")
    with op.batch_alter_table("races") as batch_op:
        batch_op.alter_column("external_id", nullable=False)

    # ========================================
    # CREATE USER_LEAGUES ASSOCIATION IN MODEL
    # ========================================

    # The association table already exists in migration 003
    # We need to ensure it's properly indexed
    op.create_index(
        op.f("ix_user_leagues_user_id"),
        "user_leagues",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_leagues_league_id"),
        "user_leagues",
        ["league_id"],
        unique=False,
    )


def downgrade() -> None:
    """Reverse the schema changes - restore original schema from migration 003."""

    # ========================================
    # REVERSE DRIVERS TABLE
    # ========================================

    # Drop new indexes
    op.drop_index(op.f("ix_drivers_status"), table_name="drivers")
    op.drop_index(op.f("ix_drivers_external_id"), table_name="drivers")

    # Set make nullable columns back to nullable
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.alter_column("external_id", nullable=True)

    # Drop new columns
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.drop_column("status")
        batch_op.drop_column("price")
        batch_op.drop_column("country")
        batch_op.drop_column("code")
        batch_op.drop_column("team_name")
        batch_op.drop_column("external_id")

    # Restore old columns
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.add_column(sa.Column("team", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("year", sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column("world_championships", sa.Integer(), server_default="0", nullable=False)
        )
        batch_op.add_column(sa.Column("podiums", sa.Integer(), server_default="0", nullable=False))
        batch_op.add_column(sa.Column("wins", sa.Integer(), server_default="0", nullable=False))
        batch_op.add_column(sa.Column("points", sa.Integer(), server_default="0", nullable=False))

    with op.batch_alter_table("drivers") as batch_op:
        batch_op.alter_column(
            "name",
            existing_type=sa.String(length=255),
            existing_nullable=False,
            type_=sa.String(length=100),
            nullable=False,
        )

    # ========================================
    # REVERSE RACES TABLE
    # ========================================

    # Drop new indexes
    op.drop_index(op.f("ix_races_race_date"), table_name="races")
    op.drop_index(op.f("ix_races_external_id"), table_name="races")

    # Set nullable columns back to nullable
    with op.batch_alter_table("races") as batch_op:
        batch_op.alter_column("external_id", nullable=True)

    # Drop new columns
    with op.batch_alter_table("races") as batch_op:
        batch_op.drop_column("round_number")
        batch_op.drop_column("race_date")
        batch_op.drop_column("circuit_name")
        batch_op.drop_column("external_id")

    # Restore old columns
    with op.batch_alter_table("races") as batch_op:
        batch_op.add_column(sa.Column("round", sa.Integer(), nullable=False))
        batch_op.add_column(sa.Column("year", sa.Integer(), nullable=False))
        batch_op.add_column(sa.Column("date", sa.Date(), nullable=True))
        batch_op.add_column(
            sa.Column("is_sprint", sa.Boolean(), server_default="false", nullable=False)
        )
        batch_op.add_column(sa.Column("laps", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("fastest_lap_time", sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column("fastest_lap_driver", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("city", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("circuit", sa.String(length=100), nullable=False))

    with op.batch_alter_table("races") as batch_op:
        batch_op.alter_column(
            "name",
            existing_type=sa.String(length=255),
            existing_nullable=False,
            type_=sa.String(length=100),
            nullable=False,
        )

    # ========================================
    # REVERSE USER_LEAGUES ASSOCIATION INDEXES
    # ========================================

    op.drop_index(op.f("ix_user_leagues_league_id"), table_name="user_leagues")
    op.drop_index(op.f("ix_user_leagues_user_id"), table_name="user_leagues")
