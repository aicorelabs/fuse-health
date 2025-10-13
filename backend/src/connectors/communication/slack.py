"""
Slack Connector - Send messages and interact with Slack workspaces.

This connector provides Slack messaging capabilities using OAuth 2.0 authentication.
"""
from typing import Any, Dict, List, Optional
import httpx

from ..base import (
    BaseConnector,
    ConnectorMetadata,
    ConnectorAction,
    ActionParameter,
    ConnectorResult,
    AuthType,
    ConnectorCategory,
)


class SlackConnector(BaseConnector):
    """Slack connector for messaging and workspace interactions."""

    def get_metadata(self) -> ConnectorMetadata:
        """Return Slack connector metadata."""
        return ConnectorMetadata(
            id="slack",
            name="Slack",
            description="Send messages and interact with Slack workspaces",
            category=ConnectorCategory.COMMUNICATION,
            auth_type=AuthType.OAUTH2,
            icon="💬",
            oauth_config={
                "authorization_url": "https://slack.com/oauth/v2/authorize",
                "token_url": "https://slack.com/api/oauth.v2.access",
                "scopes": [
                    "chat:write",
                    "channels:read",
                    "users:read",
                    "chat:write.public",
                ],
            },
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available Slack actions."""
        return [
            ConnectorAction(
                id="send_message",
                name="Send Message",
                description="Send a message to a Slack channel or user",
                category="query",
                params=[
                    ActionParameter(
                        name="channel",
                        type="string",
                        description="Channel ID or name (e.g., '#general', 'C1234567890', '@username')",
                        required=True,
                    ),
                    ActionParameter(
                        name="text",
                        type="string",
                        description="Message text (supports Slack markdown)",
                        required=True,
                    ),
                    ActionParameter(
                        name="thread_ts",
                        type="string",
                        description="Thread timestamp to reply to (optional)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="list_channels",
                name="List Channels",
                description="List all channels in the workspace",
                category="query",
                params=[
                    ActionParameter(
                        name="limit",
                        type="integer",
                        description="Maximum number of channels to return (default: 100)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="get_channel_info",
                name="Get Channel Info",
                description="Get information about a specific channel",
                category="query",
                params=[
                    ActionParameter(
                        name="channel_id",
                        type="string",
                        description="Channel ID",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="list_users",
                name="List Users",
                description="List all users in the workspace",
                category="query",
                params=[
                    ActionParameter(
                        name="limit",
                        type="integer",
                        description="Maximum number of users to return (default: 100)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="update_message",
                name="Update Message",
                description="Update an existing message",
                category="query",
                params=[
                    ActionParameter(
                        name="channel",
                        type="string",
                        description="Channel ID where the message is",
                        required=True,
                    ),
                    ActionParameter(
                        name="ts",
                        type="string",
                        description="Timestamp of the message to update",
                        required=True,
                    ),
                    ActionParameter(
                        name="text",
                        type="string",
                        description="New message text",
                        required=True,
                    ),
                ],
            ),
        ]

    async def execute(
        self, action_id: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Execute a Slack action."""
        if action_id == "send_message":
            return await self._send_message(parameters, credentials)
        elif action_id == "list_channels":
            return await self._list_channels(parameters, credentials)
        elif action_id == "get_channel_info":
            return await self._get_channel_info(parameters, credentials)
        elif action_id == "list_users":
            return await self._list_users(parameters, credentials)
        elif action_id == "update_message":
            return await self._update_message(parameters, credentials)
        else:
            return ConnectorResult(
                success=False,
                error=f"Unknown action: {action_id}",
            )

    async def _send_message(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Send a message to a Slack channel."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        try:
            payload = {
                "channel": parameters["channel"],
                "text": parameters["text"],
            }
            
            # Add thread_ts if provided
            if "thread_ts" in parameters and parameters["thread_ts"]:
                payload["thread_ts"] = parameters["thread_ts"]

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://slack.com/api/chat.postMessage",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            if not result.get("ok"):
                return ConnectorResult(
                    success=False,
                    error=f"Slack API error: {result.get('error', 'Unknown error')}",
                )

            return ConnectorResult(
                success=True,
                data={
                    "channel": result.get("channel"),
                    "ts": result.get("ts"),
                    "message": result.get("message"),
                },
                message=f"Message sent to {parameters['channel']}",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"HTTP error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to send message: {str(e)}",
            )

    async def _list_channels(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """List all channels in the workspace."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        try:
            limit = min(int(parameters.get("limit", 100)), 1000)

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://slack.com/api/conversations.list",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"limit": limit, "types": "public_channel,private_channel"},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            if not result.get("ok"):
                return ConnectorResult(
                    success=False,
                    error=f"Slack API error: {result.get('error', 'Unknown error')}",
                )

            channels = result.get("channels", [])
            return ConnectorResult(
                success=True,
                data={
                    "channels": [
                        {
                            "id": ch.get("id"),
                            "name": ch.get("name"),
                            "is_private": ch.get("is_private"),
                            "num_members": ch.get("num_members"),
                        }
                        for ch in channels
                    ],
                    "count": len(channels),
                },
                message=f"Found {len(channels)} channels",
            )

        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to list channels: {str(e)}",
            )

    async def _get_channel_info(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Get information about a specific channel."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        channel_id = parameters.get("channel_id")
        if not channel_id:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: channel_id",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://slack.com/api/conversations.info",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"channel": channel_id},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            if not result.get("ok"):
                return ConnectorResult(
                    success=False,
                    error=f"Slack API error: {result.get('error', 'Unknown error')}",
                )

            return ConnectorResult(
                success=True,
                data=result.get("channel", {}),
                message=f"Retrieved info for channel {channel_id}",
            )

        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to get channel info: {str(e)}",
            )

    async def _list_users(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """List all users in the workspace."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        try:
            limit = min(int(parameters.get("limit", 100)), 1000)

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://slack.com/api/users.list",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"limit": limit},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            if not result.get("ok"):
                return ConnectorResult(
                    success=False,
                    error=f"Slack API error: {result.get('error', 'Unknown error')}",
                )

            users = result.get("members", [])
            return ConnectorResult(
                success=True,
                data={
                    "users": [
                        {
                            "id": u.get("id"),
                            "name": u.get("name"),
                            "real_name": u.get("real_name"),
                            "is_bot": u.get("is_bot"),
                        }
                        for u in users
                        if not u.get("deleted")
                    ],
                    "count": len([u for u in users if not u.get("deleted")]),
                },
                message=f"Found {len(users)} users",
            )

        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to list users: {str(e)}",
            )

    async def _update_message(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Update an existing message."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        try:
            payload = {
                "channel": parameters["channel"],
                "ts": parameters["ts"],
                "text": parameters["text"],
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://slack.com/api/chat.update",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            if not result.get("ok"):
                return ConnectorResult(
                    success=False,
                    error=f"Slack API error: {result.get('error', 'Unknown error')}",
                )

            return ConnectorResult(
                success=True,
                data=result,
                message=f"Message updated in {parameters['channel']}",
            )

        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to update message: {str(e)}",
            )
