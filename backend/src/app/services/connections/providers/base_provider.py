"""Base authentication provider interface."""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class AuthProvider(ABC):
    """Base class for all authentication providers."""

    def __init__(self, service_type: str, config: Dict[str, Any]):
        """
        Initialize auth provider.

        Args:
            service_type: Type of service (gmail, openai, etc.)
            config: Service definition configuration
        """
        self.service_type = service_type
        self.config = config

    @abstractmethod
    async def initiate_auth(
        self, redirect_uri: str, state: str, **kwargs: Any
    ) -> Dict[str, str]:
        """
        Initiate authentication flow.

        Args:
            redirect_uri: OAuth redirect URI
            state: CSRF protection state token
            **kwargs: Additional service-specific parameters

        Returns:
            Dictionary with auth flow data (authorization_url, etc.)
        """
        pass

    @abstractmethod
    async def handle_callback(
        self, code: str, state: str, **kwargs: Any
    ) -> Dict[str, Any]:
        """
        Handle OAuth callback or credential submission.

        Args:
            code: Authorization code or API key
            state: CSRF state token
            **kwargs: Additional callback parameters

        Returns:
            Credentials dictionary to be encrypted
        """
        pass

    @abstractmethod
    async def test_credentials(self, credentials: Dict[str, Any]) -> bool:
        """
        Test if credentials are valid.

        Args:
            credentials: Decrypted credentials dictionary

        Returns:
            True if valid, False otherwise
        """
        pass

    @abstractmethod
    async def refresh_credentials(
        self, credentials: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Refresh expired credentials if supported.

        Args:
            credentials: Current credentials

        Returns:
            New credentials or None if not applicable
        """
        pass

    @abstractmethod
    def get_auth_headers(self, credentials: Dict[str, Any]) -> Dict[str, str]:
        """
        Get HTTP headers for authenticated requests.

        Args:
            credentials: Decrypted credentials

        Returns:
            Dictionary of headers
        """
        pass

    def get_auth_params(self, credentials: Dict[str, Any]) -> Dict[str, str]:
        """
        Get query parameters for authenticated requests.

        Args:
            credentials: Decrypted credentials

        Returns:
            Dictionary of query parameters
        """
        return {}
