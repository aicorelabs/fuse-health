"""Connector controller - API handlers for browsing available connectors."""
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status

from prisma import Prisma

# Import connectors - use try/except for compatibility
try:
    from src.connectors import ConnectorRegistry
except ImportError:
    from ...connectors import ConnectorRegistry


# Global registry instance
_registry: Optional[ConnectorRegistry] = None


def get_connector_registry() -> ConnectorRegistry:
    """Get or create the global connector registry."""
    global _registry
    if _registry is None:
        _registry = ConnectorRegistry()
        _registry.discover_connectors()
    return _registry


async def list_connectors(
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List all available connectors.

    Args:
        category: Optional filter by category

    Returns:
        List of connector metadata
    """
    try:
        registry = get_connector_registry()

        all_connectors = registry.list_connectors()

        # Filter by category if specified
        if category:
            all_connectors = [
                c for c in all_connectors
                if c.category.lower() == category.lower()
            ]

        # Format response
        result = []
        for metadata in all_connectors:
            # Get connector instance to count actions
            connector = registry.get_connector(metadata.id)
            action_count = len(connector.get_actions()) if connector else 0

            result.append({
                "id": metadata.id,
                "name": metadata.name,
                "description": metadata.description,
                "category": metadata.category,
                "version": metadata.version,
                "icon": metadata.icon,
                "auth_type": metadata.auth_type,
                "requires_oauth": metadata.auth_type == "oauth2",
                "action_count": action_count,
                "oauth_config": {
                    "authorize_url": metadata.oauth_config.get("authorize_url"),
                    "scopes": metadata.oauth_config.get("scopes", []),
                } if metadata.oauth_config else None,
            })

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list connectors: {str(e)}",
        )


async def get_connector(
    connector_id: str,
) -> Dict[str, Any]:
    """
    Get details of a specific connector.

    Args:
        connector_id: Connector identifier

    Returns:
        Connector metadata with actions
    """
    try:
        registry = get_connector_registry()

        if not registry.is_registered(connector_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connector '{connector_id}' not found",
            )

        metadata = registry.get_metadata(connector_id)

        # Get connector instance to retrieve actions
        connector = registry.get_connector(connector_id)
        actions = connector.get_actions() if connector else []

        return {
            "id": metadata.id,
            "name": metadata.name,
            "description": metadata.description,
            "category": metadata.category,
            "version": metadata.version,
            "icon": metadata.icon,
            "auth_type": metadata.auth_type,
            "requires_oauth": metadata.auth_type == "oauth2",
            "oauth_config": metadata.oauth_config,
            "actions": [
                {
                    "id": action.id,
                    "name": action.name,
                    "description": action.description,
                    "category": action.category,
                    "parameters": [
                        {
                            "name": param.name,
                            "type": param.type,
                            "description": param.description,
                            "required": param.required,
                            "default": param.default,
                        }
                        for param in action.params
                    ],
                }
                for action in actions
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connector: {str(e)}",
        )


async def list_connector_actions(
    connector_id: str,
    category: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List actions for a specific connector.

    Args:
        connector_id: Connector identifier
        category: Optional filter by action category

    Returns:
        List of connector actions
    """
    try:
        registry = get_connector_registry()

        if not registry.is_registered(connector_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connector '{connector_id}' not found",
            )

        connector = registry.get_connector(connector_id)
        actions = connector.get_actions()

        # Filter by category if specified
        if category:
            actions = [a for a in actions if a.category.lower() ==
                       category.lower()]

        return [
            {
                "id": action.id,
                "name": action.name,
                "description": action.description,
                "category": action.category,
                "parameters": [
                    {
                        "name": param.name,
                        "type": param.type,
                        "description": param.description,
                        "required": param.required,
                        "default": param.default,
                    }
                    for param in action.params
                ],
            }
            for action in actions
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list connector actions: {str(e)}",
        )


async def get_connector_action(
    connector_id: str,
    action_id: str,
) -> Dict[str, Any]:
    """
    Get details of a specific connector action.

    Args:
        connector_id: Connector identifier
        action_id: Action identifier

    Returns:
        Action details
    """
    try:
        registry = get_connector_registry()

        if not registry.is_registered(connector_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Connector '{connector_id}' not found",
            )

        connector = registry.get_connector(connector_id)
        actions = connector.get_actions()

        action = next((a for a in actions if a.id == action_id), None)

        if not action:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Action '{action_id}' not found in connector '{connector_id}'",
            )

        return {
            "id": action.id,
            "name": action.name,
            "description": action.description,
            "category": action.category,
            "parameters": [
                {
                    "name": param.name,
                    "type": param.type,
                    "description": param.description,
                    "required": param.required,
                    "default": param.default,
                }
                for param in action.params
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connector action: {str(e)}",
        )


async def get_connector_categories() -> List[Dict[str, Any]]:
    """
    Get list of all connector categories with counts.

    Returns:
        List of categories
    """
    try:
        registry = get_connector_registry()
        connectors = registry.list_connectors()

        # Count connectors by category
        categories: Dict[str, int] = {}
        for connector in connectors:
            cat = connector.category
            categories[cat] = categories.get(cat, 0) + 1

        return [
            {
                "name": category,
                "connector_count": count,
            }
            for category, count in sorted(categories.items())
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get connector categories: {str(e)}",
        )
