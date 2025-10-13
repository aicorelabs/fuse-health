"""
Gmail MCP Server - Send emails via Gmail API for patient communication.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from dotenv import load_dotenv

load_dotenv()

import base64
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from pydantic import BaseModel, Field

from fastmcp import FastMCP


GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
GMAIL_CREDENTIALS_FILE: Optional[str] = "credentials.json"  # Path to your credentials.json
GMAIL_TOKEN_FILE: Optional[str] = "token.json"  # Path to store token

logger = logging.getLogger("fuse_home.servers.gmail")

gmail_server = FastMCP("GmailMCP")


class SendEmailRequest(BaseModel):
    """Request to send an email via Gmail."""

    to: str = Field(..., description="Recipient email address")
    subject: str = Field(..., description="Email subject line")
    body: str = Field(..., description="Email body content (plain text)")
    cc: Optional[str] = Field(None, description="CC email addresses (comma-separated)")
    bcc: Optional[str] = Field(None, description="BCC email addresses (comma-separated)")


def _sanitize_arg(value: Any, *, max_chars: int = 120) -> Any:
    if value is None:
        return None
    if isinstance(value, (int, float, bool)):
        return value
    if isinstance(value, (list, tuple)):
        return [_sanitize_arg(item, max_chars=max_chars) for item in value[:5]]
    if isinstance(value, dict):
        return {
            str(key): _sanitize_arg(val, max_chars=max_chars)
            for key, val in list(value.items())[:10]
        }
    text = str(value)
    if len(text) > max_chars:
        return text[:max_chars] + "…"
    return text


def _log_tool_call(tool_name: str, **kwargs: Any) -> None:
    safe_kwargs = {key: _sanitize_arg(val) for key, val in kwargs.items() if key != "self"}
    logger.info("Gmail tool '%s' invoked", tool_name, extra={"tool_args": safe_kwargs})


def _get_gmail_service():
    """Authenticate and return Gmail API service."""
    creds = None
    if GMAIL_TOKEN_FILE:
        try:
            creds = Credentials.from_authorized_user_file(GMAIL_TOKEN_FILE, GMAIL_SCOPES)
        except Exception:
            pass

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not GMAIL_CREDENTIALS_FILE:
                raise ValueError("GMAIL_CREDENTIALS_FILE not set")
            flow = InstalledAppFlow.from_client_secrets_file(GMAIL_CREDENTIALS_FILE, GMAIL_SCOPES)
            creds = flow.run_local_server(port=0)

        if GMAIL_TOKEN_FILE:
            with open(GMAIL_TOKEN_FILE, "w") as token:
                token.write(creds.to_json())

    return build("gmail", "v1", credentials=creds)


def _create_message(to: str, subject: str, body: str, cc: Optional[str] = None, bcc: Optional[str] = None) -> Dict[str, Any]:
    """Create a message for an email."""
    message = MIMEText(body)
    message["to"] = to
    message["subject"] = subject
    if cc:
        message["cc"] = cc
    if bcc:
        message["bcc"] = bcc

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    return {"raw": raw}


@gmail_server.tool()
async def send_email(request: SendEmailRequest) -> str:
    """Send an email via Gmail API."""
    _log_tool_call(
        "send_email",
        to=request.to,
        subject=request.subject,
        body=request.body,
        cc=request.cc,
        bcc=request.bcc,
    )

    try:
        service = _get_gmail_service()
        message = _create_message(request.to, request.subject, request.body, request.cc, request.bcc)
        sent_message = service.users().messages().send(userId="me", body=message).execute()
        return f"Email sent successfully. Message ID: {sent_message['id']}"
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"Failed to send email: {str(e)}"


@gmail_server.tool()
async def get_gmail_capabilities() -> Dict[str, Any]:
    """Get information about Gmail MCP server capabilities."""
    _log_tool_call("get_gmail_capabilities")
    return {
        "server_name": "GmailMCP",
        "description": "Gmail integration server for MCP agents",
        "capabilities": [
            "Send emails",
        ],
        "scopes": GMAIL_SCOPES,
        "requires_auth": True,
        "auth_method": "OAuth 2.0",
        "environment_variables": [
            "GMAIL_CREDENTIALS_FILE",
            "GMAIL_TOKEN_FILE",
        ],
        "note": "Ensure credentials.json is set up for OAuth flow.",
    }


if __name__ == "__main__":
    gmail_server.run()