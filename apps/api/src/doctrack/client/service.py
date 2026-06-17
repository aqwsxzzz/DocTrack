import uuid

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.models import Role, User
from .models import Client, UserClient
from .schemas import ClientCreate, ClientUpdate, MemberOut


async def create_client(db: AsyncSession, data: ClientCreate) -> Client:
    client = Client(name=data.name, notes=data.notes)
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


async def get_client(db: AsyncSession, client_id: uuid.UUID) -> Client | None:
    return await db.get(Client, client_id)


def _visible_clients_query(user: User) -> Select[tuple[Client]]:
    query = select(Client)
    if user.role is not Role.admin:
        query = query.join(UserClient, UserClient.client_id == Client.id).where(
            UserClient.user_id == user.id
        )
    return query


def visible_client_ids_query(user: User) -> Select[tuple[uuid.UUID]]:
    """Client ids the user may see — all for admins, wired-only for members."""
    query = select(Client.id)
    if user.role is not Role.admin:
        query = query.join(UserClient, UserClient.client_id == Client.id).where(
            UserClient.user_id == user.id
        )
    return query


async def list_clients(
    db: AsyncSession, user: User, *, limit: int, offset: int, search: str | None
) -> tuple[list[Client], int]:
    query = _visible_clients_query(user)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(Client.name.ilike(term))

    total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
    result = await db.execute(
        query.order_by(Client.name).limit(limit).offset(offset)
    )
    return list(result.scalars().all()), total


async def update_client(db: AsyncSession, client: Client, data: ClientUpdate) -> Client:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    await db.commit()
    await db.refresh(client)
    return client


async def delete_client(db: AsyncSession, client: Client) -> None:
    await db.delete(client)
    await db.commit()


async def user_has_access(db: AsyncSession, user: User, client_id: uuid.UUID) -> bool:
    if user.role is Role.admin:
        return True
    link = await db.get(UserClient, (user.id, client_id))
    return link is not None


async def list_members(db: AsyncSession, client_id: uuid.UUID) -> list[MemberOut]:
    result = await db.execute(
        select(User.id, User.email, User.full_name, UserClient.granted_at)
        .join(UserClient, UserClient.user_id == User.id)
        .where(UserClient.client_id == client_id)
        .order_by(User.full_name)
    )
    return [
        MemberOut(id=row.id, email=row.email, full_name=row.full_name, granted_at=row.granted_at)
        for row in result.all()
    ]


async def add_member(
    db: AsyncSession, client_id: uuid.UUID, user_id: uuid.UUID, granted_by: uuid.UUID
) -> bool:
    if await db.get(UserClient, (user_id, client_id)) is not None:
        return False
    db.add(UserClient(user_id=user_id, client_id=client_id, granted_by=granted_by))
    await db.commit()
    return True


async def remove_member(db: AsyncSession, client_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    link = await db.get(UserClient, (user_id, client_id))
    if link is None:
        return False
    await db.delete(link)
    await db.commit()
    return True
