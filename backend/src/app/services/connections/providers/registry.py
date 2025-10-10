"""Registry for authentication providers."""
from typing import Dict, Type

from .api_key_provider import APIKeyProvider
from .base_provider import AuthProvider
from .basic_auth_provider import BasicAuthProvider
from .oauth2_provider import OAuth2Provider
from .service_definitions import get_service_definition


class AuthProviderRegistry:
    """Central registry for authentication providers."""

    _providers: Dict[str, Type[AuthProvider]] = {
        "oauth2": OAuth2Provider,
        "api_key": APIKeyProvider,
        "basic_auth": BasicAuthProvider,
        "bearer_token": APIKeyProvider,  # Bearer tokens work like API keys
        "client_credentials": OAuth2Provider,  # Use OAuth2 provider
    }

    @classmethod
    def get_provider(cls, service_type: str) -> AuthProvider:
        """
        Get the appropriate auth provider for a service type.

        Args:
            service_type: Service type (gmail, openai, etc.)

        Returns:
            Configured AuthProvider instance

        Raises:
            ValueError: If service type or auth type is unknown
        """
        # Get service definition
        service_def = get_service_definition(service_type)

        # Get auth type from service definition
        auth_type = service_def["auth_type"]

        # Get provider class
        provider_class = cls._providers.get(auth_type)

        if not provider_class:
            raise ValueError(
                f"Unknown auth type '{auth_type}' for service '{service_type}'"
            )

        # Instantiate and return provider
        return provider_class(service_type, service_def)

    @classmethod
    def register_provider(
        cls, auth_type: str, provider_class: Type[AuthProvider]
    ) -> None:
        """
        Register a custom authentication provider.

        Args:
            auth_type: Authentication type identifier
            provider_class: AuthProvider subclass
        """
        cls._providers[auth_type] = provider_class

    @classmethod
    def list_auth_types(cls) -> list[str]:
        """List all registered authentication types."""
        return list(cls._providers.keys())

    @classmethod
    def supports_auth_type(cls, auth_type: str) -> bool:
        """Check if an auth type is supported."""
        return auth_type in cls._providers
