import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..storage import StorageBackend, StoredFileRef
from .models import LibraryCategory, LibraryDocument, StoredFile
from .schemas import LibraryDocumentOut


def build_out(doc: LibraryDocument) -> LibraryDocumentOut:
    return LibraryDocumentOut(
        id=doc.id,
        client_id=doc.client_id,
        category=doc.category,
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
    client_id: uuid.UUID,
    category: LibraryCategory,
    title: str,
    uploaded_by: uuid.UUID,
    file_ref: StoredFileRef,
) -> LibraryDocument:
    stored = StoredFile(
        object_key=file_ref.object_key,
        filename=file_ref.filename,
        content_type=file_ref.content_type,
        size=file_ref.size,
    )
    db.add(stored)
    await db.flush()
    doc = LibraryDocument(
        client_id=client_id,
        category=category,
        title=title,
        file_id=stored.id,
        uploaded_by=uploaded_by,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def list_documents(
    db: AsyncSession, client_id: uuid.UUID, *, limit: int, offset: int
) -> tuple[list[LibraryDocument], int]:
    base = select(LibraryDocument).where(LibraryDocument.client_id == client_id)
    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    result = await db.execute(
        base.order_by(LibraryDocument.uploaded_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().unique().all()), total


async def get_document(
    db: AsyncSession, document_id: uuid.UUID
) -> LibraryDocument | None:
    return await db.get(LibraryDocument, document_id)


async def delete_document(
    db: AsyncSession, storage: StorageBackend, doc: LibraryDocument
) -> None:
    object_key = doc.file.object_key
    file_id = doc.file_id
    await db.delete(doc)
    stored = await db.get(StoredFile, file_id)
    if stored is not None:
        await db.delete(stored)
    await db.commit()
    await storage.delete(object_key)
