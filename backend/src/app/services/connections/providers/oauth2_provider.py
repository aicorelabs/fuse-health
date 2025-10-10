"""OAuth 2.0 authentication provider."""
import os
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import httpx

from .base_provider import AuthProvider


class OAuth2Provider(AuthProvider):
    """OAuth 2.0 authentication provider for services like Gmail, Slack, etc."""

    async def initiate_auth(
        self, redirect_uri: str, state: str, **kwargs: Any
    ) -> Dict[str, str]:
        """Initiate OAuth 2.0 authorization flow."""
        auth_config = self.config["auth_config"]

        # Get client credentials from environment
        client_id = os.getenv(
            f"{self.service_type.upper().replace('-', '_')}_CLIENT_ID")

        if not client_id:
            return {
                "error": f"Missing {self.service_type.upper()}_CLIENT_ID environment variable",
                "requires_setup": True,
            }

        # Build authorization URL
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(auth_config.get("scopes", [])),
            "state": state,
            "access_type": "offline",  # Request refresh token
            "prompt": "consent",  # Force consent to get refresh token
        }

        # Add any additional parameters
        params.update(kwargs)

        auth_url = (
            f"{auth_config['authorization_endpoint']}?{urlencode(params)}"
        )

        return {
            "authorization_url": auth_url,
            "state": state,
            "client_id": client_id,
        }

    async def handle_callback(
        self, code: str, state: str, **kwargs: Any
    ) -> Dict[str, Any]:
        """Handle OAuth callback and exchange code for tokens."""
        auth_config = self.config["auth_config"]

        # Get credentials from environment
        env_prefix = self.service_type.upper().replace("-", "_")
        client_id = os.getenv(f"{env_prefix}_CLIENT_ID")
        client_secret = os.getenv(f"{env_prefix}_CLIENT_SECRET")
        redirect_uri = kwargs.get(
            "redirect_uri") or os.getenv("OAUTH_REDIRECT_URI")

        if not all([client_id, client_secret, redirect_uri]):
            raise ValueError(
                f"Missing OAuth configuration for {self.service_type}"
            )

        # Exchange code for tokens
        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                auth_config["token_endpoint"], data=token_data, timeout=30.0
            )
            response.raise_for_status()
            tokens = response.json()

        # Calculate expiration time
        expires_in = tokens.get("expires_in", 3600)
        expires_at = (datetime.utcnow() +
                      timedelta(seconds=expires_in)).isoformat()

        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token"),
            "expires_at": expires_at,
            "expires_in": expires_in,
            "token_type": tokens.get("token_type", "Bearer"),
            "scope": tokens.get("scope"),
            "obtained_at": datetime.utcnow().isoformat(),
        }

    async def test_credentials(self, credentials: Dict[str, Any]) -> bool:
        """Test OAuth credentials by making a test API call."""
        test_url = self.config.get("test_endpoint")

        if not test_url:
            # No test endpoint defined, assume valid
            return True

        # Replace placeholders in test URL
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
        """Refresh expired OAuth tokens using refresh token."""
        if "refresh_token" not in credentials:
            return None

        auth_config = self.config["auth_config"]

        # Get client credentials
        env_prefix = self.service_type.upper().replace("-", "_")
        client_id = os.getenv(f"{env_prefix}_CLIENT_ID")
        client_secret = os.getenv(f"{env_prefix}_CLIENT_SECRET")

        if not all([client_id, client_secret]):
            return None

        refresh_data = {
            "refresh_token": credentials["refresh_token"],
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    auth_config["token_endpoint"],
                    data=refresh_data,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    tokens = response.json()

                    # Calculate new expiration
                    expires_in = tokens.get("expires_in", 3600)
                    expires_at = (
                        datetime.utcnow() + timedelta(seconds=expires_in)
                    ).isoformat()

                    # Update credentials with new token
                    return {
                        **credentials,
                        "access_token": tokens["access_token"],
                        "expires_at": expires_at,
                        "expires_in": expires_in,
                        "refreshed_at": datetime.utcnow().isoformat(),
                    }
            except Exception:
                return None

        return None

    def get_auth_headers(self, credentials: Dict[str, Any]) -> Dict[str, str]:
        """Get authorization headers for API requests."""
        token_type = credentials.get("token_type", "Bearer")
        access_token = credentials["access_token"]

        return {"Authorization": f"{token_type} {access_token}"}
