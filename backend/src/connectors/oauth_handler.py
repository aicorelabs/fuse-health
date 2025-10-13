"""
OAuth 2.0 handler for connectors that use OAuth authentication.

Provides methods for initiating OAuth flows, exchanging codes for tokens,
and refreshing access tokens.
"""

from typing import Dict, Optional, Any, List
from datetime import datetime, timedelta
import httpx
import secrets
import urllib.parse


class OAuthHandler:
    """
    Handle OAuth 2.0 authentication flows.

    Supports:
    - Authorization Code flow (most common)
    - Token refresh
    - State parameter for CSRF protection

    Usage:
        handler = OAuthHandler()

        # Step 1: Initiate authorization
        auth_data = await handler.initiate_authorization(
            client_id="...",
            authorization_url="https://...",
            redirect_uri="https://...",
            scopes=["email", "profile"]
        )
        # Redirect user to auth_data["authorization_url"]

        # Step 2: Exchange code for token (after user redirects back)
        tokens = await handler.exchange_code_for_token(
            code="...",
            client_id="...",
            client_secret="...",
            token_url="https://...",
            redirect_uri="https://..."
        )

        # Step 3: Refresh token when expired
        new_tokens = await handler.refresh_token(
            refresh_token=tokens["refresh_token"],
            client_id="...",
            client_secret="...",
            token_url="https://..."
        )
    """

    def __init__(self):
        """Initialize OAuth handler."""
        self._state_store: Dict[str, Dict[str, Any]] = {}

    async def initiate_authorization(
        self,
        client_id: str,
        authorization_url: str,
        redirect_uri: str,
        scopes: List[str],
        client_secret: Optional[str] = None,
        additional_params: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Initiate OAuth authorization flow.

        Generates authorization URL with state parameter for CSRF protection.

        Args:
            client_id: OAuth client ID
            authorization_url: Provider's authorization endpoint
            redirect_uri: Where provider redirects after authorization
            scopes: List of permission scopes
            client_secret: Optional client secret (for some providers)
            additional_params: Additional query parameters

        Returns:
            Dict with:
                - authorization_url: URL to redirect user to
                - state: State parameter (store this!)
        """
        # Generate random state for CSRF protection
        state = secrets.token_urlsafe(32)

        # Store state with metadata (for verification later)
        self._state_store[state] = {
            "created_at": datetime.utcnow(),
            "client_id": client_id,
            "redirect_uri": redirect_uri,
        }

        # Build authorization URL
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(scopes),
            "state": state,
        }

        # Add additional parameters
        if additional_params:
            params.update(additional_params)

        # Build URL
        query_string = urllib.parse.urlencode(params)
        full_url = f"{authorization_url}?{query_string}"

        return {
            "authorization_url": full_url,
            "state": state,
        }

    def verify_state(self, state: str) -> bool:
        """
        Verify state parameter from OAuth callback.

        Args:
            state: State parameter from callback

        Returns:
            True if state is valid, False otherwise
        """
        if state not in self._state_store:
            return False

        # Check if state is expired (30 minutes)
        state_data = self._state_store[state]
        created_at = state_data["created_at"]
        age = (datetime.utcnow() - created_at).total_seconds()

        if age > 1800:  # 30 minutes
            self._state_store.pop(state, None)
            return False

        return True

    async def exchange_code_for_token(
        self,
        code: str,
        client_id: str,
        client_secret: str,
        token_url: str,
        redirect_uri: str,
        additional_params: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for access token.

        Args:
            code: Authorization code from callback
            client_id: OAuth client ID
            client_secret: OAuth client secret
            token_url: Provider's token endpoint
            redirect_uri: Same redirect_uri used in authorization
            additional_params: Additional request parameters

        Returns:
            Dict with:
                - access_token: Access token
                - refresh_token: Refresh token (if provided)
                - expires_in: Token expiration in seconds
                - token_type: Token type (usually "Bearer")
                - scope: Granted scopes

        Raises:
            httpx.HTTPError: If token exchange fails
        """
        # Build request data
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret,
        }

        # Add additional parameters
        if additional_params:
            data.update(additional_params)

        # Make token request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data=data,
                headers={"Accept": "application/json"}
            )
            response.raise_for_status()

            token_data = response.json()

        # Calculate expiration timestamp
        if "expires_in" in token_data:
            expires_at = datetime.utcnow(
            ) + timedelta(seconds=token_data["expires_in"])
            token_data["expires_at"] = expires_at.isoformat()

        return token_data

    async def refresh_token(
        self,
        refresh_token: str,
        client_id: str,
        client_secret: str,
        token_url: str,
        additional_params: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Refresh access token using refresh token.

        Args:
            refresh_token: Refresh token from initial authorization
            client_id: OAuth client ID
            client_secret: OAuth client secret
            token_url: Provider's token endpoint
            additional_params: Additional request parameters

        Returns:
            Dict with new access_token and possibly new refresh_token

        Raises:
            httpx.HTTPError: If token refresh fails
        """
        # Build request data
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
        }

        # Add additional parameters
        if additional_params:
            data.update(additional_params)

        # Make token request
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data=data,
                headers={"Accept": "application/json"}
            )
            response.raise_for_status()

            token_data = response.json()

        # Calculate expiration timestamp
        if "expires_in" in token_data:
            expires_at = datetime.utcnow(
            ) + timedelta(seconds=token_data["expires_in"])
            token_data["expires_at"] = expires_at.isoformat()

        # Some providers don't return a new refresh token
        # Keep the old one if not provided
        if "refresh_token" not in token_data:
            token_data["refresh_token"] = refresh_token

        return token_data

    def is_token_expired(
        self,
        expires_at: Optional[str],
        buffer_seconds: int = 300
    ) -> bool:
        """
        Check if access token is expired.

        Args:
            expires_at: Token expiration timestamp (ISO format)
            buffer_seconds: Consider expired if within this many seconds (default 5 min)

        Returns:
            True if expired or expiring soon, False otherwise
        """
        if not expires_at:
            return False

        try:
            expiration = datetime.fromisoformat(expires_at)
            now = datetime.utcnow()

            # Check if expired or expiring soon
            return (expiration - now).total_seconds() <= buffer_seconds

        except (ValueError, TypeError):
            return False

    async def revoke_token(
        self,
        token: str,
        revocation_url: str,
        client_id: str,
        client_secret: str,
        token_type: str = "access_token"
    ) -> bool:
        """
        Revoke an access or refresh token.

        Args:
            token: Token to revoke
            revocation_url: Provider's revocation endpoint
            client_id: OAuth client ID
            client_secret: OAuth client secret
            token_type: Type of token ("access_token" or "refresh_token")

        Returns:
            True if revocation succeeded, False otherwise
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    revocation_url,
                    data={
                        "token": token,
                        "token_type_hint": token_type,
                        "client_id": client_id,
                        "client_secret": client_secret,
                    }
                )
                return response.status_code in [200, 204]

        except Exception:
            return False


# Global OAuth handler instance
oauth_handler = OAuthHandler()
