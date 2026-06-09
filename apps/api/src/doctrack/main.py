from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth.router import router as auth_router
from .auth.seed import seed_admin
from .client.router import router as client_router
from .config import settings
from .database import AsyncSessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    async with AsyncSessionLocal() as db:
        await seed_admin(db)
    yield


app = FastAPI(title="DocTrack API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(client_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
