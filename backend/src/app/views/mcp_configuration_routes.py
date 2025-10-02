"""API routes for managing MCP server definitions and user configurations."""
from __future__ import annotations

from fastapi import APIRouter, Response, status

from ..controllers import mcp_configuration_controller
from ..models.mcp import (
    McpServerDefinitionCreate,
    McpServerDefinitionResponse,
    McpServerDefinitionUpdate,
    UserMcpConfigurationCreate,
    UserMcpConfigurationResponse,
    UserMcpConfigurationUpdate,
)

router = APIRouter(prefix="/mcp", tags=["mcp"])


@router.get("/servers", response_model=list[McpServerDefinitionResponse])
async def list_server_definitions() -> list[McpServerDefinitionResponse]:
    return await mcp_configuration_controller.list_server_definitions()


@router.post(
    "/servers",
    response_model=McpServerDefinitionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_server_definition(payload: McpServerDefinitionCreate) -> McpServerDefinitionResponse:
    return await mcp_configuration_controller.create_server_definition(payload)


@router.patch("/servers/{definition_id}", response_model=McpServerDefinitionResponse)
async def update_server_definition(
    definition_id: str,
    payload: McpServerDefinitionUpdate,
) -> McpServerDefinitionResponse:
    return await mcp_configuration_controller.update_server_definition(definition_id, payload)


@router.delete("/servers/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_server_definition(definition_id: str) -> Response:
    await mcp_configuration_controller.delete_server_definition(definition_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/users/{user_id}/configurations",
    response_model=list[UserMcpConfigurationResponse],
)
async def list_user_configurations(user_id: str) -> list[UserMcpConfigurationResponse]:
    return await mcp_configuration_controller.list_user_configurations(user_id)


@router.post(
    "/users/{user_id}/configurations",
    response_model=UserMcpConfigurationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_user_configuration(
    user_id: str,
    payload: UserMcpConfigurationCreate,
) -> UserMcpConfigurationResponse:
    prepared = payload.model_copy(update={"user_id": user_id})
    return await mcp_configuration_controller.create_user_configuration(prepared)


@router.get(
    "/users/{user_id}/configurations/{configuration_id}",
    response_model=UserMcpConfigurationResponse,
)
async def get_user_configuration(
    user_id: str,
    configuration_id: str,
) -> UserMcpConfigurationResponse:
    return await mcp_configuration_controller.get_user_configuration(configuration_id, user_id)


@router.patch(
    "/users/{user_id}/configurations/{configuration_id}",
    response_model=UserMcpConfigurationResponse,
)
async def update_user_configuration(
    user_id: str,
    configuration_id: str,
    payload: UserMcpConfigurationUpdate,
) -> UserMcpConfigurationResponse:
    return await mcp_configuration_controller.update_user_configuration(configuration_id, payload, user_id)


@router.delete(
    "/users/{user_id}/configurations/{configuration_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_user_configuration(user_id: str, configuration_id: str) -> Response:
    await mcp_configuration_controller.delete_user_configuration(configuration_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
