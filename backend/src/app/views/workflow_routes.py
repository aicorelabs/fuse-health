"""Workflow API routes."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..controllers import workflow_controller
from ..models.workflow_builder import (
    CreateWorkflowBuilderRequest,
    create_email_workflow,
)


router = APIRouter(prefix="/workflows", tags=["workflows"])


# ============= Node Type Definitions =============


@router.get("/node-types")
async def get_node_types():
    """Get available node types and their configurations."""
    node_types = {
        "trigger": [
            {
                "id": "manual-trigger",
                "label": "Manual Trigger",
                "description": "Start workflow manually",
                "category": "trigger",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                ]
            },
            {
                "id": "schedule-trigger",
                "label": "Schedule Trigger",
                "description": "Run workflow on a schedule",
                "category": "trigger",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "cadence", "label": "Cadence",
                        "type": "text", "placeholder": "Daily"},
                    {"id": "time", "label": "Time",
                        "type": "text", "placeholder": "09:00 AM"},
                ]
            },
            {
                "id": "webhook-trigger",
                "label": "Webhook Trigger",
                "description": "Trigger via HTTP webhook",
                "category": "trigger",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "path", "label": "Webhook Path", "type": "text",
                        "placeholder": "/webhook/my-workflow"},
                ]
            },
            {
                "id": "event-trigger",
                "label": "Event Trigger",
                "description": "Start on EHR data event",
                "category": "trigger",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "event", "label": "Event Type", "type": "text",
                        "required": True, "placeholder": "Observation.create"},
                    {"id": "facility", "label": "Facility", "type": "text"},
                ]
            },
        ],
        "action": [
            {
                "id": "gmail-action",
                "label": "Gmail",
                "description": "Send email via Gmail",
                "category": "action",
                "service_type": "gmail",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "to", "label": "To", "type": "email", "required": True},
                    {"id": "subject", "label": "Subject",
                        "type": "text", "required": True},
                    {"id": "body", "label": "Body",
                        "type": "textarea", "required": True},
                ]
            },
            {
                "id": "slack-action",
                "label": "Slack",
                "description": "Send message to Slack",
                "category": "action",
                "service_type": "slack",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "channel", "label": "Channel", "type": "text",
                        "required": True, "placeholder": "#general"},
                    {"id": "message", "label": "Message",
                        "type": "textarea", "required": True},
                ]
            },
            {
                "id": "http-action",
                "label": "HTTP Request",
                "description": "Make HTTP API call",
                "category": "action",
                "service_type": "http",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "method", "label": "Method",
                        "type": "text", "placeholder": "GET"},
                    {"id": "url", "label": "URL", "type": "text", "required": True},
                    {"id": "headers",
                        "label": "Headers (JSON)", "type": "textarea"},
                    {"id": "body", "label": "Body (JSON)", "type": "textarea"},
                ]
            },
        ],
        "data": [
            {
                "id": "google-sheets",
                "label": "Google Sheets",
                "description": "Read/write spreadsheet data",
                "category": "data",
                "service_type": "google_sheets",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "operation", "label": "Operation",
                        "type": "text", "placeholder": "read"},
                    {"id": "spreadsheet_id", "label": "Spreadsheet ID",
                        "type": "text", "required": True},
                    {"id": "range", "label": "Range", "type": "text",
                        "placeholder": "Sheet1!A1:Z"},
                ]
            },
            {
                "id": "database-query",
                "label": "Database Query",
                "description": "Query database",
                "category": "data",
                "service_type": "database",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "query", "label": "SQL Query",
                        "type": "textarea", "required": True},
                ]
            },
        ],
        "logic": [
            {
                "id": "condition",
                "label": "Condition",
                "description": "Branch based on condition",
                "category": "logic",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "condition", "label": "Condition", "type": "text",
                        "required": True, "placeholder": "${value} > 100"},
                ]
            },
            {
                "id": "transform",
                "label": "Transform Data",
                "description": "Transform or map data",
                "category": "logic",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "transform_type", "label": "Type",
                        "type": "text", "placeholder": "map"},
                    {"id": "mapping",
                        "label": "Mapping (JSON)", "type": "textarea"},
                ]
            },
            {
                "id": "loop",
                "label": "Loop",
                "description": "Iterate over items",
                "category": "logic",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "loop_type", "label": "Loop Type",
                        "type": "text", "placeholder": "foreach"},
                    {"id": "items", "label": "Items Variable", "type": "text",
                        "required": True, "placeholder": "${rows}"},
                ]
            },
            {
                "id": "delay",
                "label": "Delay",
                "description": "Wait for specified time",
                "category": "logic",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "delay_seconds",
                        "label": "Delay (seconds)", "type": "number", "required": True},
                ]
            },
        ],
        "ai": [
            {
                "id": "openai-chat",
                "label": "OpenAI Chat",
                "description": "Generate text with ChatGPT",
                "category": "ai",
                "service_type": "openai",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "model", "label": "Model",
                        "type": "text", "placeholder": "gpt-4"},
                    {"id": "prompt", "label": "Prompt",
                        "type": "textarea", "required": True},
                    {"id": "system_prompt", "label": "System Prompt",
                        "type": "textarea"},
                    {"id": "temperature", "label": "Temperature",
                        "type": "number", "placeholder": "0.7"},
                    {"id": "max_tokens", "label": "Max Tokens",
                        "type": "number", "placeholder": "500"},
                ]
            },
            {
                "id": "anthropic-chat",
                "label": "Anthropic Claude",
                "description": "Generate text with Claude",
                "category": "ai",
                "service_type": "anthropic",
                "fields": [
                    {"id": "label", "label": "Label",
                        "type": "text", "required": True},
                    {"id": "model", "label": "Model", "type": "text",
                        "placeholder": "claude-3-5-sonnet"},
                    {"id": "prompt", "label": "Prompt",
                        "type": "textarea", "required": True},
                    {"id": "system_prompt", "label": "System Prompt",
                        "type": "textarea"},
                    {"id": "temperature", "label": "Temperature",
                        "type": "number", "placeholder": "0.7"},
                    {"id": "max_tokens", "label": "Max Tokens",
                        "type": "number", "placeholder": "500"},
                ]
            },
        ],
    }

    return node_types


# ============= Request/Response Models =============


class CreateWorkflowRequest(BaseModel):
    """Request to create a workflow."""

    user_id: str
    name: str
    description: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    category: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UpdateWorkflowRequest(BaseModel):
    """Request to update a workflow."""

    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    category: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ExecuteWorkflowRequest(BaseModel):
    """Request to execute a workflow."""

    trigger_data: Optional[Dict[str, Any]] = None


# ============= Workflow CRUD =============


@router.post("/quick/email", status_code=201)
async def create_email_workflow_quick(
    user_id: str = Query(..., description="User ID"),
    name: str = Query(..., description="Workflow name"),
    recipient: str = Query(..., description="Email recipient"),
    subject: str = Query(..., description="Email subject"),
    body: str = Query(..., description="Email body"),
    connection_id: Optional[str] = Query(
        None, description="Gmail connection ID"),
):
    """
    Quick helper to create a simple email workflow.

    This is the simplest way to create a workflow - just provide
    the recipient, subject, and body.
    """
    try:
        # Use the helper function
        builder_request = create_email_workflow(
            user_id=user_id,
            name=name,
            recipient=recipient,
            subject=subject,
            body=body,
            connection_id=connection_id,
        )

        # Convert to raw workflow format
        workflow_data = builder_request.to_create_workflow_request()

        return await workflow_controller.create_workflow_handler(
            user_id=workflow_data["user_id"],
            name=workflow_data["name"],
            description=workflow_data["description"],
            nodes=workflow_data["nodes"],
            edges=workflow_data["edges"],
            category=workflow_data["category"],
            metadata=workflow_data["metadata"],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/builder", status_code=201)
async def create_workflow_with_builder(request: CreateWorkflowBuilderRequest):
    """
    Create a workflow using the user-friendly builder API.

    This endpoint provides typed nodes and automatic conversion,
    so users don't have to deal with raw JSON structures.
    """
    try:
        # Convert builder request to raw workflow format
        workflow_data = request.to_create_workflow_request()

        return await workflow_controller.create_workflow_handler(
            user_id=workflow_data["user_id"],
            name=workflow_data["name"],
            description=workflow_data["description"],
            nodes=workflow_data["nodes"],
            edges=workflow_data["edges"],
            category=workflow_data["category"],
            metadata=workflow_data["metadata"],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", status_code=201)
async def create_workflow(request: CreateWorkflowRequest):
    """Create a new workflow (raw JSON format)."""
    try:
        return await workflow_controller.create_workflow_handler(
            user_id=request.user_id,
            name=request.name,
            description=request.description,
            nodes=request.nodes,
            edges=request.edges,
            category=request.category,
            metadata=request.metadata,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get a workflow by ID."""
    try:
        return await workflow_controller.get_workflow_handler(workflow_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_workflows(
    user_id: str = Query(..., description="User ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    take: int = Query(50, ge=1, le=100,
                      description="Number of records to return"),
):
    """List workflows for a user."""
    try:
        return await workflow_controller.list_workflows_handler(
            user_id=user_id,
            status=status,
            category=category,
            skip=skip,
            take=take,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{workflow_id}")
async def update_workflow(workflow_id: str, request: UpdateWorkflowRequest):
    """Update a workflow."""
    try:
        return await workflow_controller.update_workflow_handler(
            workflow_id=workflow_id,
            name=request.name,
            description=request.description,
            nodes=request.nodes,
            edges=request.edges,
            category=request.category,
            metadata=request.metadata,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow."""
    try:
        success = await workflow_controller.delete_workflow_handler(workflow_id)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Workflow Actions =============


@router.post("/{workflow_id}/publish")
async def publish_workflow(workflow_id: str):
    """Publish a workflow (make it executable)."""
    try:
        return await workflow_controller.publish_workflow_handler(workflow_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{workflow_id}/pause")
async def pause_workflow(workflow_id: str):
    """Pause a workflow (prevent execution)."""
    try:
        return await workflow_controller.pause_workflow_handler(workflow_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{workflow_id}/archive")
async def archive_workflow(workflow_id: str):
    """Archive a workflow."""
    try:
        return await workflow_controller.archive_workflow_handler(workflow_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workflow_id}/validate")
async def validate_workflow(workflow_id: str):
    """Validate a workflow structure."""
    try:
        return await workflow_controller.validate_workflow_handler(workflow_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Workflow Execution =============


@router.post("/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, request: ExecuteWorkflowRequest):
    """Execute a workflow."""
    try:
        return await workflow_controller.execute_workflow_handler(
            workflow_id=workflow_id,
            trigger_data=request.trigger_data,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workflow_id}/executions")
async def get_workflow_executions(
    workflow_id: str,
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    take: int = Query(50, ge=1, le=100),
):
    """Get execution history for a workflow."""
    try:
        return await workflow_controller.get_workflow_executions_handler(
            workflow_id=workflow_id,
            status=status,
            skip=skip,
            take=take,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= Execution Management =============


@router.get("/executions/{execution_id}")
async def get_execution(execution_id: str):
    """Get an execution by ID."""
    try:
        return await workflow_controller.get_execution_handler(execution_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/executions/{execution_id}/cancel")
async def cancel_execution(execution_id: str):
    """Cancel a running execution."""
    try:
        success = await workflow_controller.cancel_execution_handler(execution_id)

        if not success:
            raise HTTPException(
                status_code=400,
                detail="Cannot cancel execution (not found or already completed)"
            )

        return {"success": success}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
