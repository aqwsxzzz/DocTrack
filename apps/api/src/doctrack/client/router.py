import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user, require_admin
from ..auth.models import User
from ..database import get_db
from . import service
from .models import Client
from .schemas import (
    AddMemberRequest,
    ClientCreate,
    ClientListResponse,
    ClientOut,
    ClientUpdate,
    MemberOut,
)

router = APIRouter(prefix="/clients", tags=["clients"])

_not_found = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")


async def _load_client(db: AsyncSession, client_id: uuid.UUID) -> Client:
    client = await service.get_client(db, client_id)
    if client is None:
        raise _not_found
    return client


async def get_accessible_client(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Client:
    client = await _load_client(db, client_id)
    if not await service.user_has_access(db, current_user, client_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return client


@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Client:
    return await service.create_client(db, data)


@router.get("", response_model=ClientListResponse)
async def list_clients(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None),
) -> ClientListResponse:
    items, total = await service.list_clients(
        db, current_user, limit=limit, offset=offset, search=search
    )
    return ClientListResponse(items=[ClientOut.model_validate(c) for c in items], total=total)


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(client: Client = Depends(get_accessible_client)) -> Client:
    return client


@router.patch("/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: uuid.UUID,
    data: ClientUpdate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Client:
    client = await _load_client(db, client_id)
    return await service.update_client(db, client, data)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    client = await _load_client(db, client_id)
    await service.delete_client(db, client)


@router.get("/{client_id}/members", response_model=list[MemberOut])
async def list_members(
    client_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[MemberOut]:
    await _load_client(db, client_id)
    return await service.list_members(db, client_id)


@router.post(
    "/{client_id}/members", response_model=list[MemberOut], status_code=status.HTTP_201_CREATED
)
async def add_member(
    client_id: uuid.UUID,
    data: AddMemberRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[MemberOut]:
    await _load_client(db, client_id)
    if await db.get(User, data.user_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not await service.add_member(db, client_id, data.user_id, granted_by=admin.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="User is already a member"
        )
    return await service.list_members(db, client_id)


@router.delete(
    "/{client_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_member(
    client_id: uuid.UUID,
    user_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _load_client(db, client_id)
    if not await service.remove_member(db, client_id, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
