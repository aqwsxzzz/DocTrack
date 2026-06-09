from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from .models import Role, User
from .security import hash_password
from .service import get_user_by_email


async def seed_admin(db: AsyncSession) -> None:
    """Create the admin account if it does not exist yet. Idempotent."""
    if await get_user_by_email(db, settings.admin_email) is not None:
        return
    admin = User(
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        full_name=settings.admin_full_name,
        role=Role.admin,
    )
    db.add(admin)
    await db.commit()
