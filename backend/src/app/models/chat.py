"""Pydantic models for chat interactions."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    is_plan: bool = False
