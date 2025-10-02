"""FastAPI application wiring the MVC components together."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .services import database, mcp_configuration_service
from .views import chat_routes, health_routes, mcp_configuration_routes


@asynccontextmanager
async def lifespan(_: FastAPI):
    await database.connect()
    await mcp_configuration_service.initialize_seed_data()
    try:
        yield
    finally:
        await database.disconnect()


app = FastAPI(title="Gemini Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_routes.router)
app.include_router(health_routes.router)
app.include_router(mcp_configuration_routes.router)

__all__ = ["app"]
