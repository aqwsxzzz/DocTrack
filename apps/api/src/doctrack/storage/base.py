from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class StoredFileRef:
    """Provider-agnostic handle to a stored file."""

    object_key: str
    filename: str
    content_type: str
    size: int


class StorageBackend(Protocol):
    """Swappable file-storage interface. All file access goes through this."""

    async def upload(
        self, *, content: bytes, filename: str, content_type: str
    ) -> StoredFileRef: ...

    async def download_url(self, object_key: str, *, filename: str) -> str: ...

    async def delete(self, object_key: str) -> None: ...
