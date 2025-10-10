"""Workflow controller."""
from typing import Any, Dict, List, Optional

from ..services.database import prisma_session
from ..services import workflow_service
from ..services.workflow_execution_service import WorkflowExecutionEngine, cancel_execution


async def create_workflow_handler(
    user_id: str,
    name: str,
    description: Optional[str] = None,
    nodes: Optional[List[Dict[str, Any]]] = None,
    edges: Optional[List[Dict[str, Any]]] = None,
    category: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a new workflow."""
    async with prisma_session() as db:
        workflow = await workflow_service.create_workflow(
            db=db,
            user_id=user_id,
            name=name,
            description=description,
            nodes=nodes,
            edges=edges,
            category=category,
            metadata=metadata,
        )

        return _serialize_workflow(workflow)


async def get_workflow_handler(workflow_id: str) -> Dict[str, Any]:
    """Get a workflow by ID."""
    async with prisma_session() as db:
        workflow = await workflow_service.get_workflow(db, workflow_id)

        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        return _serialize_workflow(workflow)


async def list_workflows_handler(
    user_id: str,
    status: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    take: int = 50,
) -> List[Dict[str, Any]]:
    """List workflows for a user."""
    async with prisma_session() as db:
        workflows = await workflow_service.list_workflows(
            db=db,
            user_id=user_id,
            status=status,
            category=category,
            skip=skip,
            take=take,
        )

        return [_serialize_workflow(w) for w in workflows]


async def update_workflow_handler(
    workflow_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    nodes: Optional[List[Dict[str, Any]]] = None,
    edges: Optional[List[Dict[str, Any]]] = None,
    category: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Update a workflow."""
    async with prisma_session() as db:
        workflow = await workflow_service.update_workflow(
            db=db,
            workflow_id=workflow_id,
            name=name,
            description=description,
            nodes=nodes,
            edges=edges,
            category=category,
            metadata=metadata,
        )

        return _serialize_workflow(workflow)


async def publish_workflow_handler(workflow_id: str) -> Dict[str, Any]:
    """Publish a workflow."""
    async with prisma_session() as db:
        # Validate before publishing
        workflow = await workflow_service.get_workflow(db, workflow_id)

        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        validation = await workflow_service.validate_workflow(workflow)

        if not validation["valid"]:
            raise ValueError(
                f"Workflow validation failed: {validation['errors']}")

        workflow = await workflow_service.publish_workflow(db, workflow_id)

        return _serialize_workflow(workflow)


async def pause_workflow_handler(workflow_id: str) -> Dict[str, Any]:
    """Pause a workflow."""
    async with prisma_session() as db:
        workflow = await workflow_service.pause_workflow(db, workflow_id)
        return _serialize_workflow(workflow)


async def archive_workflow_handler(workflow_id: str) -> Dict[str, Any]:
    """Archive a workflow."""
    async with prisma_session() as db:
        workflow = await workflow_service.archive_workflow(db, workflow_id)
        return _serialize_workflow(workflow)


async def delete_workflow_handler(workflow_id: str) -> bool:
    """Delete a workflow."""
    async with prisma_session() as db:
        return await workflow_service.delete_workflow(db, workflow_id)


async def validate_workflow_handler(workflow_id: str) -> Dict[str, Any]:
    """Validate a workflow."""
    async with prisma_session() as db:
        workflow = await workflow_service.get_workflow(db, workflow_id)

        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        return await workflow_service.validate_workflow(workflow)


async def execute_workflow_handler(
    workflow_id: str, trigger_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Execute a workflow."""
    async with prisma_session() as db:
        engine = WorkflowExecutionEngine(db)
        execution_id = await engine.execute_workflow(workflow_id, trigger_data)

        execution = await workflow_service.get_execution(db, execution_id)

        return _serialize_execution(execution)


async def get_workflow_executions_handler(
    workflow_id: str,
    status: Optional[str] = None,
    skip: int = 0,
    take: int = 50,
) -> List[Dict[str, Any]]:
    """Get execution history for a workflow."""
    async with prisma_session() as db:
        executions = await workflow_service.get_workflow_executions(
            db=db,
            workflow_id=workflow_id,
            status=status,
            skip=skip,
            take=take,
        )

        return [_serialize_execution(e) for e in executions]


async def get_execution_handler(execution_id: str) -> Dict[str, Any]:
    """Get an execution by ID."""
    async with prisma_session() as db:
        execution = await workflow_service.get_execution(db, execution_id)

        if not execution:
            raise ValueError(f"Execution {execution_id} not found")

        return _serialize_execution(execution)


async def cancel_execution_handler(execution_id: str) -> bool:
    """Cancel a running execution."""
    async with prisma_session() as db:
        return await cancel_execution(db, execution_id)


def _serialize_workflow(workflow: Any) -> Dict[str, Any]:
    """Serialize workflow for API response."""
    import json

    return {
        "id": workflow.id,
        "user_id": workflow.userId,
        "name": workflow.name,
        "description": workflow.description,
        "status": workflow.status,
        "category": workflow.category,
        "nodes": json.loads(workflow.nodes) if isinstance(workflow.nodes, str) else workflow.nodes,
        "edges": json.loads(workflow.edges) if isinstance(workflow.edges, str) else workflow.edges,
        "metadata": json.loads(workflow.metadata) if isinstance(workflow.metadata, str) else workflow.metadata,
        "created_at": workflow.createdAt.isoformat() if workflow.createdAt else None,
        "updated_at": workflow.updatedAt.isoformat() if workflow.updatedAt else None,
        "published_at": workflow.publishedAt.isoformat() if workflow.publishedAt else None,
        "executions": [_serialize_execution(e) for e in workflow.executions] if hasattr(workflow, "executions") and workflow.executions else None,
    }


def _serialize_execution(execution: Any) -> Dict[str, Any]:
    """Serialize execution for API response."""
    import json

    return {
        "id": execution.id,
        "workflow_id": execution.workflowId,
        "status": execution.status,
        "started_at": execution.startedAt.isoformat() if execution.startedAt else None,
        "completed_at": execution.completedAt.isoformat() if execution.completedAt else None,
        "error": execution.error,
        "logs": json.loads(execution.logs) if isinstance(execution.logs, str) and execution.logs else execution.logs,
        "node_results": json.loads(execution.nodeResults) if isinstance(execution.nodeResults, str) and execution.nodeResults else execution.nodeResults,
        "metadata": json.loads(execution.metadata) if isinstance(execution.metadata, str) and execution.metadata else execution.metadata,
        "workflow": _serialize_workflow(execution.workflow) if hasattr(execution, "workflow") and execution.workflow else None,
    }
