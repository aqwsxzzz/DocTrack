"""collapse client first_name/last_name into a single required name

Revision ID: 0005_client_single_name
Revises: 0004_create_vault
Create Date: 2026-06-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_client_single_name"
down_revision: str | None = "0004_create_vault"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("SET lock_timeout = '5s'")
    # Rename rather than drop+add so existing first_name values are preserved.
    # first_name was already NOT NULL, so name stays NOT NULL.
    op.alter_column(
        "clients",
        "first_name",
        new_column_name="name",
        existing_type=sa.String(length=255),
        existing_nullable=False,
    )
    op.drop_column("clients", "last_name")


def downgrade() -> None:
    op.execute("SET lock_timeout = '5s'")
    op.add_column(
        "clients",
        sa.Column("last_name", sa.String(length=255), nullable=False, server_default=""),
    )
    op.alter_column("clients", "last_name", server_default=None)
    op.alter_column(
        "clients",
        "name",
        new_column_name="first_name",
        existing_type=sa.String(length=255),
        existing_nullable=False,
    )
