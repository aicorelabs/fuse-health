"""
HTTP Request Connector - Make generic HTTP requests to any API.

This connector provides a flexible way to make HTTP requests with various
authentication methods and request types.
"""
from typing import Any, Dict, List, Optional
import httpx
import json

from ..base import (
    BaseConnector,
    ConnectorMetadata,
    ConnectorAction,
    ActionParameter,
    ConnectorResult,
    AuthType,
    ConnectorCategory,
)


class HTTPConnector(BaseConnector):
    """Generic HTTP connector for API requests."""

    def get_metadata(self) -> ConnectorMetadata:
        """Return HTTP connector metadata."""
        return ConnectorMetadata(
            id="http",
            name="HTTP Request",
            description="Make generic HTTP requests to any API endpoint",
            category=ConnectorCategory.WEB,
            auth_type=AuthType.API_KEY,  # Flexible - can use headers for auth
            icon="🌐",
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available HTTP actions."""
        return [
            ConnectorAction(
                id="get_request",
                name="GET Request",
                description="Make a GET request",
                category="query",
                params=[
                    ActionParameter(
                        name="url",
                        type="string",
                        description="Full URL to request",
                        required=True,
                    ),
                    ActionParameter(
                        name="headers",
                        type="object",
                        description="Request headers (optional)",
                        required=False,
                    ),
                    ActionParameter(
                        name="params",
                        type="object",
                        description="Query parameters (optional)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="post_request",
                name="POST Request",
                description="Make a POST request",
                category="query",
                params=[
                    ActionParameter(
                        name="url",
                        type="string",
                        description="Full URL to request",
                        required=True,
                    ),
                    ActionParameter(
                        name="body",
                        type="object",
                        description="Request body (JSON)",
                        required=False,
                    ),
                    ActionParameter(
                        name="headers",
                        type="object",
                        description="Request headers (optional)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="put_request",
                name="PUT Request",
                description="Make a PUT request",
                category="query",
                params=[
                    ActionParameter(
                        name="url",
                        type="string",
                        description="Full URL to request",
                        required=True,
                    ),
                    ActionParameter(
                        name="body",
                        type="object",
                        description="Request body (JSON)",
                        required=False,
                    ),
                    ActionParameter(
                        name="headers",
                        type="object",
                        description="Request headers (optional)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="patch_request",
                name="PATCH Request",
                description="Make a PATCH request",
                category="query",
                params=[
                    ActionParameter(
                        name="url",
                        type="string",
                        description="Full URL to request",
                        required=True,
                    ),
                    ActionParameter(
                        name="body",
                        type="object",
                        description="Request body (JSON)",
                        required=False,
                    ),
                    ActionParameter(
                        name="headers",
                        type="object",
                        description="Request headers (optional)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="delete_request",
                name="DELETE Request",
                description="Make a DELETE request",
                category="query",
                params=[
                    ActionParameter(
                        name="url",
                        type="string",
                        description="Full URL to request",
                        required=True,
                    ),
                    ActionParameter(
                        name="headers",
                        type="object",
                        description="Request headers (optional)",
                        required=False,
                    ),
                ],
            ),
        ]

    async def execute(
        self, action_id: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Execute an HTTP action."""
        if action_id == "get_request":
            return await self._make_request("GET", parameters, credentials)
        elif action_id == "post_request":
            return await self._make_request("POST", parameters, credentials)
        elif action_id == "put_request":
            return await self._make_request("PUT", parameters, credentials)
        elif action_id == "patch_request":
            return await self._make_request("PATCH", parameters, credentials)
        elif action_id == "delete_request":
            return await self._make_request("DELETE", parameters, credentials)
        else:
            return ConnectorResult(
                success=False,
                error=f"Unknown action: {action_id}",
            )

    async def _make_request(
        self, method: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Make an HTTP request with the specified method."""
        url = parameters.get("url")
        if not url:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: url",
            )

        try:
            # Build headers
            headers = parameters.get("headers", {})
            
            # Add authentication if provided
            api_key = credentials.get("api_key")
            if api_key and "Authorization" not in headers:
                # Try to determine auth header format
                if api_key.startswith("Bearer "):
                    headers["Authorization"] = api_key
                else:
                    headers["Authorization"] = f"Bearer {api_key}"

            # Get body and params
            body = parameters.get("body")
            params = parameters.get("params")

            # Set content type if body is present and not already set
            if body and "Content-Type" not in headers:
                headers["Content-Type"] = "application/json"

            async with httpx.AsyncClient() as client:
                # Build request kwargs
                request_kwargs = {
                    "url": url,
                    "headers": headers,
                    "timeout": 60.0,
                }

                if params:
                    request_kwargs["params"] = params

                if body and method in ["POST", "PUT", "PATCH"]:
                    if isinstance(body, (dict, list)):
                        request_kwargs["json"] = body
                    else:
                        request_kwargs["content"] = str(body)

                # Make request
                response = await client.request(method, **request_kwargs)
                
                # Try to parse response as JSON
                try:
                    response_data = response.json()
                except json.JSONDecodeError:
                    response_data = {"text": response.text}

                # Check if request was successful
                is_success = 200 <= response.status_code < 300

                return ConnectorResult(
                    success=is_success,
                    data={
                        "status_code": response.status_code,
                        "headers": dict(response.headers),
                        "body": response_data,
                        "url": str(response.url),
                    },
                    message=f"{method} request to {url} returned {response.status_code}",
                    error=None if is_success else f"HTTP {response.status_code}: {response.text[:200]}",
                )

        except httpx.RequestError as e:
            return ConnectorResult(
                success=False,
                error=f"Request failed: {str(e)}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to make {method} request: {str(e)}",
            )

    def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        """
        HTTP connector doesn't require credentials validation as it's optional.
        """
        return True  # Always valid since credentials are optional
