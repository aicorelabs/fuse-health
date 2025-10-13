"""Pydantic models for MCP server definitions and user configurations."""
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:]) if len(parts) > 1 else string


class ConfigFieldType(str, Enum):
    TEXT = "text"
    PASSWORD = "password"
    EMAIL = "email"
    URL = "url"
    NUMBER = "number"
    JSON = "json"


class ConfigField(BaseModel):
    key: str
    label: str
    type: ConfigFieldType = ConfigFieldType.TEXT
    required: bool = False
    description: Optional[str] = None
    default_value: Optional[str] = Field(default=None, alias="defaultValue")
    is_secret: bool = Field(default=False, alias="isSecret")
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True, alias_generator=_to_camel)


class McpServerDefinitionBase(BaseModel):
    slug: str
    display_name: str = Field(alias="displayName")
    description: Optional[str] = None
    category: Optional[str] = None
    is_managed: bool = Field(default=True, alias="isManaged")
    config_fields: List[ConfigField] = Field(default_factory=list, alias="configFields")

    model_config = ConfigDict(populate_by_name=True, alias_generator=_to_camel)


class McpServerDefinitionCreate(McpServerDefinitionBase):
    pass


class McpServerDefinitionUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, alias="displayName")
    description: Optional[str] = None
    category: Optional[str] = None
    is_managed: Optional[bool] = Field(default=None, alias="isManaged")
    config_fields: Optional[List[ConfigField]] = Field(default=None, alias="configFields")

    model_config = ConfigDict(populate_by_name=True, alias_generator=_to_camel)


class McpServerDefinitionResponse(McpServerDefinitionBase):
    id: str
    created_at: Optional[str] = Field(default=None, alias="createdAt")
    updated_at: Optional[str] = Field(default=None, alias="updatedAt")


class McpConfigurationStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    DRAFT = "draft"


class UserMcpConfigurationBase(BaseModel):
    server_id: str = Field(alias="serverId")
    display_name: str = Field(alias="displayName")
    status: McpConfigurationStatus = McpConfigurationStatus.DRAFT
    config_values: Dict[str, Any] = Field(default_factory=dict, alias="configValues")
    metadata: Optional[Dict[str, Any]] = None
    last_status_message: Optional[str] = Field(default=None, alias="lastStatusMessage")

    model_config = ConfigDict(populate_by_name=True, alias_generator=_to_camel)


class UserMcpConfigurationCreate(UserMcpConfigurationBase):
    user_id: Optional[str] = Field(default=None, alias="userId")


class UserMcpConfigurationUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, alias="displayName")
    status: Optional[McpConfigurationStatus] = None
    config_values: Optional[Dict[str, Any]] = Field(default=None, alias="configValues")
    metadata: Optional[Dict[str, Any]] = None
    last_status_message: Optional[str] = Field(default=None, alias="lastStatusMessage")

    model_config = ConfigDict(populate_by_name=True, alias_generator=_to_camel)


class UserMcpConfigurationResponse(UserMcpConfigurationBase):
    id: str
    user_id: str = Field(alias="userId")
    server: McpServerDefinitionResponse
    created_at: Optional[str] = Field(default=None, alias="createdAt")
    updated_at: Optional[str] = Field(default=None, alias="updatedAt")
    last_status_change: Optional[str] = Field(default=None, alias="lastStatusChange")
