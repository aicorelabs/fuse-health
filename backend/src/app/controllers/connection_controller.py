"""Connection controller for API endpoints."""
from typing import List, Optional

from ..models.connection import (
    ConnectionCreate,
    ConnectionResponse,
    ConnectionStatus,
    ConnectionTestResult,
    ConnectionUpdate,
)
from ..services.connections import connection_service


async def list_user_connections(
    user_id: str,
    service_type: Optional[str] = None,
    status: Optional[ConnectionStatus] = None,
) -> List[ConnectionResponse]:
    """List connections for a user."""
    return await connection_service.list_connections(user_id, service_type, status)


async def get_user_connection(connection_id: str, user_id: str) -> ConnectionResponse:
    """Get a specific connection."""
    return await connection_service.get_connection(connection_id, user_id)


async def create_user_connection(payload: ConnectionCreate) -> ConnectionResponse:
    """Create a new connection."""
    return await connection_service.create_connection(payload)


async def update_user_connection(
    connection_id: str,
    payload: ConnectionUpdate,
    user_id: str,
) -> ConnectionResponse:
    """Update a connection."""
    return await connection_service.update_connection(connection_id, payload, user_id)


async def delete_user_connection(connection_id: str, user_id: str) -> None:
    """Delete a connection."""
    await connection_service.delete_connection(connection_id, user_id)


async def test_user_connection(connection_id: str, user_id: str) -> ConnectionTestResult:
    """Test a connection."""
    return await connection_service.test_connection(connection_id, user_id)
