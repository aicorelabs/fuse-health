"""Controller logic for chat interactions."""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from google import genai

from ..config import get_gemini_client, new_mcp_client
from ..models.chat import ChatRequest, ChatResponse, Message, ToolCall
from ..services.error_handling import translate_gemini_error


async def _send_history(chat: Any, history: List[Message]) -> None:
    for entry in history:
        await chat.send_message(entry.content)


def _to_jsonable(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, dict):
        return {key: _to_jsonable(val) for key, val in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_to_jsonable(val) for val in value]
    if hasattr(value, "model_dump"):
        try:
            dumped = value.model_dump()
            return _to_jsonable(dumped)
        except Exception:  # noqa: BLE001
            pass
    if hasattr(value, "to_dict"):
        try:
            dumped = value.to_dict()
            return _to_jsonable(dumped)
        except Exception:  # noqa: BLE001
            pass
    if hasattr(value, "__dict__"):
        return {
            key: _to_jsonable(val)
            for key, val in value.__dict__.items()
            if not key.startswith("_")
        }
    return str(value)


def _stringify(value: Any) -> str:
    jsonable = _to_jsonable(value)
    if jsonable is None:
        return ""
    if isinstance(jsonable, (dict, list)):
        try:
            return json.dumps(jsonable, ensure_ascii=False, indent=2)
        except Exception:  # noqa: BLE001
            return str(jsonable)
    return str(jsonable)


def _ensure_dict(value: Any) -> Optional[Dict[str, Any]]:
    jsonable = _to_jsonable(value)
    if jsonable is None:
        return None
    if isinstance(jsonable, dict):
        return jsonable
    return {"value": jsonable}


def _collect_tool_calls_from_response(response: Any) -> List[ToolCall]:
    tool_calls: List[ToolCall] = []

    candidates = getattr(response, "candidates", None)
    if not candidates:
        return tool_calls

    candidate = candidates[0]
    parts = getattr(getattr(candidate, "content", None), "parts", None) or []

    for part in parts:
        function_call = getattr(part, "function_call", None)
        if function_call:
            args = _ensure_dict(getattr(function_call, "args", None))
            tool_calls.append(
                ToolCall(
                    name=getattr(function_call, "name", "unknown_tool"),
                    status="called",
                    args=args,
                )
            )
            continue

        function_response = getattr(part, "function_response", None)
        if function_response:
            name = getattr(function_response, "name", "unknown_tool")
            result_payload = getattr(function_response, "response", None)
            result_text = _stringify(result_payload) or None
            existing = next(
                (
                    call
                    for call in reversed(tool_calls)
                    if call.name == name and call.result_text is None
                ),
                None,
            )
            if existing:
                existing.result_text = result_text
                existing.status = "completed"
            else:
                tool_calls.append(
                    ToolCall(
                        name=name,
                        status="completed",
                        result_text=result_text,
                    )
                )

    return tool_calls


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
                tool_calls: List[ToolCall] = []
                for part in response.candidates[0].content.parts:
                    function_call = getattr(part, "function_call", None)
                    if function_call:
                        args_dict = _ensure_dict(
                            getattr(function_call, "args", None))
                        args_str = ", ".join(
                            f"{key}='{value}'" for key, value in (args_dict or {}).items()
                        )
                        if args_str:
                            plan_lines.append(
                                f"- Call tool `{function_call.name}` with arguments: `{args_str}`"
                            )
                        else:
                            plan_lines.append(
                                f"- Call tool `{function_call.name}`")
                        tool_calls.append(
                            ToolCall(
                                name=getattr(
                                    function_call, "name", "unknown_tool"),
                                status="planned",
                                args=args_dict,
                            )
                        )

                if tool_calls:
                    plan_lines.append("\nShall I proceed with this plan?")
                    return ChatResponse(
                        response="\n".join(plan_lines),
                        is_plan=True,
                        tool_calls=tool_calls,
                    )

            return ChatResponse(
                response=response.text if response.text else "No response generated",
                is_plan=False,
                tool_calls=_collect_tool_calls_from_response(response),
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
                tool_calls=_collect_tool_calls_from_response(response),
            )
    except Exception as exc:  # noqa: BLE001
        translated = translate_gemini_error(exc)
        if translated:
            raise translated from exc
        raise HTTPException(status_code=500, detail=str(exc)) from exc
