"""
Anthropic Connector - Access Claude AI models via Anthropic API.

This connector provides access to Anthropic's Claude models using API key authentication.
"""
from typing import Any, Dict, List
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


class AnthropicConnector(BaseConnector):
    """Anthropic connector for Claude AI models."""

    API_VERSION = "2023-06-01"

    def get_metadata(self) -> ConnectorMetadata:
        """Return Anthropic connector metadata."""
        return ConnectorMetadata(
            id="anthropic",
            name="Anthropic",
            description="Access Claude AI models for text generation and analysis",
            category=ConnectorCategory.AI,
            auth_type=AuthType.API_KEY,
            icon="🧠",
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available Anthropic actions."""
        return [
            ConnectorAction(
                id="create_message",
                name="Create Message",
                description="Generate a response using Claude",
                category="query",
                params=[
                    ActionParameter(
                        name="model",
                        type="string",
                        description="Model to use (e.g., 'claude-3-opus-20240229', 'claude-3-sonnet-20240229')",
                        required=True,
                    ),
                    ActionParameter(
                        name="messages",
                        type="array",
                        description="Array of message objects with 'role' and 'content'",
                        required=True,
                    ),
                    ActionParameter(
                        name="max_tokens",
                        type="integer",
                        description="Maximum tokens to generate (required)",
                        required=True,
                    ),
                    ActionParameter(
                        name="temperature",
                        type="number",
                        description="Sampling temperature (0.0 to 1.0, default: 1.0)",
                        required=False,
                    ),
                    ActionParameter(
                        name="system",
                        type="string",
                        description="System prompt to guide Claude's behavior",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="create_message_stream",
                name="Create Message (Streaming)",
                description="Generate a streaming response using Claude",
                category="query",
                params=[
                    ActionParameter(
                        name="model",
                        type="string",
                        description="Model to use",
                        required=True,
                    ),
                    ActionParameter(
                        name="messages",
                        type="array",
                        description="Array of message objects",
                        required=True,
                    ),
                    ActionParameter(
                        name="max_tokens",
                        type="integer",
                        description="Maximum tokens to generate",
                        required=True,
                    ),
                ],
            ),
        ]

    async def execute(
        self, action_id: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Execute an Anthropic action."""
        if action_id == "create_message":
            return await self._create_message(parameters, credentials)
        elif action_id == "create_message_stream":
            return await self._create_message_stream(parameters, credentials)
        else:
            return ConnectorResult(
                success=False,
                error=f"Unknown action: {action_id}",
            )

    async def _create_message(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Generate a message using Claude."""
        api_key = credentials.get("api_key")
        if not api_key:
            return ConnectorResult(
                success=False,
                error="Missing api_key in credentials",
            )

        try:
            payload = {
                "model": parameters["model"],
                "messages": parameters["messages"],
                "max_tokens": int(parameters["max_tokens"]),
            }

            # Add optional parameters
            if "temperature" in parameters:
                payload["temperature"] = float(parameters["temperature"])
            if "system" in parameters:
                payload["system"] = parameters["system"]

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": self.API_VERSION,
                        "content-type": "application/json",
                    },
                    json=payload,
                    timeout=120.0,
                )
                response.raise_for_status()
                result = response.json()

            # Extract text content from response
            content_blocks = result.get("content", [])
            text_content = ""
            for block in content_blocks:
                if block.get("type") == "text":
                    text_content += block.get("text", "")

            return ConnectorResult(
                success=True,
                data={
                    "id": result.get("id"),
                    "model": result.get("model"),
                    "role": result.get("role"),
                    "content": content_blocks,
                    "text": text_content,
                    "stop_reason": result.get("stop_reason"),
                    "usage": result.get("usage", {}),
                },
                message="Message generated successfully",
            )

        except httpx.HTTPStatusError as e:
            error_text = e.response.text
            return ConnectorResult(
                success=False,
                error=f"Anthropic API error: {e.response.status_code} - {error_text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to generate message: {str(e)}",
            )

    async def _create_message_stream(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Generate a streaming message (returns initial chunks)."""
        api_key = credentials.get("api_key")
        if not api_key:
            return ConnectorResult(
                success=False,
                error="Missing api_key in credentials",
            )

        try:
            payload = {
                "model": parameters["model"],
                "messages": parameters["messages"],
                "max_tokens": int(parameters["max_tokens"]),
                "stream": True,
            }

            collected_text = ""
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": self.API_VERSION,
                        "content-type": "application/json",
                    },
                    json=payload,
                    timeout=120.0,
                ) as response:
                    response.raise_for_status()
                    
                    # Collect first few chunks
                    chunk_count = 0
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            chunk_count += 1
                            if chunk_count <= 10:  # Collect first 10 chunks
                                data = line[6:]  # Remove "data: " prefix
                                # Parse and extract text if needed
                                collected_text += data[:100]  # Limit per chunk
                        
                        if chunk_count >= 10:
                            break

            return ConnectorResult(
                success=True,
                data={
                    "message": "Streaming initiated (showing first chunks)",
                    "preview": collected_text[:500],
                    "chunks_collected": chunk_count,
                },
                message="Streaming message started successfully",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Anthropic API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to generate streaming message: {str(e)}",
            )
