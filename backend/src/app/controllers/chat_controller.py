"""Controller logic for chat interactions."""
from __future__ import annotations

from typing import Any, List

from fastapi import HTTPException
from google import genai

from ..config import get_gemini_client, new_mcp_client
from ..models.chat import ChatRequest, ChatResponse, Message
from ..services.error_handling import translate_gemini_error


async def _send_history(chat: Any, history: List[Message]) -> None:
    for entry in history:
        await chat.send_message(entry.content)


async def get_plan(request: ChatRequest) -> ChatResponse:
    """Generate a plan for the incoming chat message."""
    gemini_client = get_gemini_client()

    try:
        async with new_mcp_client() as mcp_client:
            chat = gemini_client.aio.chats.create(
                model="gemini-2.5-flash",
                config=genai.types.GenerateContentConfig(
                    system_instruction="I say high, you say low",
                    temperature=0.3,
                    tools=[mcp_client.session],
                ),
            )

            await _send_history(chat, request.history or [])
            response = await chat.send_message(request.message)

            if response.candidates and response.candidates[0].content.parts:
                plan_lines: List[str] = ["Here's my plan:"]
                has_function_calls = False
                for part in response.candidates[0].content.parts:
                    function_call = getattr(part, "function_call", None)
                    if function_call:
                        has_function_calls = True
                        args_str = ", ".join(
                            f"{key}='{value}'" for key, value in function_call.args.items()
                        )
                        plan_lines.append(
                            f"- Call tool `{function_call.name}` with arguments: `{args_str}`"
                        )

                if has_function_calls:
                    plan_lines.append("\nShall I proceed with this plan?")
                    return ChatResponse(response="\n".join(plan_lines), is_plan=True)

            return ChatResponse(
                response=response.text if response.text else "No response generated",
                is_plan=False,
            )
    except Exception as exc:  # noqa: BLE001
        translated = translate_gemini_error(exc)
        if translated:
            raise translated from exc
        raise HTTPException(status_code=500, detail=str(exc)) from exc


async def execute_plan(request: ChatRequest) -> ChatResponse:
    """Execute an approved plan by allowing automatic function calling."""
    gemini_client = get_gemini_client()

    try:
        async with new_mcp_client() as mcp_client:
            chat = gemini_client.aio.chats.create(
                model="gemini-2.5-flash",
                config=genai.types.GenerateContentConfig(
                    system_instruction="I say high, you say low",
                    temperature=0.3,
                    tools=[mcp_client.session],
                    automatic_function_calling=genai.types.AutomaticFunctionCallingConfig(
                        disable=False
                    ),
                ),
            )

            await _send_history(chat, request.history or [])
            response = await chat.send_message(request.message)

            return ChatResponse(
                response=response.text if response.text else "No response generated",
                is_plan=False,
            )
    except Exception as exc:  # noqa: BLE001
        translated = translate_gemini_error(exc)
        if translated:
            raise translated from exc
        raise HTTPException(status_code=500, detail=str(exc)) from exc
