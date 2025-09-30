"""Chat-related API routes."""
from __future__ import annotations

from fastapi import APIRouter

from ..controllers import chat_controller
from ..models.chat import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    return await chat_controller.get_plan(request)


@router.post("/execute", response_model=ChatResponse)
async def execute_endpoint(request: ChatRequest) -> ChatResponse:
    return await chat_controller.execute_plan(request)
