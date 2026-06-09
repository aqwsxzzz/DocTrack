import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from .models import LibraryCategory


class LibraryDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    client_id: uuid.UUID
    category: LibraryCategory
    title: str
    filename: str
    content_type: str
    size: int
    uploaded_by: uuid.UUID
    uploaded_at: datetime


class LibraryListResponse(BaseModel):
    items: list[LibraryDocumentOut]
    total: int


class DownloadResponse(BaseModel):
    url: str
