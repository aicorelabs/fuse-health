"""Service definitions for all supported integrations.

Only services with corresponding workflow nodes should be included here
to maintain consistency between the connection system and workflow builder.
"""
from typing import Any, Dict

SERVICE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    # Communication Services (Action Nodes)
    "gmail": {
        "display_name": "Gmail",
        "description": "Send and receive emails via Gmail",
        "category": "communication",
        "auth_type": "oauth2",
        "auth_config": {
            "provider": "google",
            "scopes": [
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/gmail.readonly",
            ],
            "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_endpoint": "https://oauth2.googleapis.com/token",
            "requires": ["client_id", "client_secret"],
        },
        "test_endpoint": "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    },
    "slack": {
        "display_name": "Slack",
        "description": "Send messages and interact with Slack",
        "category": "communication",
        "auth_type": "oauth2",
        "auth_config": {
            "provider": "slack",
            "scopes": ["chat:write", "channels:read", "users:read"],
            "authorization_endpoint": "https://slack.com/oauth/v2/authorize",
            "token_endpoint": "https://slack.com/api/oauth.v2.access",
            "requires": ["client_id", "client_secret"],
        },
        "test_endpoint": "https://slack.com/api/auth.test",
    },

    # Data Services (Data Nodes)
    "google_sheets": {
        "display_name": "Google Sheets",
        "description": "Read and write data to Google Sheets",
        "category": "data",
        "auth_type": "oauth2",
        "auth_config": {
            "provider": "google",
            "scopes": [
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive.readonly",
            ],
            "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_endpoint": "https://oauth2.googleapis.com/token",
            "requires": ["client_id", "client_secret"],
        },
        "test_endpoint": "https://sheets.googleapis.com/v4/spreadsheets",
    },
    "http": {
        "display_name": "HTTP/REST API",
        "description": "Make HTTP requests to any REST API",
        "category": "data",
        "auth_type": "custom",
        "auth_config": {
            "requires": [],
        },
        "test_endpoint": None,
    },
    "database": {
        "display_name": "Database",
        "description": "Connect to SQL databases",
        "category": "data",
        "auth_type": "basic_auth",
        "auth_config": {
            "requires": ["username", "password", "host", "database"],
        },
        "test_endpoint": None,
    },

    # AI Services (AI Nodes)
    "openai": {
        "display_name": "OpenAI",
        "description": "Access GPT models and AI capabilities",
        "category": "ai",
        "auth_type": "api_key",
        "auth_config": {
            "header_name": "Authorization",
            "header_prefix": "Bearer",
            "requires": ["api_key"],
        },
        "test_endpoint": "https://api.openai.com/v1/models",
    },
    "anthropic": {
        "display_name": "Anthropic (Claude)",
        "description": "Access Claude AI models",
        "category": "ai",
        "auth_type": "api_key",
        "auth_config": {
            "header_name": "x-api-key",
            "header_prefix": None,
            "requires": ["api_key"],
            "additional_headers": {
                "anthropic-version": "2023-06-01",
            },
        },
        "test_endpoint": "https://api.anthropic.com/v1/messages",
    },
}


def get_service_definition(service_type: str) -> Dict[str, Any]:
    """Get service definition by type."""
    if service_type not in SERVICE_DEFINITIONS:
        raise ValueError(f"Unknown service type: {service_type}")
    return SERVICE_DEFINITIONS[service_type]


def list_service_types() -> list[str]:
    """List all available service types."""
    return list(SERVICE_DEFINITIONS.keys())


def list_services_by_category(category: str) -> list[Dict[str, Any]]:
    """List services by category."""
    return [
        {"service_type": key, **value}
        for key, value in SERVICE_DEFINITIONS.items()
        if value.get("category") == category
    ]
