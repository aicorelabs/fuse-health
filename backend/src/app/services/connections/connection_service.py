"""Connection service for managing OAuth connections."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from prisma import fields

from ...models.connection import (
    AuthType,
    ConnectionCreate,
    ConnectionResponse,
    ConnectionStatus,
    ConnectionTestResult,
    ConnectionUpdate,
)
from ..database import connect
from .encryption_service import decrypt_credentials, encrypt_credentials
from .providers import AuthProviderRegistry, get_service_definition


def _serialize_datetime(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if isinstance(value, datetime) else None


def _serialize_status(value: Optional[str]) -> ConnectionStatus:
    if not value:
        return ConnectionStatus.ACTIVE
    try:
        return ConnectionStatus(value.lower())
    except ValueError:
        return ConnectionStatus.ERROR


def _serialize_auth_type(value: Optional[str]) -> AuthType:
    if not value:
        return AuthType.OAUTH2
    try:
        return AuthType(value.lower())
    except ValueError:
        return AuthType.CUSTOM


def _serialize_connection(record: Any) -> ConnectionResponse:
    """Convert database record to response model."""
    return ConnectionResponse(
        id=record.id,
        user_id=record.userId,
        service_type=record.serviceType,
        display_name=record.displayName,
        auth_type=_serialize_auth_type(record.authType),
        auth_config=record.authConfig or {},
        status=_serialize_status(record.status),
        metadata=record.metadata or {},
        created_at=record.createdAt,
        updated_at=record.updatedAt,
        last_tested_at=record.lastTestedAt,
    )


async def list_connections(
    user_id: str,
    service_type: Optional[str] = None,
    status: Optional[ConnectionStatus] = None,
) -> List[ConnectionResponse]:
    """List user's connections."""
    client = await connect()

    where: Dict[str, Any] = {"userId": user_id}
    if service_type:
        where["serviceType"] = service_type
    if status:
        where["status"] = status.name

    records = await client.connection.find_many(
        where=where,
        order={"updatedAt": "desc"},
    )

    return [_serialize_connection(record) for record in records]


async def get_connection(connection_id: str, user_id: Optional[str] = None) -> ConnectionResponse:
    """Get a specific connection."""
    client = await connect()

    record = await client.connection.find_unique(where={"id": connection_id})

    if record is None or (user_id and record.userId != user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found",
        )

    return _serialize_connection(record)


async def create_connection(payload: ConnectionCreate) -> ConnectionResponse:
    """Create a new connection."""
    client = await connect()

    # Encrypt credentials
    encrypted_creds = encrypt_credentials(payload.credentials)

    try:
        record = await client.connection.create(
            data={
                "userId": payload.user_id,
                "serviceType": payload.service_type,
                "displayName": payload.display_name,
                "authType": payload.auth_type.name,
                "authConfig": fields.Json(payload.auth_config) if payload.auth_config else None,
                "status": payload.status.name,
                "credentials": encrypted_creds,
                "metadata": fields.Json(payload.metadata) if payload.metadata else None,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create connection: {str(exc)}",
        ) from exc

    return _serialize_connection(record)


async def update_connection(
    connection_id: str,
    payload: ConnectionUpdate,
    user_id: Optional[str] = None,
) -> ConnectionResponse:
    """Update a connection."""
    client = await connect()

    # Verify ownership
    record = await client.connection.find_unique(where={"id": connection_id})
    if record is None or (user_id and record.userId != user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found",
        )

    data: Dict[str, Any] = {}

    if payload.display_name is not None:
        data["displayName"] = payload.display_name

    if payload.status is not None:
        data["status"] = payload.status.name

    if payload.auth_config is not None:
        data["authConfig"] = fields.Json(payload.auth_config)

    if payload.credentials is not None:
        data["credentials"] = encrypt_credentials(payload.credentials)

    if payload.metadata is not None:
        data["metadata"] = fields.Json(payload.metadata)

    if payload.last_tested_at is not None:
        data["lastTestedAt"] = payload.last_tested_at

    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update",
        )

    try:
        updated_record = await client.connection.update(
            where={"id": connection_id},
            data=data,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update connection: {str(exc)}",
        ) from exc

    return _serialize_connection(updated_record)


async def delete_connection(connection_id: str, user_id: Optional[str] = None) -> None:
    """Delete a connection."""
    client = await connect()

    # Verify ownership
    record = await client.connection.find_unique(where={"id": connection_id})
    if record is None or (user_id and record.userId != user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found",
        )

    await client.connection.delete(where={"id": connection_id})


async def test_connection(connection_id: str, user_id: Optional[str] = None) -> ConnectionTestResult:
    """Test if a connection is working."""
    client = await connect()

    # Get connection
    record = await client.connection.find_unique(where={"id": connection_id})
    if record is None or (user_id and record.userId != user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found",
        )

    try:
        # Decrypt credentials
        credentials = decrypt_credentials(record.credentials)

        # Get the auth provider for this service
        provider = AuthProviderRegistry.get_provider(record.serviceType)

        # Test credentials using the provider
        is_valid = await provider.test_credentials(credentials)

        if is_valid:
            # Update last tested timestamp
            await client.connection.update(
                where={"id": connection_id},
                data={
                    "lastTestedAt": datetime.utcnow(),
                    "status": ConnectionStatus.ACTIVE.name,
                },
            )

            return ConnectionTestResult(
                success=True,
                message="Connection test successful",
                tested_at=datetime.utcnow(),
            )
        else:
            # Update status to error
            await client.connection.update(
                where={"id": connection_id},
                data={"status": ConnectionStatus.ERROR.name},
            )

            return ConnectionTestResult(
                success=False,
                message="Connection test failed - invalid credentials",
                tested_at=datetime.utcnow(),
            )

    except Exception as exc:
        # Update status to error
        await client.connection.update(
            where={"id": connection_id},
            data={"status": ConnectionStatus.ERROR.name},
        )

        return ConnectionTestResult(
            success=False,
            message=f"Connection test failed: {str(exc)}",
            tested_at=datetime.utcnow(),
        )


async def get_connection_credentials(connection_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Get decrypted credentials for a connection (internal use only)."""
    client = await connect()

    record = await client.connection.find_unique(where={"id": connection_id})
    if record is None or (user_id and record.userId != user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found",
        )

    if record.status != ConnectionStatus.ACTIVE.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Connection is {record.status}",
        )

    return decrypt_credentials(record.credentials)
