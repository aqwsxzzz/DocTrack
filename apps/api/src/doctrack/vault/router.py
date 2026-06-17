import uuid
from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user, require_admin
from ..auth.models import User
from ..client import service as client_service
from ..config import settings
from ..database import get_db
from ..storage import StorageBackend, StoredFileRef, get_storage
from . import service
from .models import OriginalDocument, TenderType
from .schemas import (
    CustodyEventCreate,
    CustodyEventOut,
    OriginalListResponse,
    OriginalOut,
)

router = APIRouter(tags=["vault"])

MAX_FILE_BYTES = 25 * 1024 * 1024


async def _require_client_access(client_id: uuid.UUID, user: User, db: AsyncSession) -> None:
    if await client_service.get_client(db, client_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if not await client_service.user_has_access(db, user, client_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


async def accessible_original(
    original_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OriginalDocument:
    doc = await service.get_original(db, original_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original not found")
    if not await client_service.user_has_access(db, current_user, doc.client_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return doc


async def _maybe_upload(
    file: UploadFile | None, storage: StorageBackend
) -> StoredFileRef | None:
    if file is None or not file.filename:
        return None
    if not settings.cloudinary_cloud_name:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Storage is not configured"
        )
    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 25 MB limit",
        )
    return await storage.upload(
        content=content,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
    )


@router.post(
    "/clients/{client_id}/originals",
    response_model=OriginalOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_original(
    client_id: uuid.UUID,
    tender_type: TenderType = Form(...),
    tender_number: str = Form(..., min_length=1, max_length=255),
    description: str = Form(..., min_length=1, max_length=10_000),
    external_owner_id: uuid.UUID | None = Form(default=None),
    contract_expiration_date: date | None = Form(default=None),
    holder_user_id: uuid.UUID | None = Form(default=None),
    holder_label: str | None = Form(default=None, max_length=255),
    file: UploadFile | None = File(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> OriginalOut:
    await _require_client_access(client_id, current_user, db)
    if external_owner_id is not None and await client_service.get_client(db, external_owner_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="External owner not found")
    if holder_user_id is not None and await db.get(User, holder_user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holder user not found")
    file_ref = await _maybe_upload(file, storage)
    doc = await service.create_original(
        db,
        client_id=client_id,
        tender_type=tender_type,
        tender_number=tender_number,
        description=description,
        external_owner_id=external_owner_id,
        contract_expiration_date=contract_expiration_date,
        created_by=current_user.id,
        file_ref=file_ref,
    )
    holder_label = holder_label.strip() if holder_label else None
    if holder_user_id is not None or holder_label:
        await service.add_custody_event(
            db,
            original_id=doc.id,
            holder_user_id=holder_user_id,
            holder_label=holder_label,
            occurred_at=datetime.now(UTC),
            recorded_by=current_user.id,
            note=None,
        )
    return (await service.build_originals(db, [doc]))[0]


@router.get("/clients/{client_id}/originals", response_model=OriginalListResponse)
async def list_originals(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> OriginalListResponse:
    await _require_client_access(client_id, current_user, db)
    items, total = await service.list_originals(db, client_id, limit=limit, offset=offset)
    return OriginalListResponse(items=await service.build_originals(db, items), total=total)


@router.get("/originals", response_model=OriginalListResponse)
async def list_all_originals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    client_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> OriginalListResponse:
    items, total = await service.list_all_originals(
        db, current_user, client_id=client_id, limit=limit, offset=offset
    )
    return OriginalListResponse(items=await service.build_originals(db, items), total=total)


@router.get("/originals/{original_id}", response_model=OriginalOut)
async def get_original(
    doc: OriginalDocument = Depends(accessible_original),
    db: AsyncSession = Depends(get_db),
) -> OriginalOut:
    return (await service.build_originals(db, [doc]))[0]


@router.get("/originals/{original_id}/download")
async def download_backup(
    doc: OriginalDocument = Depends(accessible_original),
    storage: StorageBackend = Depends(get_storage),
) -> dict[str, str]:
    if doc.file is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No backup file")
    url = await storage.download_url(doc.file.object_key, filename=doc.file.filename)
    return {"url": url}


@router.delete("/originals/{original_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_original(
    original_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> None:
    doc = await service.get_original(db, original_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original not found")
    await service.delete_original(db, storage, doc)


@router.get("/originals/{original_id}/custody", response_model=list[CustodyEventOut])
async def list_custody(
    doc: OriginalDocument = Depends(accessible_original),
    db: AsyncSession = Depends(get_db),
) -> list[CustodyEventOut]:
    events = await service.list_custody_events(db, doc.id)
    return await service.build_custody_events(db, events)


@router.post(
    "/originals/{original_id}/custody",
    response_model=list[CustodyEventOut],
    status_code=status.HTTP_201_CREATED,
)
async def add_custody(
    data: CustodyEventCreate,
    doc: OriginalDocument = Depends(accessible_original),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CustodyEventOut]:
    if data.holder_user_id is not None and await db.get(User, data.holder_user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holder user not found")
    await service.add_custody_event(
        db,
        original_id=doc.id,
        holder_user_id=data.holder_user_id,
        holder_label=data.holder_label.strip() if data.holder_label else None,
        occurred_at=data.occurred_at or datetime.now(UTC),
        recorded_by=current_user.id,
        note=data.note,
    )
    events = await service.list_custody_events(db, doc.id)
    return await service.build_custody_events(db, events)