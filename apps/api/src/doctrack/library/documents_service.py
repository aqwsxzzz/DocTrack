import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..storage import StorageBackend, StoredFileRef
from .models import DocKind, SeguroDocument, StoredFile
from .schemas import SeguroDocumentOut


def build_document_out(doc: SeguroDocument) -> SeguroDocumentOut:
    return SeguroDocumentOut(
        id=doc.id,
        seguro_id=doc.seguro_id,
        doc_kind=doc.doc_kind,
        title=doc.title,
        filename=doc.file.filename,
        content_type=doc.file.content_type,
        size=doc.file.size,
        uploaded_by=doc.uploaded_by,
        uploaded_at=doc.uploaded_at,
    )


async def create_document(
    db: AsyncSession,
    *,
    seguro_id: uuid.UUID,
    doc_kind: DocKind,
    title: str,
    uploaded_by: uuid.UUID,
    file_ref: StoredFileRef,
) -> SeguroDocument:
    stored = StoredFile(
        object_key=file_ref.object_key,
        filename=file_ref.filename,
        content_type=file_ref.content_type,
        size=file_ref.size,
    )
    db.add(stored)
    await db.flush()
    doc = SeguroDocument(
        seguro_id=seguro_id,
        doc_kind=doc_kind,
        title=title,
        file_id=stored.id,
        uploaded_by=uploaded_by,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def list_documents(
    db: AsyncSession, seguro_id: uuid.UUID
) -> tuple[list[SeguroDocument], int]:
    base = select(SeguroDocument).where(SeguroDocument.seguro_id == seguro_id)
    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    result = await db.execute(base.order_by(SeguroDocument.uploaded_at.desc()))
    return list(result.scalars().unique().all()), total


async def get_document(
    db: AsyncSession, document_id: uuid.UUID
) -> SeguroDocument | None:
    return await db.get(SeguroDocument, document_id)


async def delete_document(
    db: AsyncSession, storage: StorageBackend, doc: SeguroDocument
) -> None:
    object_key = doc.file.object_key
    file_id = doc.file_id
    await db.delete(doc)
    stored = await db.get(StoredFile, file_id)
    if stored is not None:
        await db.delete(stored)
    await db.commit()
    await storage.delete(object_key)
