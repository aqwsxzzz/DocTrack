import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator

from .models import TenderType


class OriginalOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: str | None
    external_owner_id: uuid.UUID | None
    external_owner_name: str | None
    tender_type: TenderType
    tender_number: str
    contract_expiration_date: date | None
    description: str
    has_backup: bool
    filename: str | None
    current_holder: str | None
    created_by: uuid.UUID
    created_at: datetime


class OriginalListResponse(BaseModel):
    items: list[OriginalOut]
    total: int


class CustodyEventCreate(BaseModel):
    holder_user_id: uuid.UUID | None = None
    holder_label: str | None = Field(default=None, max_length=255)
    occurred_at: datetime | None = None
    note: str | None = Field(default=None, max_length=10_000)

    @model_validator(mode="after")
    def _require_one_holder(self) -> "CustodyEventCreate":
        if self.holder_user_id is None and not (self.holder_label and self.holder_label.strip()):
            raise ValueError("Provide either holder_user_id or holder_label")
        return self


class CustodyEventOut(BaseModel):
    id: uuid.UUID
    holder_user_id: uuid.UUID | None
    holder_label: str | None
    holder_display: str
    occurred_at: datetime
    recorded_by: uuid.UUID
    recorded_by_name: str | None
    note: str | None
    created_at: datetime
