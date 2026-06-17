import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user, require_admin
from ..auth.models import User
from ..database import get_db
from ..storage import StorageBackend, get_storage
from . import service
from .dependencies import accessible_seguro, require_client_access
from .documents import router as documents_router
from .models import InsuranceType, Seguro, SeguroEstado
from .schemas import SeguroCreate, SeguroListResponse, SeguroOut, SeguroUpdate

router = APIRouter(tags=["library"])


@router.get("/seguros", response_model=SeguroListResponse)
async def list_all_seguros(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    client_id: uuid.UUID | None = Query(default=None),
    insurance_type: InsuranceType | None = Query(default=None),
    estado: SeguroEstado | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1, max_length=255),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> SeguroListResponse:
    items, total = await service.list_all_seguros(
        db,
        current_user,
        client_id=client_id,
        insurance_type=insurance_type,
        estado=estado,
        search=search,
        limit=limit,
        offset=offset,
    )
    return SeguroListResponse(items=items, total=total)


@router.post(
    "/clients/{client_id}/seguros",
    response_model=SeguroOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_seguro(
    client_id: uuid.UUID,
    data: SeguroCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SeguroOut:
    await require_client_access(client_id, current_user, db)
    return await service.create_seguro(
        db, client_id=client_id, created_by=current_user.id, data=data
    )


@router.get("/clients/{client_id}/seguros", response_model=SeguroListResponse)
async def list_seguros(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    insurance_type: InsuranceType | None = Query(default=None),
    estado: SeguroEstado | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1, max_length=255),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> SeguroListResponse:
    await require_client_access(client_id, current_user, db)
    items, total = await service.list_seguros(
        db,
        client_id,
        insurance_type=insurance_type,
        estado=estado,
        search=search,
        limit=limit,
        offset=offset,
    )
    return SeguroListResponse(items=items, total=total)


@router.get("/seguros/{seguro_id}", response_model=SeguroOut)
async def get_seguro(
    seguro: Seguro = Depends(accessible_seguro),
    db: AsyncSession = Depends(get_db),
) -> SeguroOut:
    return await service.get_seguro_out(db, seguro)


@router.patch("/seguros/{seguro_id}", response_model=SeguroOut)
async def update_seguro(
    data: SeguroUpdate,
    seguro: Seguro = Depends(accessible_seguro),
    db: AsyncSession = Depends(get_db),
) -> SeguroOut:
    try:
        return await service.update_seguro(db, seguro, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.delete("/seguros/{seguro_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_seguro(
    seguro_id: uuid.UUID,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> None:
    seguro = await service.get_seguro(db, seguro_id)
    if seguro is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seguro not found")
    await service.delete_seguro(db, storage, seguro)


router.include_router(documents_router)
