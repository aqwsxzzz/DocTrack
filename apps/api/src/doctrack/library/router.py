import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user, require_admin
from ..auth.models import User
from ..client import service as client_service
from ..config import settings
from ..database import get_db
from ..storage import StorageBackend, get_storage
from . import service
from .models import LibraryCategory, LibraryDocument
from .schemas import DownloadResponse, LibraryDocumentOut, LibraryListResponse

router = APIRouter(tags=["library"])

MAX_FILE_BYTES = 25 * 1024 * 1024


async def _require_client_access(
    client_id: uuid.UUID, user: User, db: AsyncSession
) -> None:
    if await client_service.get_client(db, client_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if not await client_service.user_has_access(db, user, client_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


async def _accessible_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LibraryDocument:
    doc = await service.get_document(db, document_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if not await client_service.user_has_access(db, current_user, doc.client_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return doc


@router.post(
    "/clients/{client_id}/library",
    response_model=LibraryDocumentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    client_id: uuid.UUID,
    title: str = Form(..., min_length=1, max_length=255),
    category: LibraryCategory = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> LibraryDocumentOut:
    if not settings.cloudinary_cloud_name:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage is not configured",
        )
    await _require_client_access(client_id, current_user, db)
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
    doc = await service.create_document(
        db,
        client_id=client_id,
        category=category,
        title=title,
        uploaded_by=current_user.id,
        file_ref=file_ref,
    )
    return service.build_out(doc)


@router.get("/clients/{client_id}/library", response_model=LibraryListResponse)
async def list_documents(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> LibraryListResponse:
    await _require_client_access(client_id, current_user, db)
    items, total = await service.list_documents(db, client_id, limit=limit, offset=offset)
    return LibraryListResponse(items=[service.build_out(d) for d in items], total=total)


@router.get("/library/{document_id}/download", response_model=DownloadResponse)
async def download_document(
    doc: LibraryDocument = Depends(_accessible_document),
    storage: StorageBackend = Depends(get_storage),
) -> DownloadResponse:
    url = await storage.download_url(doc.file.object_key, filename=doc.file.filename)
    return DownloadResponse(url=url)


@router.delete("/library/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> None:
    doc = await service.get_document(db, document_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    await service.delete_document(db, storage, doc)
