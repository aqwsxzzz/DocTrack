"""create original_documents and custody_events tables

Revision ID: 0004_create_vault
Revises: 0003_create_library
Create Date: 2026-06-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004_create_vault"
down_revision: str | None = "0003_create_library"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_tender_type = sa.Enum(
    "Mantenimiento de oferta",
    "Cumplimiento de contrato",
    "Cumplimiento de ley",
    "Otro",
    name="tender_type",
    native_enum=False,
)


def upgrade() -> None:
    op.create_table(
        "original_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("external_owner_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("tender_type", _tender_type, nullable=False),
        sa.Column("tender_number", sa.String(length=255), nullable=False),
        sa.Column("contract_expiration_date", sa.Date(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("file_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["external_owner_id"], ["clients.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["file_id"], ["stored_files.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_original_documents_client_id"),
        "original_documents",
        ["client_id"],
    )
    op.create_table(
        "custody_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "original_document_id", postgresql.UUID(as_uuid=True), nullable=False
        ),
        sa.Column("holder_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("holder_label", sa.String(length=255), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("recorded_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["original_document_id"], ["original_documents.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["holder_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["recorded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_custody_events_original_document_id"),
        "custody_events",
        ["original_document_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_custody_events_original_document_id"), table_name="custody_events"
    )
    op.drop_table("custody_events")
    op.drop_index(
        op.f("ix_original_documents_client_id"), table_name="original_documents"
    )
    op.drop_table("original_documents")
