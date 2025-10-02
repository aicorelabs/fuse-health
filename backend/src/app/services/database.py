"""Shared Prisma client management utilities."""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

from prisma import Prisma

_prisma = Prisma()
_lock = asyncio.Lock()


def get_client() -> Prisma:
    """Return the shared Prisma client instance without ensuring connectivity."""
    return _prisma


async def connect() -> Prisma:
    """Ensure the Prisma client is connected before use."""
    if _prisma.is_connected():
        return _prisma

    async with _lock:
        if not _prisma.is_connected():
            await _prisma.connect()
    return _prisma


async def disconnect() -> None:
    """Close the Prisma connection if it is currently open."""
    if _prisma.is_connected():
        await _prisma.disconnect()


@asynccontextmanager
async def prisma_session() -> AsyncIterator[Prisma]:
    """Async context manager yielding a connected Prisma client."""
    client = await connect()
    try:
        yield client
    finally:
        # The shared client remains connected for reuse; do not disconnect here.
        pass
