"""Add fantasy game models (FantasyTeam, TeamPick, DraftPick, DraftOrder, RaceResult, DriverStats).

Revision ID: 005_add_fantasy_game_models
Revises: 004_fix_schema_mismatch
Create Date: 2026-01-18

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "005_add_fantasy_game_models"
down_revision: str | None = "004_fix_schema_mismatch"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ========================================
    # CREATE FANTASY_TEAMS TABLE
    # ========================================
    op.create_table(
        "fantasy_teams",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("total_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "budget_remaining", sa.Integer(), server_default="100", nullable=False
        ),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
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
        sa.ForeignKeyConstraint(
            ["league_id"], ["leagues.id"], name="fk_fantasy_team_league"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_fantasy_team_user"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_fantasy_teams_id"), "fantasy_teams", ["id"])
    op.create_index(
        op.f("ix_fantasy_teams_user_id"), "fantasy_teams", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_fantasy_teams_league_id"), "fantasy_teams", ["league_id"], unique=False
    )
    op.create_index(
        op.f("ix_fantasy_teams_name"), "fantasy_teams", ["name"], unique=False
    )
    op.create_index(
        op.f("ix_fantasy_teams_total_points"),
        "fantasy_teams",
        ["total_points"],
        unique=False,
    )

    # ========================================
    # CREATE TEAM_PICKS TABLE
    # ========================================
    op.create_table(
        "team_picks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("fantasy_team_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=True),
        sa.Column("constructor_id", sa.Integer(), nullable=True),
        sa.Column("pick_type", sa.String(length=20), nullable=False),
        sa.Column("points_earned", sa.Integer(), server_default="0", nullable=False),
        sa.Column("race_id", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
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
        sa.ForeignKeyConstraint(["race_id"], ["races.id"], name="fk_team_pick_race"),
        sa.ForeignKeyConstraint(
            ["constructor_id"], ["constructors.id"], name="fk_team_pick_constructor"
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"], ["drivers.id"], name="fk_team_pick_driver"
        ),
        sa.ForeignKeyConstraint(
            ["fantasy_team_id"], ["fantasy_teams.id"], name="fk_team_pick_fantasy_team"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_team_picks_id"), "team_picks", ["id"])
    op.create_index(
        op.f("ix_team_picks_fantasy_team_id"),
        "team_picks",
        ["fantasy_team_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_picks_driver_id"), "team_picks", ["driver_id"], unique=False
    )
    op.create_index(
        op.f("ix_team_picks_constructor_id"),
        "team_picks",
        ["constructor_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_team_picks_race_id"), "team_picks", ["race_id"], unique=False
    )

    # ========================================
    # CREATE DRAFT_ORDERS TABLE
    # ========================================
    op.create_table(
        "draft_orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("race_id", sa.Integer(), nullable=False),
        sa.Column(
            "draft_method",
            sa.String(length=20),
            server_default="sequential",
            nullable=False,
        ),
        sa.Column("order_data", sa.String(length=1000), nullable=False),
        sa.Column("is_manual", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("last_modified_by", sa.Integer(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["last_modified_by"], ["users.id"], name="fk_draft_order_user"
        ),
        sa.ForeignKeyConstraint(["race_id"], ["races.id"], name="fk_draft_order_race"),
        sa.ForeignKeyConstraint(
            ["league_id"], ["leagues.id"], name="fk_draft_order_league"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_draft_orders_id"), "draft_orders", ["id"])
    op.create_index(
        op.f("ix_draft_orders_league_id"), "draft_orders", ["league_id"], unique=False
    )
    op.create_index(
        op.f("ix_draft_orders_race_id"), "draft_orders", ["race_id"], unique=False
    )
    op.create_index(
        op.f("ix_draft_orders_last_modified_by"),
        "draft_orders",
        ["last_modified_by"],
        unique=False,
    )

    # ========================================
    # CREATE DRAFT_PICKS TABLE
    # ========================================
    op.create_table(
        "draft_picks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("race_id", sa.Integer(), nullable=False),
        sa.Column("fantasy_team_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("pick_number", sa.Integer(), nullable=False),
        sa.Column("pick_round", sa.Integer(), server_default="1", nullable=False),
        sa.Column("draft_position", sa.Integer(), nullable=False),
        sa.Column("is_auto_pick", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "picked_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
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
        sa.ForeignKeyConstraint(
            ["driver_id"], ["drivers.id"], name="fk_draft_pick_driver"
        ),
        sa.ForeignKeyConstraint(
            ["fantasy_team_id"], ["fantasy_teams.id"], name="fk_draft_pick_fantasy_team"
        ),
        sa.ForeignKeyConstraint(["race_id"], ["races.id"], name="fk_draft_pick_race"),
        sa.ForeignKeyConstraint(
            ["league_id"], ["leagues.id"], name="fk_draft_pick_league"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_draft_picks_id"), "draft_picks", ["id"])
    op.create_index(
        op.f("ix_draft_picks_league_id"), "draft_picks", ["league_id"], unique=False
    )
    op.create_index(
        op.f("ix_draft_picks_race_id"), "draft_picks", ["race_id"], unique=False
    )
    op.create_index(
        op.f("ix_draft_picks_fantasy_team_id"),
        "draft_picks",
        ["fantasy_team_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_draft_picks_driver_id"), "draft_picks", ["driver_id"], unique=False
    )
    op.create_index(
        op.f("ix_draft_picks_picked_at"), "draft_picks", ["picked_at"], unique=False
    )

    # ========================================
    # CREATE RACE_RESULTS TABLE
    # ========================================
    op.create_table(
        "race_results",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("race_id", sa.Integer(), nullable=False),
        sa.Column("driver_external_id", sa.Integer(), nullable=False),
        sa.Column("driver_name", sa.String(length=255), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("grid_position", sa.Integer(), nullable=True),
        sa.Column("laps_completed", sa.Integer(), nullable=True),
        sa.Column("points_earned", sa.Integer(), server_default="0", nullable=False),
        sa.Column("fastest_lap", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("fastest_lap_time", sa.Numeric(precision=10, scale=3), nullable=True),
        sa.Column("time_diff", sa.Numeric(precision=10, scale=3), nullable=True),
        sa.Column("time_diff_str", sa.String(length=20), nullable=True),
        sa.Column("dnf", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("dnf_reason", sa.String(length=255), nullable=True),
        sa.Column("dns", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("dsq", sa.Boolean(), server_default="false", nullable=False),
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
        sa.ForeignKeyConstraint(["race_id"], ["races.id"], name="fk_race_result_race"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_race_results_id"), "race_results", ["id"])
    op.create_index(
        op.f("ix_race_results_race_id"), "race_results", ["race_id"], unique=False
    )
    op.create_index(
        op.f("ix_race_results_driver_external_id"),
        "race_results",
        ["driver_external_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_race_results_position"), "race_results", ["position"], unique=False
    )

    # ========================================
    # CREATE DRIVER_STATS TABLE
    # ========================================
    op.create_table(
        "driver_stats",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("season", sa.Integer(), nullable=False),
        sa.Column("races_entered", sa.Integer(), server_default="0", nullable=False),
        sa.Column("races_finished", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column("wins", sa.Integer(), server_default="0", nullable=False),
        sa.Column("podiums", sa.Integer(), server_default="0", nullable=False),
        sa.Column("pole_positions", sa.Integer(), server_default="0", nullable=False),
        sa.Column("fastest_laps", sa.Integer(), server_default="0", nullable=False),
        sa.Column("dnf_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("dns_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("dsq_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "average_finish_position", sa.Numeric(precision=5, scale=2), nullable=True
        ),
        sa.Column("best_finish_position", sa.Integer(), nullable=True),
        sa.Column("worst_finish_position", sa.Integer(), nullable=True),
        sa.Column(
            "average_grid_position", sa.Numeric(precision=5, scale=2), nullable=True
        ),
        sa.Column("retirement_rate", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("podium_rate", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("win_rate", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("top10_rate", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("points_per_race", sa.Numeric(precision=5, scale=2), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["driver_id"], ["drivers.id"], name="fk_driver_stats_driver"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_driver_stats_id"), "driver_stats", ["id"])
    op.create_index(
        op.f("ix_driver_stats_driver_id"), "driver_stats", ["driver_id"], unique=False
    )
    op.create_index(
        op.f("ix_driver_stats_season"), "driver_stats", ["season"], unique=False
    )


def downgrade() -> None:
    """Reverse the migration - drop all new tables."""

    # Drop tables in reverse order of creation (to respect foreign key constraints)
    op.drop_index(op.f("ix_driver_stats_season"), table_name="driver_stats")
    op.drop_index(op.f("ix_driver_stats_driver_id"), table_name="driver_stats")
    op.drop_index(op.f("ix_driver_stats_id"), table_name="driver_stats")
    op.drop_table("driver_stats")

    op.drop_index(op.f("ix_race_results_position"), table_name="race_results")
    op.drop_index(op.f("ix_race_results_driver_external_id"), table_name="race_results")
    op.drop_index(op.f("ix_race_results_race_id"), table_name="race_results")
    op.drop_index(op.f("ix_race_results_id"), table_name="race_results")
    op.drop_table("race_results")

    op.drop_index(op.f("ix_draft_picks_picked_at"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_driver_id"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_fantasy_team_id"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_race_id"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_league_id"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_id"), table_name="draft_picks")
    op.drop_table("draft_picks")

    op.drop_index(op.f("ix_draft_orders_last_modified_by"), table_name="draft_orders")
    op.drop_index(op.f("ix_draft_orders_race_id"), table_name="draft_orders")
    op.drop_index(op.f("ix_draft_orders_league_id"), table_name="draft_orders")
    op.drop_index(op.f("ix_draft_orders_id"), table_name="draft_orders")
    op.drop_table("draft_orders")

    op.drop_index(op.f("ix_team_picks_race_id"), table_name="team_picks")
    op.drop_index(op.f("ix_team_picks_constructor_id"), table_name="team_picks")
    op.drop_index(op.f("ix_team_picks_driver_id"), table_name="team_picks")
    op.drop_index(op.f("ix_team_picks_fantasy_team_id"), table_name="team_picks")
    op.drop_index(op.f("ix_team_picks_id"), table_name="team_picks")
    op.drop_table("team_picks")

    op.drop_index(op.f("ix_fantasy_teams_total_points"), table_name="fantasy_teams")
    op.drop_index(op.f("ix_fantasy_teams_name"), table_name="fantasy_teams")
    op.drop_index(op.f("ix_fantasy_teams_league_id"), table_name="fantasy_teams")
    op.drop_index(op.f("ix_fantasy_teams_user_id"), table_name="fantasy_teams")
    op.drop_index(op.f("ix_fantasy_teams_id"), table_name="fantasy_teams")
    op.drop_table("fantasy_teams")
