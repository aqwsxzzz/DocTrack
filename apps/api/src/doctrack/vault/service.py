import uuid
from collections.abc import Iterable
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.models import User
from ..client.models import Client
from ..library.models import StoredFile
from ..storage import StorageBackend, StoredFileRef
from .models import CustodyEvent, OriginalDocument, TenderType
from .schemas import CustodyEventOut, OriginalOut


async def _user_names(db: AsyncSession, ids: Iterable[uuid.UUID]) -> dict[uuid.UUID, str]:
    id_list = [i for i in set(ids) if i is not None]
    if not id_list:
        return {}
    rows = await db.execute(select(User.id, User.full_name).where(User.id.in_(id_list)))
    return {row.id: row.full_name for row in rows.all()}


async def _client_names(db: AsyncSession, ids: Iterable[uuid.UUID]) -> dict[uuid.UUID, str]:
    id_list = [i for i in set(ids) if i is not None]
    if not id_list:
        return {}
    rows = await db.execute(
        select(Client.id, Client.first_name, Client.last_name).where(Client.id.in_(id_list))
    )
    return {row.id: f"{row.first_name} {row.last_name}" for row in rows.all()}


async def get_current_holders(
    db: AsyncSession, original_ids: list[uuid.UUID]
) -> dict[uuid.UUID, str | None]:
    if not original_ids:
        return {}
    rows = (
        await db.execute(
            select(
                CustodyEvent.original_document_id,
                CustodyEvent.holder_user_id,
                CustodyEvent.holder_label,
            )
            .where(CustodyEvent.original_document_id.in_(original_ids))
            .distinct(CustodyEvent.original_document_id)
            .order_by(CustodyEvent.original_document_id, CustodyEvent.occurred_at.desc())
        )
    ).all()
    names = await _user_names(db, [r.holder_user_id for r in rows if r.holder_user_id])
    return {
        r.original_document_id: (names.get(r.holder_user_id) if r.holder_user_id else r.holder_label)
        for r in rows
    }


def _to_original_out(
    doc: OriginalDocument, current_holder: str | None, owner_name: str | None
) -> OriginalOut:
    return OriginalOut(
        id=doc.id,
        client_id=doc.client_id,
        external_owner_id=doc.external_owner_id,
        external_owner_name=owner_name,
        tender_type=doc.tender_type,
        tender_number=doc.tender_number,
        contract_expiration_date=doc.contract_expiration_date,
        title=doc.title,
        has_backup=doc.file_id is not None,
        filename=doc.file.filename if doc.file else None,
        current_holder=current_holder,
        created_by=doc.created_by,
        created_at=doc.created_at,
    )


async def build_originals(db: AsyncSession, docs: list[OriginalDocument]) -> list[OriginalOut]:
    holders = await get_current_holders(db, [d.id for d in docs])
    owner_names = await _client_names(db, [d.external_owner_id for d in docs if d.external_owner_id])
    return [
        _to_original_out(
            d,
            holders.get(d.id),
            owner_names.get(d.external_owner_id) if d.external_owner_id else None,
        )
        for d in docs
    ]


async def build_custody_events(
    db: AsyncSession, events: list[CustodyEvent]
) -> list[CustodyEventOut]:
    holder_ids = [e.holder_user_id for e in events if e.holder_user_id]
    names = await _user_names(db, holder_ids + [e.recorded_by for e in events])
    return [
        CustodyEventOut(
            id=e.id,
            holder_user_id=e.holder_user_id,
            holder_label=e.holder_label,
            holder_display=(names.get(e.holder_user_id) if e.holder_user_id else e.holder_label)
            or "—",
            occurred_at=e.occurred_at,
            recorded_by=e.recorded_by,
            recorded_by_name=names.get(e.recorded_by),
            note=e.note,
            created_at=e.created_at,
        )
        for e in events
    ]


async def create_original(
    db: AsyncSession,
    *,
    client_id: uuid.UUID,
    tender_type: TenderType,
    tender_number: str,
    title: str,
    external_owner_id: uuid.UUID | None,
    contract_expiration_date: date | None,
    created_by: uuid.UUID,
    file_ref: StoredFileRef | None,
) -> OriginalDocument:
    file_id: uuid.UUID | None = None
    if file_ref is not None:
        stored = StoredFile(
            object_key=file_ref.object_key,
            filename=file_ref.filename,
            content_type=file_ref.content_type,
            size=file_ref.size,
        )
        db.add(stored)
        await db.flush()
        file_id = stored.id
    doc = OriginalDocument(
        client_id=client_id,
        external_owner_id=external_owner_id,
        tender_type=tender_type,
        tender_number=tender_number,
        contract_expiration_date=contract_expiration_date,
        title=title,
        file_id=file_id,
        created_by=created_by,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def list_originals(
    db: AsyncSession, client_id: uuid.UUID, *, limit: int, offset: int
) -> tuple[list[OriginalDocument], int]:
    base = select(OriginalDocument).where(OriginalDocument.client_id == client_id)
    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    result = await db.execute(
        base.order_by(OriginalDocument.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().unique().all()), total


async def get_original(
    db: AsyncSession, original_id: uuid.UUID
) -> OriginalDocument | None:
    return await db.get(OriginalDocument, original_id)


async def delete_original(
    db: AsyncSession, storage: StorageBackend, doc: OriginalDocument
) -> None:
    object_key = doc.file.object_key if doc.file else None
    file_id = doc.file_id
    await db.delete(doc)
    if file_id is not None:
        stored = await db.get(StoredFile, file_id)
        if stored is not None:
            await db.delete(stored)
    await db.commit()
    if object_key is not None:
        await storage.delete(object_key)


async def add_custody_event(
    db: AsyncSession,
    *,
    original_id: uuid.UUID,
    holder_user_id: uuid.UUID | None,
    holder_label: str | None,
    occurred_at: datetime,
    recorded_by: uuid.UUID,
    note: str | None,
) -> CustodyEvent:
    event = CustodyEvent(
        original_document_id=original_id,
        holder_user_id=holder_user_id,
        holder_label=holder_label,
        occurred_at=occurred_at,
        recorded_by=recorded_by,
        note=note,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def list_custody_events(
    db: AsyncSession, original_id: uuid.UUID
) -> list[CustodyEvent]:
    result = await db.execute(
        select(CustodyEvent)
        .where(CustodyEvent.original_document_id == original_id)
        .order_by(CustodyEvent.occurred_at.desc(), CustodyEvent.created_at.desc())
    )
    return list(result.scalars().all())
