import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from ..library.models import StoredFile


class TenderType(str, enum.Enum):
    mantenimiento_oferta = "Mantenimiento de oferta"
    cumplimiento_contrato = "Cumplimiento de contrato"
    cumplimiento_ley = "Cumplimiento de ley"
    otro = "Otro"


class OriginalDocument(Base):
    __tablename__ = "original_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Filed under this client — controls visibility/access.
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    # Original owner / return target — a reference only, grants no access.
    external_owner_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True
    )
    tender_type: Mapped[TenderType] = mapped_column(
        Enum(TenderType, name="tender_type", native_enum=False), nullable=False
    )
    tender_number: Mapped[str] = mapped_column(String(255), nullable=False)
    contract_expiration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Free-form description of what the bond is for — required, can be long.
    description: Mapped[str] = mapped_column(Text, nullable=False)
    file_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("stored_files.id"), nullable=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    file: Mapped[StoredFile | None] = relationship(lazy="joined")


class CustodyEvent(Base):
    """Append-only custody ledger. Events are added, never edited or deleted."""

    __tablename__ = "custody_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    original_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("original_documents.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    holder_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    holder_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    recorded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
