"""Workflow management service."""
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from prisma import Prisma
from prisma.models import Workflow, WorkflowExecution


async def create_workflow(
    db: Prisma,
    user_id: str,
    name: str,
    description: Optional[str] = None,
    nodes: Optional[List[Dict[str, Any]]] = None,
    edges: Optional[List[Dict[str, Any]]] = None,
    category: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Workflow:
    """Create a new workflow."""
    workflow = await db.workflow.create(
        data={
            "userId": user_id,
            "name": name,
            "description": description,
            "status": "DRAFT",
            "nodes": json.dumps(nodes or []),
            "edges": json.dumps(edges or []),
            "category": category,
            "metadata": json.dumps(metadata or {}),
        }
    )

    return workflow


async def get_workflow(db: Prisma, workflow_id: str) -> Optional[Workflow]:
    """Get a workflow by ID."""
    return await db.workflow.find_unique(
        where={"id": workflow_id},
        include={"executions": {"take": 10, "orderBy": {"startedAt": "desc"}}},
    )


async def list_workflows(
    db: Prisma,
    user_id: str,
    status: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    take: int = 50,
) -> List[Workflow]:
    """List workflows for a user."""
    where = {"userId": user_id}

    if status:
        where["status"] = status

    if category:
        where["category"] = category

    workflows = await db.workflow.find_many(
        where=where,
        skip=skip,
        take=take,
        order={"updatedAt": "desc"},
    )

    return workflows


async def update_workflow(
    db: Prisma,
    workflow_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    nodes: Optional[List[Dict[str, Any]]] = None,
    edges: Optional[List[Dict[str, Any]]] = None,
    category: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Workflow:
    """Update a workflow."""
    data = {}

    if name is not None:
        data["name"] = name

    if description is not None:
        data["description"] = description

    if nodes is not None:
        data["nodes"] = json.dumps(nodes)

    if edges is not None:
        data["edges"] = json.dumps(edges)

    if category is not None:
        data["category"] = category

    if metadata is not None:
        data["metadata"] = json.dumps(metadata)

    workflow = await db.workflow.update(where={"id": workflow_id}, data=data)

    return workflow


async def publish_workflow(db: Prisma, workflow_id: str) -> Workflow:
    """Publish a workflow (make it executable)."""
    workflow = await db.workflow.update(
        where={"id": workflow_id},
        data={
            "status": "PUBLISHED",
            "publishedAt": datetime.utcnow(),
        },
    )

    return workflow


async def pause_workflow(db: Prisma, workflow_id: str) -> Workflow:
    """Pause a workflow (prevent execution)."""
    workflow = await db.workflow.update(
        where={"id": workflow_id},
        data={"status": "PAUSED"},
    )

    return workflow


async def archive_workflow(db: Prisma, workflow_id: str) -> Workflow:
    """Archive a workflow."""
    workflow = await db.workflow.update(
        where={"id": workflow_id},
        data={"status": "ARCHIVED"},
    )

    return workflow


async def delete_workflow(db: Prisma, workflow_id: str) -> bool:
    """Delete a workflow."""
    await db.workflow.delete(where={"id": workflow_id})
    return True


async def get_workflow_executions(
    db: Prisma,
    workflow_id: str,
    status: Optional[str] = None,
    skip: int = 0,
    take: int = 50,
) -> List[WorkflowExecution]:
    """Get execution history for a workflow."""
    where = {"workflowId": workflow_id}

    if status:
        where["status"] = status

    executions = await db.workflowexecution.find_many(
        where=where,
        skip=skip,
        take=take,
        order={"startedAt": "desc"},
    )

    return executions


async def get_execution(db: Prisma, execution_id: str) -> Optional[WorkflowExecution]:
    """Get an execution by ID."""
    return await db.workflowexecution.find_unique(
        where={"id": execution_id},
        include={"workflow": True},
    )


async def validate_workflow(workflow: Workflow) -> Dict[str, Any]:
    """Validate a workflow structure."""
    errors = []
    warnings = []

    # Parse nodes and edges
    try:
        nodes = json.loads(workflow.nodes) if isinstance(
            workflow.nodes, str) else workflow.nodes
        edges = json.loads(workflow.edges) if isinstance(
            workflow.edges, str) else workflow.edges
    except json.JSONDecodeError as e:
        return {"valid": False, "errors": [f"Invalid JSON: {str(e)}"]}

    # Check for at least one node
    if not nodes:
        errors.append("Workflow must have at least one node")

    # Check for trigger node
    has_trigger = any(n.get("type") == "trigger" for n in nodes)
    if not has_trigger:
        warnings.append("Workflow has no trigger node")

    # Check for orphaned nodes
    node_ids = {n["id"] for n in nodes}
    connected_nodes = set()

    for edge in edges:
        if edge["source"] not in node_ids:
            errors.append(
                f"Edge references non-existent source node: {edge['source']}")
        if edge["target"] not in node_ids:
            errors.append(
                f"Edge references non-existent target node: {edge['target']}")

        connected_nodes.add(edge["source"])
        connected_nodes.add(edge["target"])

    orphaned = node_ids - connected_nodes
    if orphaned and len(nodes) > 1:
        warnings.append(f"Orphaned nodes detected: {', '.join(orphaned)}")

    # Check for cycles (simple check)
    # More sophisticated cycle detection could be added

    # Check action nodes have connections
    for node in nodes:
        if node.get("type") == "action":
            if not node.get("data", {}).get("connectionId"):
                warnings.append(
                    f"Action node '{node.get('data', {}).get('label', node['id'])}' has no connection configured")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "node_count": len(nodes),
        "edge_count": len(edges),
    }
