"""
OpenAI Connector - Access OpenAI's GPT models and embeddings.

This connector provides AI capabilities using API key authentication.
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


class OpenAIConnector(BaseConnector):
    """OpenAI connector for LLM and embedding operations."""

    def get_metadata(self) -> ConnectorMetadata:
        """Return OpenAI connector metadata."""
        return ConnectorMetadata(
            id="openai",
            name="OpenAI",
            description="Access GPT models, embeddings, and other OpenAI services",
            category=ConnectorCategory.AI,
            auth_type=AuthType.API_KEY,
            icon="🤖",
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available OpenAI actions."""
        return [
            ConnectorAction(
                id="chat_completion",
                name="Chat Completion",
                description="Generate a chat completion using GPT models",
                category="query",
                params=[
                    ActionParameter(
                        name="model",
                        type="string",
                        description="Model to use (e.g., 'gpt-4', 'gpt-3.5-turbo')",
                        required=True,
                    ),
                    ActionParameter(
                        name="messages",
                        type="array",
                        description="Array of message objects with 'role' and 'content'",
                        required=True,
                    ),
                    ActionParameter(
                        name="temperature",
                        type="number",
                        description="Sampling temperature (0.0 to 2.0, default: 1.0)",
                        required=False,
                    ),
                    ActionParameter(
                        name="max_tokens",
                        type="integer",
                        description="Maximum tokens to generate",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="create_embedding",
                name="Create Embedding",
                description="Create embeddings for text input",
                category="query",
                params=[
                    ActionParameter(
                        name="input",
                        type="string",
                        description="Text to create embeddings for",
                        required=True,
                    ),
                    ActionParameter(
                        name="model",
                        type="string",
                        description="Embedding model (default: 'text-embedding-ada-002')",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="list_models",
                name="List Models",
                description="List all available OpenAI models",
                category="query",
                params=[],
            ),
            ConnectorAction(
                id="create_completion",
                name="Create Completion",
                description="Create a text completion (legacy endpoint)",
                category="query",
                params=[
                    ActionParameter(
                        name="model",
                        type="string",
                        description="Model to use (e.g., 'gpt-3.5-turbo-instruct')",
                        required=True,
                    ),
                    ActionParameter(
                        name="prompt",
                        type="string",
                        description="Prompt text",
                        required=True,
                    ),
                    ActionParameter(
                        name="max_tokens",
                        type="integer",
                        description="Maximum tokens to generate",
                        required=False,
                    ),
                    ActionParameter(
                        name="temperature",
                        type="number",
                        description="Sampling temperature (0.0 to 2.0)",
                        required=False,
                    ),
                ],
            ),
        ]

    async def execute(
        self, action_id: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Execute an OpenAI action."""
        if action_id == "chat_completion":
            return await self._chat_completion(parameters, credentials)
        elif action_id == "create_embedding":
            return await self._create_embedding(parameters, credentials)
        elif action_id == "list_models":
            return await self._list_models(credentials)
        elif action_id == "create_completion":
            return await self._create_completion(parameters, credentials)
        else:
            return ConnectorResult(
                success=False,
                error=f"Unknown action: {action_id}",
            )

    async def _chat_completion(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Generate a chat completion."""
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
            }

            # Add optional parameters
            if "temperature" in parameters:
                payload["temperature"] = float(parameters["temperature"])
            if "max_tokens" in parameters:
                payload["max_tokens"] = int(parameters["max_tokens"])

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=60.0,
                )
                response.raise_for_status()
                result = response.json()

            return ConnectorResult(
                success=True,
                data={
                    "id": result.get("id"),
                    "model": result.get("model"),
                    "choices": result.get("choices", []),
                    "usage": result.get("usage", {}),
                    "content": result.get("choices", [{}])[0].get("message", {}).get("content"),
                },
                message="Chat completion generated successfully",
            )

        except httpx.HTTPStatusError as e:
            error_text = e.response.text
            return ConnectorResult(
                success=False,
                error=f"OpenAI API error: {e.response.status_code} - {error_text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to generate completion: {str(e)}",
            )

    async def _create_embedding(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Create embeddings for text."""
        api_key = credentials.get("api_key")
        if not api_key:
            return ConnectorResult(
                success=False,
                error="Missing api_key in credentials",
            )

        try:
            payload = {
                "input": parameters["input"],
                "model": parameters.get("model", "text-embedding-ada-002"),
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            embeddings = result.get("data", [])
            return ConnectorResult(
                success=True,
                data={
                    "embeddings": embeddings,
                    "model": result.get("model"),
                    "usage": result.get("usage", {}),
                },
                message=f"Created {len(embeddings)} embedding(s)",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"OpenAI API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to create embeddings: {str(e)}",
            )

    async def _list_models(self, credentials: Dict[str, Any]) -> ConnectorResult:
        """List all available models."""
        api_key = credentials.get("api_key")
        if not api_key:
            return ConnectorResult(
                success=False,
                error="Missing api_key in credentials",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            models = result.get("data", [])
            return ConnectorResult(
                success=True,
                data={
                    "models": [
                        {
                            "id": m.get("id"),
                            "created": m.get("created"),
                            "owned_by": m.get("owned_by"),
                        }
                        for m in models
                    ],
                    "count": len(models),
                },
                message=f"Found {len(models)} models",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"OpenAI API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to list models: {str(e)}",
            )

    async def _create_completion(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Create a text completion (legacy)."""
        api_key = credentials.get("api_key")
        if not api_key:
            return ConnectorResult(
                success=False,
                error="Missing api_key in credentials",
            )

        try:
            payload = {
                "model": parameters["model"],
                "prompt": parameters["prompt"],
            }

            if "max_tokens" in parameters:
                payload["max_tokens"] = int(parameters["max_tokens"])
            if "temperature" in parameters:
                payload["temperature"] = float(parameters["temperature"])

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=60.0,
                )
                response.raise_for_status()
                result = response.json()

            return ConnectorResult(
                success=True,
                data={
                    "id": result.get("id"),
                    "model": result.get("model"),
                    "choices": result.get("choices", []),
                    "usage": result.get("usage", {}),
                    "text": result.get("choices", [{}])[0].get("text"),
                },
                message="Completion generated successfully",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"OpenAI API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to generate completion: {str(e)}",
            )
