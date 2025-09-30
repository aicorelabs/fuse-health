"""Backward-compatible entrypoint that exposes the FastAPI app instance."""
from __future__ import annotations

from src.app.config import DEFAULT_HOST, DEFAULT_PORT
from src.app.main import app

__all__ = ["app"]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=DEFAULT_HOST, port=8002)
