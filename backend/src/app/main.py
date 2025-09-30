"""FastAPI application wiring the MVC components together."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .views import chat_routes, health_routes

app = FastAPI(title="Gemini Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_routes.router)
app.include_router(health_routes.router)

__all__ = ["app"]
