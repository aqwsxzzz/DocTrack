from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://doctrack:doctrack@localhost:5432/doctrack"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 720
    refresh_token_ttl_days: int = 7
    # NoDecode: read as a raw string and split on commas, so .env can be
    # `CORS_ORIGINS=http://a,http://b` instead of requiring JSON.
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    # Admin account seeded on startup (idempotent). Override via env in production.
    admin_email: str = "jbarretolarrosa@gmail.com"
    admin_password: str = "123456789"
    admin_full_name: str = "Jorge Barreto"

    # Cloudinary storage. Required for the Library feature uploads/downloads.
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    # Seconds a signed download URL stays valid.
    download_url_ttl_seconds: int = 300


settings = Settings()
