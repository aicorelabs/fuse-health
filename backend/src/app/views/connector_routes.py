"""Connector API routes - Browse available connectors."""
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Query

from ..controllers import connector_controller

router = APIRouter(prefix="/connectors", tags=["connectors"])


@router.get("")
async def list_connectors(
    category: Optional[str] = Query(None, description="Filter by category"),
) -> List[Dict[str, Any]]:
    """
    List all available connectors.

    Returns all connectors discovered by the ConnectorRegistry.

    Query Parameters:
    - category: Filter by category (e.g., "communication", "ai", "healthcare")

    Response includes:
    - Connector metadata (name, description, icon)
    - Authentication requirements
    - Action count
    - OAuth configuration (if applicable)
    """
    return await connector_controller.list_connectors(category=category)


@router.get("/categories")
async def get_connector_categories() -> List[Dict[str, Any]]:
    """
    Get list of all connector categories with counts.

    Returns:
    ```json
    [
      {"name": "communication", "connector_count": 3},
      {"name": "ai", "connector_count": 2},
      {"name": "healthcare", "connector_count": 4}
    ]
    ```
    """
    return await connector_controller.get_connector_categories()


@router.get("/{connector_id}")
async def get_connector(connector_id: str) -> Dict[str, Any]:
    """
    Get details of a specific connector.

    Returns complete connector metadata including:
    - Connector information
    - All available actions
    - Action parameters with types and descriptions
    - OAuth configuration

    Example:
    ```
    GET /api/connectors/gmail
    ```
    """
    return await connector_controller.get_connector(connector_id=connector_id)


@router.get("/{connector_id}/actions")
async def list_connector_actions(
    connector_id: str,
    category: Optional[str] = Query(
        None, description="Filter by action category"),
) -> List[Dict[str, Any]]:
    """
    List actions for a specific connector.

    Query Parameters:
    - category: Filter by action category (e.g., "query", "mutation")

    Returns list of actions with:
    - Action ID, name, description
    - Parameters with types and validation
    - Category (query vs mutation)

    Example:
    ```
    GET /api/connectors/gmail/actions
    GET /api/connectors/gmail/actions?category=mutation
    ```
    """
    return await connector_controller.list_connector_actions(
        connector_id=connector_id,
        category=category,
    )


@router.get("/{connector_id}/actions/{action_id}")
async def get_connector_action(
    connector_id: str,
    action_id: str,
) -> Dict[str, Any]:
    """
    Get details of a specific connector action.

    Returns:
    - Action metadata
    - Complete parameter schema
    - Required vs optional parameters
    - Parameter types and defaults

    Example:
    ```
    GET /api/connectors/gmail/actions/send_email
    ```
    """
    return await connector_controller.get_connector_action(
        connector_id=connector_id,
        action_id=action_id,
    )
