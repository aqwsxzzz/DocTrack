"""replace flat library_documents with seguros + seguro_documents

Revision ID: 0006_create_seguros
Revises: 0005_client_single_name
Create Date: 2026-06-12

Fresh start: the flat library_documents table held no production data, so it is
dropped and replaced by a typed Seguro parent (insurance_type + per-type JSONB
attributes) with a SeguroDocument child per file. stored_files is reused.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006_create_seguros"
down_revision: str | None = "0005_client_single_name"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_INSURANCE_TYPES = ("Vehículos", "Incendio", "Combinado", "ADT", "Fianzas", "RC", "RV")
_ESTADOS = ("Vigente", "Anulada", "Devuelta")
_DOC_KINDS = ("Póliza", "Recibo", "Factura", "Certificado", "Otro")


def upgrade() -> None:
    op.drop_index(
        op.f("ix_library_documents_client_id"), table_name="library_documents"
    )
    op.drop_table("library_documents")

    op.create_table(
        "seguros",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "insurance_type",
            sa.Enum(*_INSURANCE_TYPES, name="insurance_type", native_enum=False),
            nullable=False,
        ),
        sa.Column("numero_poliza", sa.String(length=255), nullable=False),
        sa.Column("vigencia_desde", sa.Date(), nullable=False),
        sa.Column("vigencia_hasta", sa.Date(), nullable=True),
        sa.Column(
            "estado",
            sa.Enum(*_ESTADOS, name="seguro_estado", native_enum=False),
            nullable=False,
        ),
        sa.Column(
            "attributes",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_seguros_client_id"), "seguros", ["client_id"])

    op.create_table(
        "seguro_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seguro_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "doc_kind",
            sa.Enum(*_DOC_KINDS, name="doc_kind", native_enum=False),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("file_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["seguro_id"], ["seguros.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["file_id"], ["stored_files.id"]),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_seguro_documents_seguro_id"), "seguro_documents", ["seguro_id"]
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_seguro_documents_seguro_id"), table_name="seguro_documents"
    )
    op.drop_table("seguro_documents")
    op.drop_index(op.f("ix_seguros_client_id"), table_name="seguros")
    op.drop_table("seguros")

    op.create_table(
        "library_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "Póliza",
                "Factura",
                "Certificado",
                "Otro",
                name="library_category",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("file_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["file_id"], ["stored_files.id"]),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_library_documents_client_id"), "library_documents", ["client_id"]
    )
