import uuid
from collections.abc import Iterable

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.models import User
from ..client.models import Client
from ..client.service import visible_client_ids_query
from ..storage import StorageBackend
from .attributes import validate_attributes
from .models import InsuranceType, Seguro, SeguroDocument, SeguroEstado, StoredFile
from .schemas import SeguroCreate, SeguroOut, SeguroUpdate

_SEARCH_KEYS = ("matricula", "chasis", "motor", "padron")


async def _client_names(
    db: AsyncSession, ids: Iterable[uuid.UUID]
) -> dict[uuid.UUID, str]:
    id_list = list({i for i in ids if i is not None})
    if not id_list:
        return {}
    rows = await db.execute(select(Client.id, Client.name).where(Client.id.in_(id_list)))
    return {row.id: row.name for row in rows.all()}


def build_seguro_out(
    seguro: Seguro, document_count: int, client_name: str | None
) -> SeguroOut:
    return SeguroOut(
        id=seguro.id,
        client_id=seguro.client_id,
        client_name=client_name,
        insurance_type=seguro.insurance_type,
        numero_poliza=seguro.numero_poliza,
        vigencia_desde=seguro.vigencia_desde,
        vigencia_hasta=seguro.vigencia_hasta,
        estado=seguro.estado,
        attributes=seguro.attributes,
        document_count=document_count,
        created_by=seguro.created_by,
        created_at=seguro.created_at,
    )


def _apply_filters(
    stmt: Select[tuple[Seguro]],
    *,
    insurance_type: InsuranceType | None,
    estado: SeguroEstado | None,
    search: str | None,
) -> Select[tuple[Seguro]]:
    if insurance_type is not None:
        stmt = stmt.where(Seguro.insurance_type == insurance_type)
    if estado is not None:
        stmt = stmt.where(Seguro.estado == estado)
    if search:
        like = f"%{search}%"
        conditions = [Seguro.numero_poliza.ilike(like)]
        conditions += [Seguro.attributes[key].astext.ilike(like) for key in _SEARCH_KEYS]
        stmt = stmt.where(or_(*conditions))
    return stmt


async def _counts_for(
    db: AsyncSession, seguro_ids: list[uuid.UUID]
) -> dict[uuid.UUID, int]:
    if not seguro_ids:
        return {}
    result = await db.execute(
        select(SeguroDocument.seguro_id, func.count())
        .where(SeguroDocument.seguro_id.in_(seguro_ids))
        .group_by(SeguroDocument.seguro_id)
    )
    return {row[0]: row[1] for row in result.all()}


async def _page(
    db: AsyncSession, stmt: Select[tuple[Seguro]], *, limit: int, offset: int
) -> tuple[list[SeguroOut], int]:
    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = (
        await db.scalars(
            stmt.order_by(Seguro.created_at.desc()).limit(limit).offset(offset)
        )
    ).all()
    seguros = list(rows)
    counts = await _counts_for(db, [s.id for s in seguros])
    names = await _client_names(db, [s.client_id for s in seguros])
    items = [
        build_seguro_out(s, counts.get(s.id, 0), names.get(s.client_id)) for s in seguros
    ]
    return items, total


async def create_seguro(
    db: AsyncSession, *, client_id: uuid.UUID, created_by: uuid.UUID, data: SeguroCreate
) -> SeguroOut:
    seguro = Seguro(
        client_id=client_id,
        insurance_type=data.insurance_type,
        numero_poliza=data.numero_poliza,
        vigencia_desde=data.vigencia_desde,
        vigencia_hasta=data.vigencia_hasta,
        estado=data.estado,
        attributes=data.attributes,
        created_by=created_by,
    )
    db.add(seguro)
    await db.commit()
    await db.refresh(seguro)
    names = await _client_names(db, [client_id])
    return build_seguro_out(seguro, 0, names.get(client_id))


async def list_seguros(
    db: AsyncSession,
    client_id: uuid.UUID,
    *,
    insurance_type: InsuranceType | None,
    estado: SeguroEstado | None,
    search: str | None,
    limit: int,
    offset: int,
) -> tuple[list[SeguroOut], int]:
    stmt = _apply_filters(
        select(Seguro).where(Seguro.client_id == client_id),
        insurance_type=insurance_type,
        estado=estado,
        search=search,
    )
    return await _page(db, stmt, limit=limit, offset=offset)


async def list_all_seguros(
    db: AsyncSession,
    user: User,
    *,
    client_id: uuid.UUID | None,
    insurance_type: InsuranceType | None,
    estado: SeguroEstado | None,
    search: str | None,
    limit: int,
    offset: int,
) -> tuple[list[SeguroOut], int]:
    stmt = select(Seguro).where(Seguro.client_id.in_(visible_client_ids_query(user)))
    if client_id is not None:
        stmt = stmt.where(Seguro.client_id == client_id)
    stmt = _apply_filters(
        stmt, insurance_type=insurance_type, estado=estado, search=search
    )
    return await _page(db, stmt, limit=limit, offset=offset)


async def get_seguro(db: AsyncSession, seguro_id: uuid.UUID) -> Seguro | None:
    return await db.get(Seguro, seguro_id)


async def get_seguro_out(db: AsyncSession, seguro: Seguro) -> SeguroOut:
    count = (await _counts_for(db, [seguro.id])).get(seguro.id, 0)
    names = await _client_names(db, [seguro.client_id])
    return build_seguro_out(seguro, count, names.get(seguro.client_id))


async def update_seguro(
    db: AsyncSession, seguro: Seguro, data: SeguroUpdate
) -> SeguroOut:
    fields = data.model_dump(exclude_unset=True)
    for key in ("insurance_type", "numero_poliza", "vigencia_desde", "vigencia_hasta", "estado"):
        if key in fields:
            setattr(seguro, key, fields[key])
    if "attributes" in fields or "insurance_type" in fields:
        raw = fields["attributes"] if "attributes" in fields else seguro.attributes
        seguro.attributes = validate_attributes(seguro.insurance_type, raw)
    if seguro.vigencia_hasta and seguro.vigencia_hasta < seguro.vigencia_desde:
        raise ValueError("vigencia_hasta must be on or after vigencia_desde")
    await db.commit()
    await db.refresh(seguro)
    return await get_seguro_out(db, seguro)


async def delete_seguro(
    db: AsyncSession, storage: StorageBackend, seguro: Seguro
) -> None:
    rows = (
        await db.scalars(
            select(SeguroDocument).where(SeguroDocument.seguro_id == seguro.id)
        )
    ).unique().all()
    object_keys = [row.file.object_key for row in rows]
    for row in rows:
        await db.delete(row)
        stored = await db.get(StoredFile, row.file_id)
        if stored is not None:
            await db.delete(stored)
    await db.delete(seguro)
    await db.commit()
    for object_key in object_keys:
        await storage.delete(object_key)
