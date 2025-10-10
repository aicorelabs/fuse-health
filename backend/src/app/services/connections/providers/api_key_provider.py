"""API Key authentication provider."""
from datetime import datetime
from typing import Any, Dict, Optional

import httpx

from .base_provider import AuthProvider


class APIKeyProvider(AuthProvider):
    """API Key authentication provider for services like OpenAI, Anthropic, etc."""

    async def initiate_auth(
        self, redirect_uri: str, state: str, **kwargs: Any
    ) -> Dict[str, str]:
        """
        API keys don't have OAuth flow - user provides key directly.

        Returns instructions for the frontend to show an input field.
        """
        auth_config = self.config["auth_config"]

        return {
            "auth_type": "api_key",
            "message": f"Please provide your {self.config['display_name']} API key",
            "requires": auth_config["requires"],
            "instructions": f"Get your API key from the {self.config['display_name']} dashboard",
        }

    async def handle_callback(
        self, code: str, state: str, **kwargs: Any
    ) -> Dict[str, Any]:
        """
        For API keys, 'code' is actually the API key provided by user.
        """
        # Additional fields from kwargs
        api_key = code  # The "code" parameter contains the API key

        return {
            "api_key": api_key,
            "created_at": datetime.utcnow().isoformat(),
            # Include any additional fields (e.g., organization_id for OpenAI)
            **kwargs,
        }

    async def test_credentials(self, credentials: Dict[str, Any]) -> bool:
        """Test API key by making a test request."""
        test_url = self.config.get("test_endpoint")

        if not test_url:
            # No test endpoint, assume valid
            return True

        # Replace placeholders
        test_url = test_url.format(**credentials)

        headers = self.get_auth_headers(credentials)
        params = self.get_auth_params(credentials)

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    test_url, headers=headers, params=params, timeout=10.0
                )
                return response.status_code in [200, 201]
            except Exception:
                return False

    async def refresh_credentials(
        self, credentials: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """API keys typically don't expire - return None."""
        return None

    def get_auth_headers(self, credentials: Dict[str, Any]) -> Dict[str, str]:
        """Get authorization headers for API key authentication."""
        auth_config = self.config["auth_config"]

        # Check if it's a header-based auth
        if "header_name" in auth_config:
            header_name = auth_config["header_name"]
            prefix = auth_config.get("header_prefix")

            if prefix:
                value = f"{prefix} {credentials['api_key']}"
            else:
                value = credentials["api_key"]

            headers = {header_name: value}

            # Add any additional headers
            if "additional_headers" in auth_config:
                headers.update(auth_config["additional_headers"])

            return headers

        return {}

    def get_auth_params(self, credentials: Dict[str, Any]) -> Dict[str, str]:
        """Get query parameters for API key authentication."""
        auth_config = self.config["auth_config"]

        # Check if it's a query param auth
        if "query_param" in auth_config:
            param_name = auth_config["query_param"]
            return {param_name: credentials["api_key"]}

        return {}
