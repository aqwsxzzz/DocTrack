import re
import time
import uuid

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from starlette.concurrency import run_in_threadpool

from ..config import settings
from .base import StoredFileRef

_FOLDER = "doctrack/library"
_RESOURCE_TYPE = "raw"
_DELIVERY_TYPE = "authenticated"


def _safe_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", filename).strip("._")
    return cleaned or "documento"


class CloudinaryStorage:
    """Stores files as authenticated 'raw' Cloudinary assets, served via signed URLs."""

    def __init__(self) -> None:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )

    async def upload(
        self, *, content: bytes, filename: str, content_type: str
    ) -> StoredFileRef:
        # Uniqueness lives in a uuid subfolder so the public_id keeps the original
        # filename — Cloudinary then serves downloads under that name.
        public_id = f"{uuid.uuid4().hex}/{_safe_filename(filename)}"
        result = await run_in_threadpool(
            cloudinary.uploader.upload,
            content,
            resource_type=_RESOURCE_TYPE,
            type=_DELIVERY_TYPE,
            folder=_FOLDER,
            public_id=public_id,
            use_filename=False,
            unique_filename=False,
        )
        return StoredFileRef(
            object_key=result["public_id"],
            filename=filename,
            content_type=content_type,
            size=int(result.get("bytes", len(content))),
        )

    async def download_url(self, object_key: str, *, filename: str) -> str:
        # Time-limited signed download of the authenticated original.
        return await run_in_threadpool(
            cloudinary.utils.private_download_url,
            object_key,
            "",
            resource_type=_RESOURCE_TYPE,
            type=_DELIVERY_TYPE,
            expires_at=int(time.time()) + settings.download_url_ttl_seconds,
        )

    async def delete(self, object_key: str) -> None:
        await run_in_threadpool(
            cloudinary.uploader.destroy,
            object_key,
            resource_type=_RESOURCE_TYPE,
            type=_DELIVERY_TYPE,
        )
