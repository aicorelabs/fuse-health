"""Pydantic models for chat interactions."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = Field(default_factory=list)


class ToolCall(BaseModel):
    name: str
    status: str = Field(
        "planned",
        description="Lifecycle status of the tool call (planned, called, completed, failed)",
    )
    args: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Arguments passed to the tool call",
    )
    result_text: Optional[str] = Field(
        default=None,
        description="Human-readable representation of the tool result",
    )


class ChatResponse(BaseModel):
    response: str
    is_plan: bool = False
    tool_calls: List[ToolCall] = Field(default_factory=list)
