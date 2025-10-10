"""Workflow models for automation engine."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class WorkflowStatus(str, Enum):
    """Workflow status enum."""

    DRAFT = "draft"
    PUBLISHED = "published"
    PAUSED = "paused"
    ARCHIVED = "archived"


class WorkflowNodeData(BaseModel):
    """Data stored in a workflow node."""

    label: str
    subtitle: str
    accent: str
    icon: str
    chip_text: str = Field(alias="chipText")
    config: Dict[str, Any]
    config_fields: Optional[List[Dict[str, Any]]
                            ] = Field(None, alias="configFields")
    connectors: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    helper_text: Optional[str] = Field(None, alias="helperText")

    class Config:
        populate_by_name = True


class WorkflowNode(BaseModel):
    """A node in the workflow."""

    id: str
    type: str
    position: Dict[str, float]
    data: WorkflowNodeData


class WorkflowEdge(BaseModel):
    """An edge connecting two nodes."""

    id: str
    source: str
    target: str
    source_handle: Optional[str] = Field(None, alias="sourceHandle")
    target_handle: Optional[str] = Field(None, alias="targetHandle")
    type: Optional[str] = "smoothstep"

    class Config:
        populate_by_name = True


class WorkflowBase(BaseModel):
    """Base workflow fields."""

    name: str = Field(..., description="Workflow name")
    description: Optional[str] = Field(
        None, description="Workflow description")
    category: Optional[str] = Field(None, description="Workflow category")
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata")


class WorkflowCreate(WorkflowBase):
    """Create a new workflow."""

    user_id: str = Field(..., description="User ID who owns this workflow")
    nodes: List[WorkflowNode] = Field(default_factory=list)
    edges: List[WorkflowEdge] = Field(default_factory=list)
    status: WorkflowStatus = Field(default=WorkflowStatus.DRAFT)


class WorkflowUpdate(BaseModel):
    """Update workflow fields."""

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[WorkflowStatus] = None
    category: Optional[str] = None
    nodes: Optional[List[WorkflowNode]] = None
    edges: Optional[List[WorkflowEdge]] = None
    metadata: Optional[Dict[str, Any]] = None


class WorkflowResponse(WorkflowBase):
    """Workflow response model."""

    id: str
    user_id: str
    status: WorkflowStatus
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]

    class Config:
        from_attributes = True


class WorkflowExecuteRequest(BaseModel):
    """Request to execute a workflow."""

    workflow_id: str
    test_mode: bool = Field(
        default=False, description="Run in test mode (no actual actions)")
    context: Optional[Dict[str, Any]] = Field(
        None, description="Initial execution context")
