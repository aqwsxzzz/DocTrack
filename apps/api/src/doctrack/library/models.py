import enum
import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Enum, ForeignKey, String, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class InsuranceType(str, enum.Enum):
    vehiculos = "Vehículos"
    incendio = "Incendio"
    combinado = "Combinado"
    adt = "ADT"
    fianzas = "Fianzas"
    rc = "RC"
    rv = "RV"


class SeguroEstado(str, enum.Enum):
    vigente = "Vigente"
    anulada = "Anulada"
    devuelta = "Devuelta"


class DocKind(str, enum.Enum):
    poliza = "Póliza"
    recibo = "Recibo"
    factura = "Factura"
    certificado = "Certificado"
    otro = "Otro"


class StoredFile(Base):
    __tablename__ = "stored_files"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Seguro(Base):
    """A typed insurance record (the filter target). Groups many documents."""

    __tablename__ = "seguros"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    insurance_type: Mapped[InsuranceType] = mapped_column(
        Enum(InsuranceType, name="insurance_type", native_enum=False), nullable=False
    )
    numero_poliza: Mapped[str] = mapped_column(String(255), nullable=False)
    vigencia_desde: Mapped[date] = mapped_column(Date, nullable=False)
    # Nullable → "vigencia abierta" (ADT/Fianzas close on annulment or return).
    vigencia_hasta: Mapped[date | None] = mapped_column(Date, nullable=True)
    estado: Mapped[SeguroEstado] = mapped_column(
        Enum(SeguroEstado, name="seguro_estado", native_enum=False),
        nullable=False,
        default=SeguroEstado.vigente,
    )
    # Per-type fields validated in code (see attributes.py); empty for most types.
    attributes: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb")
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SeguroDocument(Base):
    """A file belonging to a seguro (1 seguro → N documents)."""

    __tablename__ = "seguro_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    seguro_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("seguros.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    doc_kind: Mapped[DocKind] = mapped_column(
        Enum(DocKind, name="doc_kind", native_enum=False), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("stored_files.id"), nullable=False
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    file: Mapped[StoredFile] = relationship(lazy="joined")
