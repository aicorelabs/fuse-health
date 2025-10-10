"""Basic Auth authentication provider."""
from datetime import datetime
from typing import Any, Dict, Optional
import base64

import httpx

from .base_provider import AuthProvider


class BasicAuthProvider(AuthProvider):
    """Basic Authentication provider for services requiring username/password."""

    async def initiate_auth(
        self, redirect_uri: str, state: str, **kwargs: Any
    ) -> Dict[str, str]:
        """Basic auth requires username and password input."""
        auth_config = self.config["auth_config"]

        return {
            "auth_type": "basic_auth",
            "message": f"Please provide credentials for {self.config['display_name']}",
            "requires": auth_config["requires"],
        }

    async def handle_callback(
        self, code: str, state: str, **kwargs: Any
    ) -> Dict[str, Any]:
        """
        For basic auth, credentials come from kwargs.
        """
        username = kwargs.get("username", "")
        password = kwargs.get("password", "")
        server_url = kwargs.get("server_url", "")

        return {
            "username": username,
            "password": password,
            "server_url": server_url,
            "created_at": datetime.utcnow().isoformat(),
        }

    async def test_credentials(self, credentials: Dict[str, Any]) -> bool:
        """Test basic auth credentials."""
        test_url = self.config.get("test_endpoint")

        if not test_url:
            return True

        # Replace placeholders
        test_url = test_url.format(**credentials)

        headers = self.get_auth_headers(credentials)

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(test_url, headers=headers, timeout=10.0)
                return response.status_code in [200, 201]
            except Exception:
                return False

    async def refresh_credentials(
        self, credentials: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Basic auth credentials don't expire."""
        return None

    def get_auth_headers(self, credentials: Dict[str, Any]) -> Dict[str, str]:
        """Get Basic Auth headers."""
        username = credentials.get("username", "")
        password = credentials.get("password", "")

        # Encode credentials
        auth_string = f"{username}:{password}"
        encoded = base64.b64encode(auth_string.encode()).decode()

        return {"Authorization": f"Basic {encoded}"}
