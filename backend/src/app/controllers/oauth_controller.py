"""OAuth flow controller for handling authorization and callbacks."""
import secrets
from typing import Dict, Optional
from datetime import datetime, timedelta

from ..services.connections.providers import AuthProviderRegistry, get_service_definition
from ..services.connections.connection_service import create_connection
from ..services.database import prisma_session


# In-memory store for OAuth states (in production, use Redis or database)
# Maps state -> {service_type, user_id, display_name, timestamp}
_oauth_states: Dict[str, Dict] = {}


def generate_oauth_state(
    service_type: str, user_id: str, display_name: str
) -> str:
    """Generate a secure random state parameter and store metadata."""
    state = secrets.token_urlsafe(32)

    _oauth_states[state] = {
        "service_type": service_type,
        "user_id": user_id,
        "display_name": display_name,
        "timestamp": datetime.utcnow(),
    }

    return state


def cleanup_expired_states() -> None:
    """Remove OAuth states older than 10 minutes."""
    now = datetime.utcnow()
    expired_states = [
        state
        for state, data in _oauth_states.items()
        if (now - data["timestamp"]) > timedelta(minutes=10)
    ]

    for state in expired_states:
        del _oauth_states[state]


async def initiate_oauth(
    service_type: str,
    user_id: str,
    display_name: str,
    redirect_uri: str,
) -> Dict:
    """
    Initiate OAuth flow for a service.

    Returns authorization URL and state parameter.
    """
    # Clean up old states
    cleanup_expired_states()

    # Get service definition
    service_def = get_service_definition(service_type)

    if service_def["auth_type"] != "oauth2":
        return {
            "error": f"Service {service_type} does not use OAuth 2.0",
            "auth_type": service_def["auth_type"],
        }

    # Generate state parameter
    state = generate_oauth_state(service_type, user_id, display_name)

    # Get OAuth provider
    registry = AuthProviderRegistry()
    provider = registry.get_provider(service_type, service_def)

    # Initiate OAuth flow
    result = await provider.initiate_auth(
        redirect_uri=redirect_uri,
        state=state,
    )

    if "error" in result:
        # Clean up state if there's an error
        _oauth_states.pop(state, None)
        return result

    return result


async def handle_oauth_callback(code: str, state: str, redirect_uri: str) -> Dict:
    """
    Handle OAuth callback after user authorization.

    Exchanges code for tokens and creates connection.
    """
    # Validate state
    state_data = _oauth_states.get(state)

    if not state_data:
        return {
            "success": False,
            "error": "Invalid or expired state parameter",
        }

    # Remove used state
    del _oauth_states[state]

    service_type = state_data["service_type"]
    user_id = state_data["user_id"]
    display_name = state_data["display_name"]

    try:
        # Get service definition
        service_def = get_service_definition(service_type)

        # Get OAuth provider
        registry = AuthProviderRegistry()
        provider = registry.get_provider(service_type, service_def)

        # Exchange code for tokens
        credentials = await provider.handle_callback(
            code=code,
            state=state,
            redirect_uri=redirect_uri,
        )

        # Test the credentials
        is_valid = await provider.test_credentials(credentials)

        if not is_valid:
            return {
                "success": False,
                "error": "Failed to validate credentials",
            }

        # Create connection
        async with prisma_session() as db:
            connection = await create_connection(
                db=db,
                user_id=user_id,
                service_type=service_type,
                display_name=display_name,
                auth_type="oauth2",
                credentials=credentials,
                auth_config=service_def.get("auth_config", {}),
                status="active",
            )

        return {
            "success": True,
            "connection_id": connection.id,
            "message": f"Successfully connected to {service_def['display_name']}",
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


async def get_oauth_status(state: Optional[str] = None) -> Dict:
    """
    Get status of OAuth states (for debugging).

    If state is provided, returns info about that specific state.
    Otherwise, returns count of active states.
    """
    cleanup_expired_states()

    if state:
        state_data = _oauth_states.get(state)
        if state_data:
            return {
                "valid": True,
                "service_type": state_data["service_type"],
                "user_id": state_data["user_id"],
                "age_seconds": (
                    datetime.utcnow() - state_data["timestamp"]
                ).total_seconds(),
            }
        else:
            return {"valid": False, "error": "State not found or expired"}

    return {
        "active_states": len(_oauth_states),
        "states": [
            {
                "state": state[:16] + "...",  # Truncate for security
                "service_type": data["service_type"],
                "age_seconds": (datetime.utcnow() - data["timestamp"]).total_seconds(),
            }
            for state, data in _oauth_states.items()
        ],
    }
