"""Connection API routes."""
from typing import List, Optional

from fastapi import APIRouter, Query, status

from ..controllers import connection_controller
from ..models.connection import (
    ConnectionCreate,
    ConnectionResponse,
    ConnectionStatus,
    ConnectionTestResult,
    ConnectionUpdate,
)

router = APIRouter(prefix="/connections", tags=["connections"])

# For now, use demo user ID (TODO: integrate with auth)
DEMO_USER_ID = "user_demo_001"


@router.get("", response_model=List[ConnectionResponse])
async def list_connections(
    service_type: Optional[str] = Query(
        None, description="Filter by service type"),
    status: Optional[ConnectionStatus] = Query(
        None, description="Filter by status"),
) -> List[ConnectionResponse]:
    """List user's connections."""
    return await connection_controller.list_user_connections(
        user_id=DEMO_USER_ID,
        service_type=service_type,
        status=status,
    )


@router.get("/{connection_id}", response_model=ConnectionResponse)
async def get_connection(connection_id: str) -> ConnectionResponse:
    """Get a specific connection."""
    return await connection_controller.get_user_connection(
        connection_id=connection_id,
        user_id=DEMO_USER_ID,
    )


@router.post("", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(payload: ConnectionCreate) -> ConnectionResponse:
    """Create a new connection."""
    # Override user_id with demo user
    payload.user_id = DEMO_USER_ID
    return await connection_controller.create_user_connection(payload)


@router.patch("/{connection_id}", response_model=ConnectionResponse)
async def update_connection(
    connection_id: str,
    payload: ConnectionUpdate,
) -> ConnectionResponse:
    """Update a connection."""
    return await connection_controller.update_user_connection(
        connection_id=connection_id,
        payload=payload,
        user_id=DEMO_USER_ID,
    )


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(connection_id: str) -> None:
    """Delete a connection."""
    await connection_controller.delete_user_connection(
        connection_id=connection_id,
        user_id=DEMO_USER_ID,
    )


@router.post("/{connection_id}/test", response_model=ConnectionTestResult)
async def test_connection(connection_id: str) -> ConnectionTestResult:
    """Test if a connection is working."""
    return await connection_controller.test_user_connection(
        connection_id=connection_id,
        user_id=DEMO_USER_ID,
    )
