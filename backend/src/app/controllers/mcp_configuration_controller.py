"""Controllers for MCP server definitions and user-specific configurations."""
from __future__ import annotations

from typing import List

from ..models.mcp import (
    McpServerDefinitionCreate,
    McpServerDefinitionResponse,
    McpServerDefinitionUpdate,
    UserMcpConfigurationCreate,
    UserMcpConfigurationResponse,
    UserMcpConfigurationUpdate,
)
from ..services import mcp_configuration_service


async def list_server_definitions() -> List[McpServerDefinitionResponse]:
    return await mcp_configuration_service.list_server_definitions()


async def create_server_definition(payload: McpServerDefinitionCreate) -> McpServerDefinitionResponse:
    return await mcp_configuration_service.create_server_definition(payload)


async def update_server_definition(definition_id: str, payload: McpServerDefinitionUpdate) -> McpServerDefinitionResponse:
    return await mcp_configuration_service.update_server_definition(definition_id, payload)


async def delete_server_definition(definition_id: str) -> None:
    await mcp_configuration_service.delete_server_definition(definition_id)


async def list_user_configurations(user_id: str) -> List[UserMcpConfigurationResponse]:
    return await mcp_configuration_service.list_user_configurations(user_id)


async def create_user_configuration(payload: UserMcpConfigurationCreate) -> UserMcpConfigurationResponse:
    return await mcp_configuration_service.create_user_configuration(payload)


async def get_user_configuration(configuration_id: str, user_id: str | None = None) -> UserMcpConfigurationResponse:
    return await mcp_configuration_service.get_user_configuration(configuration_id, user_id)


async def update_user_configuration(configuration_id: str, payload: UserMcpConfigurationUpdate, user_id: str | None = None) -> UserMcpConfigurationResponse:
    return await mcp_configuration_service.update_user_configuration(configuration_id, payload, user_id)


async def delete_user_configuration(configuration_id: str, user_id: str | None = None) -> None:
    await mcp_configuration_service.delete_user_configuration(configuration_id, user_id)
