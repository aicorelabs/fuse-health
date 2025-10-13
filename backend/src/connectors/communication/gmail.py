"""
Gmail Connector - Send and manage emails via Gmail API.

This connector provides email capabilities using OAuth 2.0 authentication.
"""
from typing import Any, Dict, List, Optional
import httpx
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..base import (
    BaseConnector,
    ConnectorMetadata,
    ConnectorAction,
    ActionParameter,
    ConnectorResult,
    AuthType,
    ConnectorCategory,
)


class GmailConnector(BaseConnector):
    """Gmail connector for sending and managing emails."""

    def get_metadata(self) -> ConnectorMetadata:
        """Return Gmail connector metadata."""
        return ConnectorMetadata(
            id="gmail",
            name="Gmail",
            description="Send and manage emails using Gmail API with OAuth 2.0",
            category=ConnectorCategory.COMMUNICATION,
            auth_type=AuthType.OAUTH2,
            icon="📧",
            oauth_config={
                "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "scopes": [
                    "https://www.googleapis.com/auth/gmail.send",
                    "https://www.googleapis.com/auth/gmail.readonly",
                    "https://www.googleapis.com/auth/gmail.modify",
                ],
            },
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available Gmail actions."""
        return [
            ConnectorAction(
                id="send_email",
                name="Send Email",
                description="Send an email via Gmail",
                category="query",
                params=[
                    ActionParameter(
                        name="to",
                        type="string",
                        description="Recipient email address",
                        required=True,
                    ),
                    ActionParameter(
                        name="subject",
                        type="string",
                        description="Email subject line",
                        required=True,
                    ),
                    ActionParameter(
                        name="body",
                        type="string",
                        description="Email body content (HTML or plain text)",
                        required=True,
                    ),
                    ActionParameter(
                        name="cc",
                        type="string",
                        description="CC email addresses (comma-separated)",
                        required=False,
                    ),
                    ActionParameter(
                        name="bcc",
                        type="string",
                        description="BCC email addresses (comma-separated)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="list_messages",
                name="List Messages",
                description="List messages from Gmail inbox",
                category="query",
                params=[
                    ActionParameter(
                        name="query",
                        type="string",
                        description="Gmail search query (e.g., 'is:unread', 'from:example@gmail.com')",
                        required=False,
                    ),
                    ActionParameter(
                        name="max_results",
                        type="integer",
                        description="Maximum number of messages to return (default: 10, max: 100)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="get_message",
                name="Get Message",
                description="Get a specific email message by ID",
                category="query",
                params=[
                    ActionParameter(
                        name="message_id",
                        type="string",
                        description="Gmail message ID",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="mark_as_read",
                name="Mark as Read",
                description="Mark a message as read",
                category="query",
                params=[
                    ActionParameter(
                        name="message_id",
                        type="string",
                        description="Gmail message ID to mark as read",
                        required=True,
                    ),
                ],
            ),
        ]

    async def execute(
        self, action_id: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Execute a Gmail action."""
        if action_id == "send_email":
            return await self._send_email(parameters, credentials)
        elif action_id == "list_messages":
            return await self._list_messages(parameters, credentials)
        elif action_id == "get_message":
            return await self._get_message(parameters, credentials)
        elif action_id == "mark_as_read":
            return await self._mark_as_read(parameters, credentials)
        else:
            return ConnectorResult(
                success=False,
                error=f"Unknown action: {action_id}",
            )

    def _create_message(
        self,
        to: str,
        subject: str,
        body: str,
        cc: Optional[str] = None,
        bcc: Optional[str] = None,
    ) -> Dict[str, str]:
        """Create a MIME message for Gmail API."""
        message = MIMEMultipart()
        message["to"] = to
        message["subject"] = subject
        
        if cc:
            message["cc"] = cc
        if bcc:
            message["bcc"] = bcc

        # Detect if body is HTML or plain text
        if body.strip().startswith("<") and body.strip().endswith(">"):
            msg_part = MIMEText(body, "html")
        else:
            msg_part = MIMEText(body, "plain")
        
        message.attach(msg_part)

        # Encode the message
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        return {"raw": raw}

    async def _send_email(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Send an email via Gmail API."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        try:
            # Create the message
            message = self._create_message(
                to=parameters["to"],
                subject=parameters["subject"],
                body=parameters["body"],
                cc=parameters.get("cc"),
                bcc=parameters.get("bcc"),
            )

            # Send via Gmail API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json=message,
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            return ConnectorResult(
                success=True,
                data={
                    "message_id": result.get("id"),
                    "thread_id": result.get("threadId"),
                    "label_ids": result.get("labelIds", []),
                },
                message=f"Email sent successfully to {parameters['to']}",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Gmail API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to send email: {str(e)}",
            )

    async def _list_messages(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """List messages from Gmail."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        try:
            query = parameters.get("query", "")
            max_results = min(int(parameters.get("max_results", 10)), 100)

            params = {"maxResults": max_results}
            if query:
                params["q"] = query

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            messages = result.get("messages", [])
            result_size_estimate = result.get("resultSizeEstimate", 0)

            return ConnectorResult(
                success=True,
                data={
                    "messages": messages,
                    "result_size_estimate": result_size_estimate,
                    "next_page_token": result.get("nextPageToken"),
                },
                message=f"Found {len(messages)} messages",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Gmail API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to list messages: {str(e)}",
            )

    async def _get_message(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Get a specific message by ID."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        message_id = parameters.get("message_id")
        if not message_id:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: message_id",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"format": "full"},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            return ConnectorResult(
                success=True,
                data=result,
                message=f"Retrieved message {message_id}",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Gmail API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to get message: {str(e)}",
            )

    async def _mark_as_read(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Mark a message as read."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        message_id = parameters.get("message_id")
        if not message_id:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: message_id",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json={"removeLabelIds": ["UNREAD"]},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            return ConnectorResult(
                success=True,
                data=result,
                message=f"Marked message {message_id} as read",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Gmail API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to mark message as read: {str(e)}",
            )
