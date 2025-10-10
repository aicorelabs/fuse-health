"""Workflow execution models."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ExecutionStatus(str, Enum):
    """Execution status enum."""

    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    CANCELLED = "cancelled"
    PARTIAL = "partial"


class NodeExecutionLog(BaseModel):
    """Log entry for a node execution."""

    node_id: str
    node_label: str
    status: str  # "executing", "complete", "error"
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ExecutionResponse(BaseModel):
    """Workflow execution response."""

    id: str
    workflow_id: str
    status: ExecutionStatus
    started_at: datetime
    completed_at: Optional[datetime]
    error: Optional[str]
    logs: Optional[List[NodeExecutionLog]]
    node_results: Optional[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class ExecutionListResponse(BaseModel):
    """List of executions."""

    executions: List[ExecutionResponse]
    total: int
