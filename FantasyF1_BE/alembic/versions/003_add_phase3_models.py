"""Add Phase 3 models (Driver, Race, League, Constructor).

Revision ID: 003_add_phase3_models
Revises: 002_add_user_model
Create Date: 2026-01-10

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_add_phase3_models"
down_revision: str | None = "002_add_user_model"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create constructors table
    op.create_table(
        "constructors",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("team_name", sa.String(length=100), nullable=False),
        sa.Column("team_code", sa.String(length=10), nullable=False),
        sa.Column("engine", sa.String(length=50), nullable=True),
        sa.Column("chassis", sa.String(length=50), nullable=True),
        sa.Column("nationality", sa.String(length=50), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("world_wins", sa.Integer(), server_default="0", nullable=False),
        sa.Column("world_championships", sa.Integer(), server_default="0", nullable=False),
        sa.Column("current_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("team_code"),
    )
    op.create_index(op.f("ix_constructors_id"), "constructors", ["id"])
    op.create_index(op.f("ix_constructors_team_name"), "constructors", ["team_name"], unique=False)

    # Create drivers table
    op.create_table(
        "drivers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("number", sa.Integer(), nullable=True),
        sa.Column("nationality", sa.String(length=50), nullable=True),
        sa.Column("team", sa.String(length=100), nullable=True),
        sa.Column("points", sa.Integer(), server_default="0", nullable=False),
        sa.Column("wins", sa.Integer(), server_default="0", nullable=False),
        sa.Column("podiums", sa.Integer(), server_default="0", nullable=False),
        sa.Column("world_championships", sa.Integer(), server_default="0", nullable=False),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("number", "year"),
    )
    op.create_index(op.f("ix_drivers_id"), "drivers", ["id"])
    op.create_index(op.f("ix_drivers_name"), "drivers", ["name"], unique=False)
    op.create_index(op.f("ix_drivers_team"), "drivers", ["team"], unique=False)

    # Create races table
    op.create_table(
        "races",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("circuit", sa.String(length=100), nullable=False),
        sa.Column("country", sa.String(length=50), nullable=False),
        sa.Column("city", sa.String(length=50), nullable=True),
        sa.Column("round", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=True),
        sa.Column("is_sprint", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("laps", sa.Integer(), nullable=True),
        sa.Column("fastest_lap_time", sa.String(length=20), nullable=True),
        sa.Column("fastest_lap_driver", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="upcoming", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("round", "year"),
    )
    op.create_index(op.f("ix_races_id"), "races", ["id"])
    op.create_index(op.f("ix_races_year"), "races", ["year"], unique=False)
    op.create_index(op.f("ix_races_season"), "races", ["year", "round"], unique=True)

    # Create leagues table
    op.create_table(
        "leagues",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("max_teams", sa.Integer(), server_default="10", nullable=False),
        sa.Column("is_private", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "draft_method",
            sa.String(length=20),
            server_default="manual",
            nullable=False,
        ),
        sa.Column("draft_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("creator_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], name="fk_league_creator"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index(op.f("ix_leagues_id"), "leagues", ["id"])
    op.create_index(op.f("ix_leagues_name"), "leagues", ["name"], unique=False)
    op.create_index(op.f("ix_leagues_code"), "leagues", ["code"], unique=True)
    op.create_index(op.f("ix_leagues_creator_id"), "leagues", ["creator_id"], unique=False)

    # Create user_leagues association table
    op.create_table(
        "user_leagues",
        sa.Column("user_id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("league_id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"], name="fk_user_league_league"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_user_league_user"),
        sa.PrimaryKeyConstraint("user_id", "league_id"),
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_user_leagues_user_id_league_id"), table_name="user_leagues")
    op.drop_table("user_leagues")

    op.drop_index(op.f("ix_leagues_creator_id"), table_name="leagues")
    op.drop_index(op.f("ix_leagues_code"), table_name="leagues")
    op.drop_index(op.f("ix_leagues_name"), table_name="leagues")
    op.drop_index(op.f("ix_leagues_id"), table_name="leagues")
    op.drop_table("leagues")

    op.drop_index(op.f("ix_races_season"), table_name="races")
    op.drop_index(op.f("ix_races_year"), table_name="races")
    op.drop_index(op.f("ix_races_id"), table_name="races")
    op.drop_table("races")

    op.drop_index(op.f("ix_drivers_team"), table_name="drivers")
    op.drop_index(op.f("ix_drivers_name"), table_name="drivers")
    op.drop_index(op.f("ix_drivers_id"), table_name="drivers")
    op.drop_table("drivers")

    op.drop_index(op.f("ix_constructors_team_name"), table_name="constructors")
    op.drop_index(op.f("ix_constructors_id"), table_name="constructors")
    op.drop_table("constructors")
