"""Service discovery controller."""
from typing import Any, Dict, List, Optional

from ..services.connections.providers import (
    SERVICE_DEFINITIONS,
    AuthProviderRegistry,
    get_service_definition,
)


async def list_available_services(
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List all available services that can be connected."""
    services = []

    for service_type, definition in SERVICE_DEFINITIONS.items():
        # Filter by category if provided
        if category and definition.get("category") != category:
            continue

        services.append({
            "service_type": service_type,
            "display_name": definition["display_name"],
            "description": definition["description"],
            "category": definition.get("category"),
            "auth_type": definition["auth_type"],
            "requires_setup": _check_requires_setup(service_type, definition),
        })

    return services


async def get_service_info(service_type: str) -> Dict[str, Any]:
    """Get detailed information about a service."""
    definition = get_service_definition(service_type)

    return {
        "service_type": service_type,
        "display_name": definition["display_name"],
        "description": definition["description"],
        "category": definition.get("category"),
        "auth_type": definition["auth_type"],
        "auth_config": definition.get("auth_config", {}),
        "requires_setup": _check_requires_setup(service_type, definition),
        "test_endpoint": definition.get("test_endpoint"),
    }


def _check_requires_setup(service_type: str, definition: Dict[str, Any]) -> bool:
    """Check if service requires environment setup (OAuth credentials, etc.)."""
    import os

    auth_type = definition["auth_type"]

    if auth_type == "oauth2":
        # Check if OAuth client credentials are configured
        env_prefix = service_type.upper().replace("-", "_")
        client_id = os.getenv(f"{env_prefix}_CLIENT_ID")
        client_secret = os.getenv(f"{env_prefix}_CLIENT_SECRET")
        return not (client_id and client_secret)

    # API keys and other auth types don't require server-side setup
    return False
