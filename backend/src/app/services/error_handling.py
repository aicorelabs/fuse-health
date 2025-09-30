"""Utilities for translating upstream errors into HTTP responses."""
from __future__ import annotations

import logging
from math import ceil
from typing import Any, Dict, Iterable, List, Optional

from fastapi import HTTPException
from google.genai.errors import ClientError

logger = logging.getLogger("fuse_home.app.error_handling")


def _iter_error_entries(details: Any) -> Iterable[Dict[str, Any]]:
    """Yield structured error entries from different response formats."""
    if isinstance(details, dict):
        for key in ("details", "error"):
            value = details.get(key)
            if isinstance(value, dict):
                nested = value.get("details")
                if isinstance(nested, list):
                    for item in nested:
                        if isinstance(item, dict):
                            yield item
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        yield item
    elif isinstance(details, list):
        for item in details:
            if isinstance(item, dict):
                yield item


def _extract_retry_after_seconds(details: Any) -> Optional[int]:
    for entry in _iter_error_entries(details):
        entry_type = entry.get("@type", "")
        if not isinstance(entry_type, str) or not entry_type.endswith("RetryInfo"):
            continue

        retry_delay = entry.get("retryDelay")
        total_seconds: Optional[float] = None

        if isinstance(retry_delay, dict):
            seconds = retry_delay.get("seconds", 0)
            nanos = retry_delay.get("nanos", 0)
            try:
                seconds_value = float(seconds or 0)
            except (TypeError, ValueError):
                seconds_value = 0.0
            try:
                nanos_value = float(nanos or 0) / 1_000_000_000
            except (TypeError, ValueError):
                nanos_value = 0.0
            total_seconds = seconds_value + nanos_value
        elif isinstance(retry_delay, (int, float)):
            total_seconds = float(retry_delay)
        elif isinstance(retry_delay, str):
            cleaned = retry_delay.strip().lower()
            if cleaned.endswith("s"):
                cleaned = cleaned[:-1]
            try:
                total_seconds = float(cleaned)
            except ValueError:
                total_seconds = None

        if total_seconds and total_seconds > 0:
            return max(1, int(ceil(total_seconds)))
    return None


def _extract_help_links(details: Any) -> List[str]:
    links: List[str] = []
    for entry in _iter_error_entries(details):
        entry_type = entry.get("@type", "")
        if not isinstance(entry_type, str) or not entry_type.endswith("Help"):
            continue
        for link in entry.get("links", []):
            if isinstance(link, dict):
                url = link.get("url")
                if url:
                    links.append(url)
    return links


def _find_client_error(exc: Exception) -> Optional[ClientError]:
    visited: set[int] = set()
    current: Optional[BaseException] = exc
    while current and id(current) not in visited:
        visited.add(id(current))
        if isinstance(current, ClientError):
            return current
        current = current.__cause__ or current.__context__
    return None


def translate_gemini_error(exc: Exception) -> Optional[HTTPException]:
    """Translate Gemini quota errors into a 429 HTTPException."""
    client_error = _find_client_error(exc)
    if not client_error:
        return None

    code = str(getattr(client_error, "code", "")).strip()
    status = (getattr(client_error, "status", "") or "").upper()
    if code != "429" and status != "RESOURCE_EXHAUSTED":
        return None

    retry_after = _extract_retry_after_seconds(getattr(client_error, "details", {}))
    provider_message = getattr(client_error, "message", None)
    help_links = _extract_help_links(getattr(client_error, "details", {}))

    payload: Dict[str, Any] = {
        "error": "GEMINI_QUOTA_EXCEEDED",
        "message": "Gemini API quota exceeded. Please wait before retrying or review your Gemini plan.",
        "provider_status": status or "RESOURCE_EXHAUSTED",
    }

    if provider_message:
        payload["provider_message"] = provider_message
    if help_links:
        payload["links"] = help_links
    if retry_after is not None:
        payload["retry_after_seconds"] = retry_after

    headers = {"Retry-After": str(retry_after)} if retry_after is not None else None

    logger.warning(
        "Gemini quota exceeded (retry_after=%s): %s",
        retry_after,
        provider_message,
    )

    return HTTPException(status_code=429, detail=payload, headers=headers)
