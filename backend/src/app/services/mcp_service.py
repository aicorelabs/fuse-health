"""Helpers for interacting with the FastMCP client."""
from __future__ import annotations

from typing import Any, Optional

from ..config import new_mcp_client


async def call_tool(tool_name: str, arguments: Optional[dict[str, Any]] = None) -> Any:
    arguments = arguments or {}
    async with new_mcp_client() as client:
        result = await client.call_tool(tool_name, arguments)

    if getattr(result, "data", None) is not None:
        return result.data
    if getattr(result, "structured_content", None) is not None:
        return result.structured_content
    return result
