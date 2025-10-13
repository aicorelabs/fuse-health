"""Workflow API routes."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from prisma import Prisma

from ..controllers import workflow_controller
from ..models.workflow_builder import (
    CreateWorkflowBuilderRequest,
    create_email_workflow,
)
from ...connectors.registry import ConnectorRegistry


router = APIRouter(prefix="/workflows", tags=["workflows"])


# ============= Node Type Definitions =============


async def get_db() -> Prisma:
    """Get database client."""
    from ..services.database import connect
    return await connect()


@router.get("/node-types")
async def get_node_types(
    user_id: Optional[str] = Query(
        None, description="User ID to check for active integrations"),
    db: Prisma = Depends(get_db)
):
    """
    Get available node types and their configurations.

    This endpoint now dynamically generates node types from the connector registry,
    and indicates which nodes are "activated" (user has created integrations for them).
    """
    try:
        # Initialize connector registry
        registry = ConnectorRegistry()
        registry.discover_connectors()

        # Get user's integrations if user_id provided
        user_integrations = []
        if user_id:
            try:
                user_integrations = await db.integration.find_many(
                    where={"userId": user_id, "status": "ACTIVE"}
                )
            except Exception as e:
                print(f"Warning: Could not fetch user integrations: {e}")

        # Create a set of connector IDs that user has integrations for
        activated_connector_ids = {
            integration.connectorId for integration in user_integrations}

        # Static trigger nodes (not based on connectors)
        trigger_nodes = [
        {
            "id": "manual-trigger",
            "label": "Manual Trigger",
            "description": "Start workflow manually",
            "category": "trigger",
            "activated": True,  # Always activated
            "fields": [
                {"id": "label", "label": "Label", "type": "text", "required": True,
                 "placeholder": "Manual Start",
                 "helperText": "Name for this trigger step"},
                {"id": "description", "label": "Description", "type": "textarea",
                 "placeholder": "Describe when this workflow should be triggered",
                 "helperText": "Optional description of trigger conditions"},
            ]
        },
        {
            "id": "schedule-trigger",
            "label": "Schedule Trigger",
            "description": "Run workflow on a schedule",
            "category": "trigger",
            "activated": True,  # Always activated
            "fields": [
                {"id": "label", "label": "Label", "type": "text", "required": True,
                 "placeholder": "Scheduled Run",
                 "helperText": "Name for this trigger step"},
                {"id": "cadence", "label": "Cadence", "type": "text", "required": True,
                 "placeholder": "Daily, Weekly, Monthly, or Cron expression",
                 "helperText": "How often to run (e.g., 'Daily', 'Every Monday', '0 9 * * *')"},
                {"id": "time", "label": "Time", "type": "text",
                 "placeholder": "09:00 AM",
                 "helperText": "Time of day to run (optional for cron expressions)"},
                {"id": "timezone", "label": "Timezone", "type": "text",
                 "placeholder": "America/New_York",
                 "helperText": "Timezone for schedule (defaults to UTC)"},
            ]
        },
        {
            "id": "webhook-trigger",
            "label": "Webhook Trigger",
            "description": "Trigger via HTTP webhook",
            "category": "trigger",
            "activated": True,  # Always activated
            "fields": [
                {"id": "label", "label": "Label", "type": "text", "required": True,
                 "placeholder": "Webhook Listener",
                 "helperText": "Name for this trigger step"},
                {"id": "path", "label": "Webhook Path", "type": "text", "required": True,
                 "placeholder": "/webhook/my-workflow",
                 "helperText": "Custom URL path for this webhook"},
                {"id": "method", "label": "HTTP Method", "type": "text",
                 "placeholder": "POST",
                 "helperText": "HTTP method (POST, GET, PUT, etc.)"},
                {"id": "auth_token", "label": "Authentication Token", "type": "text",
                 "placeholder": "Optional secret token",
                 "helperText": "Optional token for webhook authentication"},
            ]
        },
        {
            "id": "event-trigger",
            "label": "Event Trigger",
            "description": "Start on EHR data event",
            "category": "trigger",
            "activated": True,  # Always activated
            "fields": [
                {"id": "label", "label": "Label", "type": "text", "required": True,
                 "placeholder": "EHR Event",
                 "helperText": "Name for this trigger step"},
                {"id": "event", "label": "Event Type", "type": "text", "required": True,
                 "placeholder": "Observation.create, Patient.update, etc.",
                 "helperText": "FHIR resource event type to listen for"},
                {"id": "facility", "label": "Facility", "type": "text",
                 "placeholder": "All facilities or specific ID",
                 "helperText": "Filter by facility (leave blank for all)"},
                {"id": "filter", "label": "Event Filter", "type": "textarea",
                 "placeholder": '{"resourceType": "Observation", "code": ".."}',
                 "helperText": "Optional JSON filter for event properties"},
            ]
        },
    ]

        # Generate action nodes from connectors
        action_nodes = []
        data_nodes = []
        ai_nodes = []

        # Get all registered connectors
        all_connectors = registry.list_connectors()

        for connector_metadata in all_connectors:
            # Check if user has an active integration for this connector
            is_activated = connector_metadata.id in activated_connector_ids

            # Determine category
            category_map = {
                "healthcare": "data",
                "communication": "action",
                "ai": "ai",
                "data": "data",
                "productivity": "action",
                "storage": "data",
                "web": "data",
                "other": "action",
            }
            node_category = category_map.get(connector_metadata.category, "action")

            # Get connector instance to fetch available actions
            available_actions = []
            try:
                connector_instance = registry.get_connector(connector_metadata.id)
                if connector_instance:
                    actions = connector_instance.get_actions()
                    available_actions = [
                        {
                            "id": action.id,
                            "name": action.name,
                            "description": action.description,
                            "params": [
                                {
                                    "name": param.name,
                                    "type": param.type,
                                    "description": param.description,
                                    "required": param.required,
                                }
                                for param in action.params
                            ]
                        }
                        for action in actions
                    ]
            except Exception as e:
                print(f"Warning: Could not fetch actions for {connector_metadata.id}: {e}")
                # Continue without actions for this connector
                available_actions = []

            # Create node definition with all configuration fields
            fields = [
                {"id": "label", "label": "Label", "type": "text", "required": True,
                 "placeholder": f"{connector_metadata.name} action"},
            ]

            # Add connector-specific fields based on category
            if node_category == "action":
                fields.extend([
                    {"id": "action", "label": "Action", "type": "text", "required": True,
                     "placeholder": "Select action to perform",
                     "helperText": "The specific action to perform with this connector"},
                    {"id": "parameters", "label": "Parameters", "type": "textarea",
                     "placeholder": '{"key": "value"}',
                     "helperText": "JSON configuration for the action parameters"},
                ])
            elif node_category == "data":
                fields.extend([
                    {"id": "query", "label": "Query", "type": "textarea",
                     "placeholder": "Enter query or filter criteria",
                     "helperText": "Data query or filter parameters"},
                    {"id": "limit", "label": "Limit", "type": "number",
                     "placeholder": "100",
                     "helperText": "Maximum number of records to retrieve"},
                ])
            elif node_category == "ai":
                fields.extend([
                    {"id": "prompt", "label": "Prompt", "type": "textarea", "required": True,
                     "placeholder": "Enter your prompt or instructions",
                     "helperText": "The prompt or instructions for the AI model"},
                    {"id": "model", "label": "Model", "type": "text",
                     "placeholder": "gpt-4",
                     "helperText": "AI model to use"},
                    {"id": "temperature", "label": "Temperature", "type": "number",
                     "placeholder": "0.7",
                     "helperText": "Controls randomness (0.0-1.0)"},
                ])

            node_def = {
                "id": connector_metadata.id,
                "label": connector_metadata.name,
                "description": connector_metadata.description,
                "category": node_category,
                "service_type": connector_metadata.id,
                "icon": connector_metadata.icon,
                "auth_type": connector_metadata.auth_type,
                "activated": is_activated,
                "actions": available_actions,
                "fields": fields
            }

            # Add to appropriate category
            if node_category == "action":
                action_nodes.append(node_def)
            elif node_category == "data":
                data_nodes.append(node_def)
            elif node_category == "ai":
                ai_nodes.append(node_def)

        # Static logic nodes (not based on connectors)
        logic_nodes = [
        {
            "id": "condition",
            "label": "Condition",
            "description": "Branch based on condition",
            "category": "logic",
            "activated": True,  # Always activated
            "fields": [
                {"id": "label", "label": "Label", "type": "text", "required": True,
                 "placeholder": "If/Else Branch",
                 "helperText": "Name for this condition step"},
                {"id": "condition", "label": "Condition", "type": "textarea", "required": True,
                 "placeholder": '${value} > 100 or ${status} == "active"',
                 "helperText": "Boolean expression to evaluate (use ${variable} syntax)"},
                {"id": "description", "label": "Description", "type": "textarea",
                 "placeholder": "Describe what this condition checks",
                 "helperText": "Optional description of the condition logic"},
            ]
        },
        {
            "id": "transform",
            "label": "Transform Data",
            "description": "Transform or map data",
            "category": "logic",
            "activated": True,  # Always activated
            "fields": [
                {"id": "label", "label": "Label", "type": "text", "required": True,
                 "placeholder": "Data Transformation",
                 "helperText": "Name for this transformation step"},
                {"id": "transform_type", "label": "Transform Type", "type": "text",
                 "placeholder": "map, filter, reduce, merge",
                 "helperText": "Type of transformation to apply"},
                {"id": "mapping", "label": "Mapping (JSON)", "type": "textarea", "required": True,
                 "placeholder": '{"output_field": "${input_field}", "status": "processed"}',
                 "helperText": "JSON mapping definition (use ${variable} to reference input data)"},
                {"id": "output_variable", "label": "Output Variable", "type": "text",
                 "placeholder": "transformed_data",
                 "helperText": "Variable name to store the transformed data"},
            ]
        },
        {
            "id": "loop",
            "label": "Loop",
            "description": "Iterate over items",
            "category": "logic",
            "activated": True,  # Always activated
            "fields": [
                {"id": "label", "label": "Label", "type": "text", "required": True,
                 "placeholder": "For Each Item",
                 "helperText": "Name for this loop step"},
                {"id": "loop_type", "label": "Loop Type", "type": "text",
                 "placeholder": "foreach, while, until",
                 "helperText": "Type of loop iteration"},
                {"id": "items", "label": "Items Variable", "type": "text", "required": True,
                 "placeholder": "${rows} or ${patients}",
                 "helperText": "Variable containing array/collection to iterate over"},
                {"id": "item_variable", "label": "Item Variable Name", "type": "text",
                 "placeholder": "item",
                 "helperText": "Variable name for current item in loop (default: 'item')"},
                {"id": "max_iterations", "label": "Max Iterations", "type": "number",
                 "placeholder": "1000",
                 "helperText": "Safety limit for maximum loop iterations"},
            ]
        },
        {
            "id": "delay",
            "label": "Delay",
            "description": "Wait for specified time",
            "category": "logic",
            "activated": True,  # Always activated
            "fields": [
                {"id": "label", "label": "Label", "type": "text", "required": True,
                 "placeholder": "Wait Period",
                 "helperText": "Name for this delay step"},
                {"id": "delay_seconds", "label": "Delay (seconds)", "type": "number", "required": True,
                 "placeholder": "30",
                 "helperText": "Number of seconds to wait before continuing"},
                {"id": "delay_expression", "label": "Delay Expression", "type": "text",
                 "placeholder": "${variable} * 60",
                 "helperText": "Optional: Calculate delay dynamically using expression"},
                {"id": "description", "label": "Reason for Delay", "type": "textarea",
                 "placeholder": "Wait for external process to complete",
                 "helperText": "Optional description of why this delay is needed"},
            ]
        },
    ]

        # Sort nodes by activated status (activated first) then by name
        action_nodes.sort(key=lambda x: (not x["activated"], x["label"].lower()))
        data_nodes.sort(key=lambda x: (not x["activated"], x["label"].lower()))
        ai_nodes.sort(key=lambda x: (not x["activated"], x["label"].lower()))

        node_types = {
            "trigger": trigger_nodes,
            "action": action_nodes,
            "data": data_nodes,
            "logic": logic_nodes,
            "ai": ai_nodes,
        }

        return node_types
    except Exception as e:
        print(f"Error in get_node_types: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


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
