import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .attributes import validate_attributes
from .models import DocKind, InsuranceType, SeguroEstado


class SeguroCreate(BaseModel):
    insurance_type: InsuranceType
    numero_poliza: str = Field(min_length=1, max_length=255)
    vigencia_desde: date
    vigencia_hasta: date | None = None
    estado: SeguroEstado = SeguroEstado.vigente
    attributes: dict = Field(default_factory=dict)

    @model_validator(mode="after")
    def _validate(self) -> "SeguroCreate":
        if self.vigencia_hasta and self.vigencia_hasta < self.vigencia_desde:
            raise ValueError("vigencia_hasta must be on or after vigencia_desde")
        self.attributes = validate_attributes(self.insurance_type, self.attributes)
        return self


class SeguroUpdate(BaseModel):
    """Partial update; only fields present in the payload are applied."""

    insurance_type: InsuranceType | None = None
    numero_poliza: str | None = Field(default=None, min_length=1, max_length=255)
    vigencia_desde: date | None = None
    vigencia_hasta: date | None = None
    estado: SeguroEstado | None = None
    attributes: dict | None = None

    @model_validator(mode="after")
    def _validate(self) -> "SeguroUpdate":
        if (
            self.vigencia_desde
            and self.vigencia_hasta
            and self.vigencia_hasta < self.vigencia_desde
        ):
            raise ValueError("vigencia_hasta must be on or after vigencia_desde")
        return self


class SeguroOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    client_id: uuid.UUID
    client_name: str | None = None
    insurance_type: InsuranceType
    numero_poliza: str
    vigencia_desde: date
    vigencia_hasta: date | None
    estado: SeguroEstado
    attributes: dict
    document_count: int
    created_by: uuid.UUID
    created_at: datetime


class SeguroListResponse(BaseModel):
    items: list[SeguroOut]
    total: int


class SeguroDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    seguro_id: uuid.UUID
    doc_kind: DocKind
    title: str
    filename: str
    content_type: str
    size: int
    uploaded_by: uuid.UUID
    uploaded_at: datetime


class SeguroDocumentListResponse(BaseModel):
    items: list[SeguroDocumentOut]
    total: int


class DownloadResponse(BaseModel):
    url: str
