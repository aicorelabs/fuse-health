"""Service layer for MCP server definitions and per-user configurations."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status

from ..models.mcp import (
    ConfigField,
    McpConfigurationStatus,
    McpServerDefinitionCreate,
    McpServerDefinitionResponse,
    McpServerDefinitionUpdate,
    UserMcpConfigurationCreate,
    UserMcpConfigurationResponse,
    UserMcpConfigurationUpdate,
)
from . import database

DEMO_USER = {
    "id": "demo-user",
    "email": "demo@fuse.health",
    "name": "Demo User",
}

DEFAULT_SERVER_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "slug": "pubmed",
        "displayName": "PubMed Research",
        "description": "Access medical literature and research papers",
        "category": "research",
        "configFields": [
            {"key": "api_key", "label": "API Key", "type": "password", "required": True, "isSecret": True},
            {"key": "max_results", "label": "Max Results", "type": "number", "required": False, "defaultValue": "10"},
            {"key": "language", "label": "Language", "type": "text", "required": False, "defaultValue": "en"},
        ],
    },
    {
        "slug": "gmail",
        "displayName": "Gmail MCP",
        "description": "Send and manage emails through Gmail",
        "category": "communication",
        "configFields": [
            {"key": "client_id", "label": "Client ID", "type": "text", "required": True},
            {"key": "client_secret", "label": "Client Secret", "type": "password", "required": True, "isSecret": True},
            {"key": "refresh_token", "label": "Refresh Token", "type": "password", "required": True, "isSecret": True},
            {"key": "sender_email", "label": "Sender Email", "type": "email", "required": True},
        ],
    },
    {
        "slug": "epic",
        "displayName": "Epic EHR",
        "description": "Connect to Epic Electronic Health Records",
        "category": "clinical",
        "configFields": [
            {"key": "fhir_endpoint", "label": "FHIR Endpoint URL", "type": "url", "required": True},
            {"key": "client_id", "label": "Client ID", "type": "text", "required": True},
            {"key": "client_secret", "label": "Client Secret", "type": "password", "required": True, "isSecret": True},
            {"key": "tenant_id", "label": "Tenant ID", "type": "text", "required": False},
        ],
    },
]


def _serialize_datetime(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if isinstance(value, datetime) else None


def _serialize_fields(raw_fields: Any) -> List[ConfigField]:
    fields: List[ConfigField] = []
    if isinstance(raw_fields, list):
        for entry in raw_fields:
            try:
                fields.append(ConfigField.model_validate(entry))
            except Exception as exc:  # noqa: BLE001
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Invalid configuration field definition: {entry!r}",
                ) from exc
    return fields


def _serialize_definition(record: Any) -> McpServerDefinitionResponse:
    return McpServerDefinitionResponse(
        id=record.id,
        slug=record.slug,
        display_name=record.displayName,
        description=record.description,
        category=record.category,
        is_managed=record.isManaged,
        config_fields=_serialize_fields(record.configSchema or []),
        created_at=_serialize_datetime(getattr(record, "createdAt", None)),
        updated_at=_serialize_datetime(getattr(record, "updatedAt", None)),
    )


def _serialize_status(value: Optional[str]) -> McpConfigurationStatus:
    if not value:
        return McpConfigurationStatus.DRAFT
    try:
        return McpConfigurationStatus(value.lower())
    except ValueError:
        return McpConfigurationStatus.DRAFT


def _serialize_user_configuration(record: Any) -> UserMcpConfigurationResponse:
    server_record = getattr(record, "server", None)
    if server_record is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Missing server relation")

    return UserMcpConfigurationResponse(
        id=record.id,
        user_id=record.userId,
        server_id=record.serverId,
        server=_serialize_definition(server_record),
        display_name=record.displayName,
        status=_serialize_status(record.status),
        config_values=record.configValues or {},
        metadata=record.metadata or None,
        last_status_message=getattr(record, "lastStatusMessage", None),
        created_at=_serialize_datetime(getattr(record, "createdAt", None)),
        updated_at=_serialize_datetime(getattr(record, "updatedAt", None)),
        last_status_change=_serialize_datetime(getattr(record, "lastStatusChange", None)),
    )


async def ensure_default_server_definitions() -> None:
    client = await database.connect()
    for definition in DEFAULT_SERVER_DEFINITIONS:
        await client.mcpserverdefinition.upsert(
            where={"slug": definition["slug"]},
            data={
                "create": {
                    "slug": definition["slug"],
                    "displayName": definition["displayName"],
                    "description": definition.get("description"),
                    "category": definition.get("category"),
                    "configSchema": definition.get("configFields", []),
                    "isManaged": True,
                },
                "update": {
                    "displayName": definition["displayName"],
                    "description": definition.get("description"),
                    "category": definition.get("category"),
                    "configSchema": definition.get("configFields", []),
                },
            },
        )


async def ensure_demo_user() -> None:
    client = await database.connect()
    await client.user.upsert(
        where={"id": DEMO_USER["id"]},
        data={
            "create": {
                "id": DEMO_USER["id"],
                "email": DEMO_USER["email"],
                "name": DEMO_USER["name"],
            },
            "update": {
                "email": DEMO_USER["email"],
                "name": DEMO_USER["name"],
            },
        },
    )


async def initialize_seed_data() -> None:
    await ensure_demo_user()
    await ensure_default_server_definitions()


async def list_server_definitions() -> List[McpServerDefinitionResponse]:
    client = await database.connect()
    records = await client.mcpserverdefinition.find_many(order={"displayName": "asc"})
    return [_serialize_definition(record) for record in records]


async def create_server_definition(payload: McpServerDefinitionCreate) -> McpServerDefinitionResponse:
    client = await database.connect()
    try:
        record = await client.mcpserverdefinition.create(
            data={
                "slug": payload.slug,
                "displayName": payload.display_name,
                "description": payload.description,
                "category": payload.category,
                "isManaged": payload.is_managed,
                "configSchema": [field.model_dump(by_alias=True) for field in payload.config_fields],
            }
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _serialize_definition(record)


async def update_server_definition(definition_id: str, payload: McpServerDefinitionUpdate) -> McpServerDefinitionResponse:
    client = await database.connect()
    data: Dict[str, Any] = {}
    if payload.display_name is not None:
        data["displayName"] = payload.display_name
    if payload.description is not None:
        data["description"] = payload.description
    if payload.category is not None:
        data["category"] = payload.category
    if payload.is_managed is not None:
        data["isManaged"] = payload.is_managed
    if payload.config_fields is not None:
        data["configSchema"] = [field.model_dump(by_alias=True) for field in payload.config_fields]

    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update")

    try:
        record = await client.mcpserverdefinition.update(
            where={"id": definition_id},
            data=data,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server definition not found") from exc

    return _serialize_definition(record)


async def delete_server_definition(definition_id: str) -> None:
    client = await database.connect()
    try:
        await client.mcpserverdefinition.delete(where={"id": definition_id})
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server definition not found") from exc


def _status_to_db(status_value: Optional[McpConfigurationStatus]) -> Optional[str]:
    if not status_value:
        return None
    return status_value.name


async def list_user_configurations(user_id: str) -> List[UserMcpConfigurationResponse]:
    client = await database.connect()
    records = await client.usermcpconfiguration.find_many(
        where={"userId": user_id},
        include={"server": True},
        order={"updatedAt": "desc"},
    )
    return [_serialize_user_configuration(record) for record in records]


async def create_user_configuration(payload: UserMcpConfigurationCreate) -> UserMcpConfigurationResponse:
    client = await database.connect()
    if not payload.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required")
    try:
        record = await client.usermcpconfiguration.create(
            data={
                "userId": payload.user_id,
                "serverId": payload.server_id,
                "displayName": payload.display_name,
                "status": _status_to_db(payload.status) or McpConfigurationStatus.DRAFT.name,
                "configValues": payload.config_values,
                "metadata": payload.metadata,
                "lastStatusMessage": payload.last_status_message,
            },
            include={"server": True},
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _serialize_user_configuration(record)


async def get_user_configuration(configuration_id: str, user_id: Optional[str] = None) -> UserMcpConfigurationResponse:
    client = await database.connect()
    record = await client.usermcpconfiguration.find_unique(
        where={"id": configuration_id},
        include={"server": True},
    )
    if record is None or (user_id and record.userId != user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuration not found")
    return _serialize_user_configuration(record)


async def update_user_configuration(configuration_id: str, payload: UserMcpConfigurationUpdate, user_id: Optional[str] = None) -> UserMcpConfigurationResponse:
    client = await database.connect()
    data: Dict[str, Any] = {}
    if payload.display_name is not None:
        data["displayName"] = payload.display_name
    if payload.status is not None:
        data["status"] = _status_to_db(payload.status)
        data["lastStatusChange"] = datetime.utcnow()
    if payload.config_values is not None:
        data["configValues"] = payload.config_values
    if payload.metadata is not None:
        data["metadata"] = payload.metadata
    if payload.last_status_message is not None:
        data["lastStatusMessage"] = payload.last_status_message

    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided for update")

    try:
        record = await client.usermcpconfiguration.update(
            where={"id": configuration_id},
            data=data,
            include={"server": True},
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuration not found") from exc

    if user_id and record.userId != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Configuration does not belong to user")

    return _serialize_user_configuration(record)


async def delete_user_configuration(configuration_id: str, user_id: Optional[str] = None) -> None:
    client = await database.connect()
    record = await client.usermcpconfiguration.find_unique(where={"id": configuration_id})
    if record is None or (user_id and record.userId != user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuration not found")

    await client.usermcpconfiguration.delete(where={"id": configuration_id})
