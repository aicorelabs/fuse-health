"""Integration API routes."""
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Query, status, Body
from pydantic import BaseModel

from ..controllers import integration_controller
from ..services.database import prisma_session

router = APIRouter(prefix="/integrations", tags=["integrations"])

# For now, use demo user ID (TODO: integrate with auth)
DEMO_USER_ID = "user_demo_001"


class CreateIntegrationRequest(BaseModel):
    """Request model for creating an integration."""
    connector_id: str
    display_name: str
    credentials: Dict[str, Any]


class UpdateIntegrationRequest(BaseModel):
    """Request model for updating an integration."""
    display_name: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


@router.get("")
async def list_integrations(
    connector_id: Optional[str] = Query(
        None, description="Filter by connector ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(
        None, description="Filter by status", alias="status"),
) -> List[Dict[str, Any]]:
    """
    List user's integrations.

    Query Parameters:
    - connector_id: Filter by connector (e.g., "gmail", "slack")
    - category: Filter by category (e.g., "communication", "ai")
    - status: Filter by status (e.g., "ACTIVE", "INACTIVE")
    """
    async with prisma_session() as db:
        return await integration_controller.list_integrations(
            db=db,
            user_id=DEMO_USER_ID,
            connector_id=connector_id,
            category=category,
            status_filter=status_filter,
        )


@router.get("/{integration_id}")
async def get_integration(integration_id: str) -> Dict[str, Any]:
    """
    Get a specific integration by ID.

    Returns integration details including:
    - Connector metadata
    - Configuration status
    - Last used timestamp
    - OAuth token expiration (if applicable)
    """
    async with prisma_session() as db:
        return await integration_controller.get_integration(
            db=db,
            user_id=DEMO_USER_ID,
            integration_id=integration_id,
        )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_integration(payload: CreateIntegrationRequest) -> Dict[str, Any]:
    """
    Create a new integration.

    Request Body:
    - connector_id: ID of the connector (e.g., "gmail", "slack")
    - display_name: User-friendly name (e.g., "My Work Gmail")
    - credentials: Connector-specific credentials

    Example:
    ```json
    {
      "connector_id": "gmail",
      "display_name": "My Gmail Account",
      "credentials": {
        "client_id": "...",
        "client_secret": "...",
        "refresh_token": "..."
      }
    }
    ```
    """
    async with prisma_session() as db:
        return await integration_controller.create_integration(
            db=db,
            user_id=DEMO_USER_ID,
            connector_id=payload.connector_id,
            display_name=payload.display_name,
            credentials=payload.credentials,
        )


@router.patch("/{integration_id}")
async def update_integration(
    integration_id: str,
    payload: UpdateIntegrationRequest,
) -> Dict[str, Any]:
    """
    Update an integration.

    Request Body (all fields optional):
    - display_name: New display name
    - credentials: Updated credentials
    - status: New status ("ACTIVE" or "INACTIVE")
    """
    async with prisma_session() as db:
        return await integration_controller.update_integration(
            db=db,
            user_id=DEMO_USER_ID,
            integration_id=integration_id,
            display_name=payload.display_name,
            credentials=payload.credentials,
            status_update=payload.status,
        )


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration(integration_id: str) -> None:
    """
    Delete an integration.

    Note: Cannot delete integrations that are currently used in workflows.
    Remove the integration from all workflows first.
    """
    async with prisma_session() as db:
        await integration_controller.delete_integration(
            db=db,
            user_id=DEMO_USER_ID,
            integration_id=integration_id,
        )


@router.post("/{integration_id}/test")
async def test_integration(integration_id: str) -> Dict[str, Any]:
    """
    Test an integration by executing a test action.

    This will:
    1. Verify credentials are valid
    2. Execute the connector's first action with test parameters
    3. Return success/failure result

    Useful for verifying OAuth tokens, API keys, etc.
    """
    async with prisma_session() as db:
        return await integration_controller.test_integration(
            db=db,
            user_id=DEMO_USER_ID,
            integration_id=integration_id,
        )


@router.post("/{integration_id}/refresh-token")
async def refresh_oauth_token(integration_id: str) -> Dict[str, Any]:
    """
    Refresh OAuth token for an integration.

    Only works for OAuth 2.0 integrations.
    Uses the refresh token to obtain a new access token.

    Returns updated integration with new token expiration.
    """
    async with prisma_session() as db:
        return await integration_controller.refresh_oauth_token(
            db=db,
            user_id=DEMO_USER_ID,
            integration_id=integration_id,
        )
