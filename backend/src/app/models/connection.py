"""Connection models for OAuth and service integrations."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class ConnectionStatus(str, Enum):
    """Connection status enum."""

    ACTIVE = "active"
    EXPIRED = "expired"
    ERROR = "error"
    REVOKED = "revoked"


class AuthType(str, Enum):
    """Authentication type enum."""

    OAUTH2 = "oauth2"
    API_KEY = "api_key"
    BASIC_AUTH = "basic_auth"
    BEARER_TOKEN = "bearer_token"
    CLIENT_CREDENTIALS = "client_credentials"
    SSH_KEY = "ssh_key"
    CUSTOM = "custom"


class ConnectionBase(BaseModel):
    """Base connection fields."""

    service_type: str = Field(
        ..., description="Service type (gmail, google-sheets, etc.)"
    )
    display_name: str = Field(...,
                              description="Display name for this connection")
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata")


class ConnectionCreate(ConnectionBase):
    """Create a new connection."""

    user_id: str = Field(..., description="User ID who owns this connection")
    auth_type: AuthType = Field(..., description="Authentication method")
    auth_config: Optional[Dict[str, Any]] = Field(
        None, description="Auth-specific configuration"
    )
    credentials: Dict[str,
                      Any] = Field(..., description="Credentials to encrypt")
    status: ConnectionStatus = Field(default=ConnectionStatus.ACTIVE)


class ConnectionUpdate(BaseModel):
    """Update connection fields."""

    display_name: Optional[str] = None
    status: Optional[ConnectionStatus] = None
    auth_config: Optional[Dict[str, Any]] = None
    credentials: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    last_tested_at: Optional[datetime] = None


class ConnectionResponse(ConnectionBase):
    """Connection response model."""

    id: str
    user_id: str
    auth_type: AuthType
    auth_config: Optional[Dict[str, Any]]
    status: ConnectionStatus
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    last_tested_at: Optional[datetime]

    class Config:
        from_attributes = True


class ConnectionTestResult(BaseModel):
    """Result of testing a connection."""

    success: bool
    message: str
    tested_at: datetime


class OAuthInitiateRequest(BaseModel):
    """Request to initiate OAuth flow."""

    service_type: str = Field(...,
                              description="Service to connect (gmail, google-sheets)")
    display_name: str = Field(...,
                              description="Display name for this connection")
    redirect_uri: Optional[str] = Field(None, description="OAuth redirect URI")


class OAuthInitiateResponse(BaseModel):
    """Response with OAuth authorization URL."""

    authorization_url: str
    state: str


class OAuthCallbackRequest(BaseModel):
    """OAuth callback data."""

    code: str
    state: str
    service_type: str
