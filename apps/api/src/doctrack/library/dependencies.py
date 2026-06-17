import uuid

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user
from ..auth.models import User
from ..client import service as client_service
from ..database import get_db
from . import documents_service, service
from .models import Seguro, SeguroDocument


async def require_client_access(
    client_id: uuid.UUID, user: User, db: AsyncSession
) -> None:
    if await client_service.get_client(db, client_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if not await client_service.user_has_access(db, user, client_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


async def accessible_seguro(
    seguro_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Seguro:
    seguro = await service.get_seguro(db, seguro_id)
    if seguro is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seguro not found")
    if not await client_service.user_has_access(db, current_user, seguro.client_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return seguro


async def accessible_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SeguroDocument:
    doc = await documents_service.get_document(db, document_id)
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    seguro = await service.get_seguro(db, doc.seguro_id)
    if seguro is None or not await client_service.user_has_access(
        db, current_user, seguro.client_id
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return doc
