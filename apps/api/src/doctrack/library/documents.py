import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user, require_admin
from ..auth.models import User
from ..config import settings
from ..database import get_db
from ..storage import StorageBackend, get_storage
from . import documents_service
from .dependencies import accessible_document, accessible_seguro
from .models import DocKind, Seguro, SeguroDocument
from .schemas import DownloadResponse, SeguroDocumentListResponse, SeguroDocumentOut

router = APIRouter(tags=["library"])

MAX_FILE_BYTES = 25 * 1024 * 1024


@router.post(
    "/seguros/{seguro_id}/documents",
    response_model=SeguroDocumentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    seguro: Seguro = Depends(accessible_seguro),
    title: str = Form(..., min_length=1, max_length=255),
    doc_kind: DocKind = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> SeguroDocumentOut:
    if not settings.cloudinary_cloud_name:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage is not configured",
        )
    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 25 MB limit",
        )
    file_ref = await storage.upload(
        content=content,
        filename=file.filename or "documento",
        content_type=file.content_type or "application/octet-stream",
    )
    doc = await documents_service.create_document(
        db,
        seguro_id=seguro.id,
        doc_kind=doc_kind,
        title=title,
        uploaded_by=current_user.id,
        file_ref=file_ref,
    )
    return documents_service.build_document_out(doc)


@router.get(
    "/seguros/{seguro_id}/documents", response_model=SeguroDocumentListResponse
)
async def list_documents(
    seguro: Seguro = Depends(accessible_seguro),
    db: AsyncSession = Depends(get_db),
) -> SeguroDocumentListResponse:
    items, total = await documents_service.list_documents(db, seguro.id)
    return SeguroDocumentListResponse(
        items=[documents_service.build_document_out(d) for d in items], total=total
    )


@router.get("/documents/{document_id}/download", response_model=DownloadResponse)
async def download_document(
    doc: SeguroDocument = Depends(accessible_document),
    storage: StorageBackend = Depends(get_storage),
) -> DownloadResponse:
    url = await storage.download_url(doc.file.object_key, filename=doc.file.filename)
    return DownloadResponse(url=url)


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> None:
    doc = await documents_service.get_document(db, document_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    await documents_service.delete_document(db, storage, doc)
