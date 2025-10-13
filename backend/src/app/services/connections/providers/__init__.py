"""Authentication providers for different services."""
from .api_key_provider import APIKeyProvider
from .base_provider import AuthProvider
from .basic_auth_provider import BasicAuthProvider
from .oauth2_provider import OAuth2Provider
from .registry import AuthProviderRegistry
from .service_definitions import SERVICE_DEFINITIONS, get_service_definition

__all__ = [
    "AuthProvider",
    "OAuth2Provider",
    "APIKeyProvider",
    "BasicAuthProvider",
    "AuthProviderRegistry",
    "SERVICE_DEFINITIONS",
    "get_service_definition",
]
