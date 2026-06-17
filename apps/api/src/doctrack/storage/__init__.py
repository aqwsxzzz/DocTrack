from functools import lru_cache

from .base import StorageBackend, StoredFileRef
from .cloudinary_backend import CloudinaryStorage

__all__ = ["StorageBackend", "StoredFileRef", "get_storage"]


@lru_cache(maxsize=1)
def get_storage() -> StorageBackend:
    """Return the configured storage backend (swappable adapter)."""
    return CloudinaryStorage()
