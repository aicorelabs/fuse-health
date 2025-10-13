"""Integration controller - API handlers for connector integrations."""
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status

from prisma import Prisma
from ..services.integration_service import IntegrationService


async def list_integrations(
    db: Prisma,
    user_id: str,
    connector_id: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List all integrations for a user.

    Args:
        db: Database client
        user_id: User ID
        connector_id: Optional filter by connector ID
        category: Optional filter by category
        status_filter: Optional filter by status

    Returns:
        List of integrations
    """
    try:
        service = IntegrationService(db)
        return await service.list_integrations(
            user_id=user_id,
            connector_id=connector_id,
            category=category,
            status=status_filter,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list integrations: {str(e)}",
        )


async def get_integration(
    db: Prisma,
    user_id: str,
    integration_id: str,
) -> Dict[str, Any]:
    """
    Get a specific integration.

    Args:
        db: Database client
        user_id: User ID
        integration_id: Integration ID

    Returns:
        Integration details
    """
    try:
        service = IntegrationService(db)
        integration = await service.get_integration(integration_id, user_id)

        if not integration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Integration {integration_id} not found",
            )

        return integration
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get integration: {str(e)}",
        )


async def create_integration(
    db: Prisma,
    user_id: str,
    connector_id: str,
    display_name: str,
    credentials: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Create a new integration.

    Args:
        db: Database client
        user_id: User ID
        connector_id: Connector identifier
        display_name: User-friendly name
        credentials: Connector credentials

    Returns:
        Created integration
    """
    try:
        service = IntegrationService(db)
        return await service.create_integration(
            user_id=user_id,
            connector_id=connector_id,
            display_name=display_name,
            credentials=credentials,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create integration: {str(e)}",
        )


async def update_integration(
    db: Prisma,
    user_id: str,
    integration_id: str,
    display_name: Optional[str] = None,
    credentials: Optional[Dict[str, Any]] = None,
    status_update: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Update an integration.

    Args:
        db: Database client
        user_id: User ID
        integration_id: Integration ID
        display_name: New display name (optional)
        credentials: New credentials (optional)
        status_update: New status (optional)

    Returns:
        Updated integration
    """
    try:
        service = IntegrationService(db)
        return await service.update_integration(
            integration_id=integration_id,
            user_id=user_id,
            display_name=display_name,
            credentials=credentials,
            status=status_update,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update integration: {str(e)}",
        )


async def delete_integration(
    db: Prisma,
    user_id: str,
    integration_id: str,
) -> Dict[str, Any]:
    """
    Delete an integration.

    Args:
        db: Database client
        user_id: User ID
        integration_id: Integration ID

    Returns:
        Success message
    """
    try:
        service = IntegrationService(db)
        success = await service.delete_integration(integration_id, user_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Integration {integration_id} not found",
            )

        return {"message": "Integration deleted successfully"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete integration: {str(e)}",
        )


async def test_integration(
    db: Prisma,
    user_id: str,
    integration_id: str,
) -> Dict[str, Any]:
    """
    Test an integration by executing a test action.

    Args:
        db: Database client
        user_id: User ID
        integration_id: Integration ID

    Returns:
        Test result
    """
    try:
        service = IntegrationService(db)
        return await service.test_integration(integration_id, user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test integration: {str(e)}",
        )


async def refresh_oauth_token(
    db: Prisma,
    user_id: str,
    integration_id: str,
) -> Dict[str, Any]:
    """
    Refresh OAuth token for an integration.

    Args:
        db: Database client
        user_id: User ID
        integration_id: Integration ID

    Returns:
        Updated integration status
    """
    try:
        service = IntegrationService(db)
        return await service.refresh_oauth_token(integration_id, user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh OAuth token: {str(e)}",
        )
