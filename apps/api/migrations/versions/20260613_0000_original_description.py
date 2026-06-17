"""rename original_documents.title to description and widen to TEXT

Revision ID: 0007_original_description
Revises: 0006_create_seguros
Create Date: 2026-06-13

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007_original_description"
down_revision: str | None = "0006_create_seguros"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("SET lock_timeout = '5s'")
    # Rename + widen rather than drop+add so existing titles are preserved.
    # VARCHAR(255) -> TEXT is a metadata-only change in Postgres (no rewrite).
    # title was already NOT NULL, so description stays NOT NULL.
    op.alter_column(
        "original_documents",
        "title",
        new_column_name="description",
        existing_type=sa.String(length=255),
        type_=sa.Text(),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.execute("SET lock_timeout = '5s'")
    op.alter_column(
        "original_documents",
        "description",
        new_column_name="title",
        existing_type=sa.Text(),
        type_=sa.String(length=255),
        existing_nullable=False,
    )
