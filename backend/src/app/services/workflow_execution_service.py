"""Workflow execution engine with connector-based integrations."""
import asyncio
import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from prisma import Prisma

# Import connectors - use absolute import for better compatibility
try:
    from src.connectors import ConnectorRegistry
    from src.app.services.integration_service import IntegrationService
    from src.app.services.template_engine import template_engine
except ImportError:
    # Fallback for relative imports when running as module
    from ...connectors import ConnectorRegistry
    from .integration_service import IntegrationService
    from .template_engine import template_engine


class NodeType(str, Enum):
    """Types of workflow nodes."""
    TRIGGER = "trigger"
    ACTION = "action"
    CONDITION = "condition"
    LOOP = "loop"
    DELAY = "delay"
    TRANSFORM = "transform"


class WorkflowNode:
    """Represents a node in the workflow."""

    def __init__(
        self,
        id: str,
        type: NodeType,
        name: str,
        connector_id: Optional[str] = None,
        integration_id: Optional[str] = None,
        action_id: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
    ):
        self.id = id
        self.type = type
        self.name = name
        self.connector_id = connector_id
        self.integration_id = integration_id
        self.action_id = action_id
        self.config = config or {}


class WorkflowEdge:
    """Represents an edge connecting nodes."""

    def __init__(self, id: str, source: str, target: str, condition: Optional[str] = None):
        self.id = id
        self.source = source
        self.target = target
        self.condition = condition


class ExecutionContext:
    """Context for workflow execution."""

    def __init__(self, workflow_id: str, execution_id: str, user_id: str):
        self.workflow_id = workflow_id
        self.execution_id = execution_id
        self.user_id = user_id
        self.variables: Dict[str, Any] = {}
        self.node_results: Dict[str, Any] = {}
        self.logs: List[Dict[str, Any]] = []
        self.errors: List[Dict[str, Any]] = []

    def set_variable(self, key: str, value: Any) -> None:
        """Set a variable in the execution context."""
        self.variables[key] = value

    def get_variable(self, key: str, default: Any = None) -> Any:
        """Get a variable from the execution context."""
        return self.variables.get(key, default)

    def set_node_result(self, node_id: str, result: Any) -> None:
        """Store the result of a node execution."""
        self.node_results[node_id] = result

    def get_node_result(self, node_id: str) -> Any:
        """Get the result of a node execution."""
        return self.node_results.get(node_id)

    def add_log(
        self, level: str, message: str, node_id: Optional[str] = None, data: Optional[Dict] = None
    ) -> None:
        """Add a log entry."""
        self.logs.append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "level": level,
                "message": message,
                "node_id": node_id,
                "data": data,
            }
        )

    def add_error(self, message: str, node_id: Optional[str] = None, error: Optional[Exception] = None) -> None:
        """Add an error entry."""
        self.errors.append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": message,
                "node_id": node_id,
                "error_type": type(error).__name__ if error else None,
                "error_details": str(error) if error else None,
            }
        )


class WorkflowExecutionEngine:
    """Engine for executing workflows."""

    def __init__(self, db: Prisma):
        self.db = db

    async def execute_workflow(
        self,
        workflow_id: str,
        trigger_data: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Execute a workflow.

        Returns the execution ID.
        """
        # Get workflow
        workflow = await self.db.workflow.find_unique(where={"id": workflow_id})

        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        if workflow.status != "PUBLISHED":
            raise ValueError(f"Workflow {workflow_id} is not published")

        # Create execution record
        execution = await self.db.workflowexecution.create(
            data={
                "workflowId": workflow_id,
                "status": "RUNNING",
                "metadata": json.dumps({"trigger_data": trigger_data or {}}),
            }
        )

        # Create execution context
        context = ExecutionContext(
            workflow_id=workflow_id,
            execution_id=execution.id,
            user_id=workflow.userId,
        )

        # Add trigger data to context
        if trigger_data:
            for key, value in trigger_data.items():
                context.set_variable(key, value)

        context.add_log(
            "info", f"Starting workflow execution: {workflow.name}")

        try:
            # Parse workflow structure
            nodes_data = json.loads(workflow.nodes) if isinstance(
                workflow.nodes, str) else workflow.nodes
            edges_data = json.loads(workflow.edges) if isinstance(
                workflow.edges, str) else workflow.edges

            nodes = [
                WorkflowNode(
                    id=n["id"],
                    type=NodeType(n["type"]),
                    name=n["data"].get("label", "Unnamed"),
                    connector_id=n["data"].get("config", {}).get(
                        "connectorId") or n["data"].get("connectorId"),
                    integration_id=n["data"].get("config", {}).get(
                        "integrationId") or n["data"].get("integrationId"),
                    action_id=n["data"].get("config", {}).get(
                        "actionId") or n["data"].get("actionId"),
                    config=n["data"].get("config", {}),
                )
                for n in nodes_data
            ]

            edges = [
                WorkflowEdge(
                    id=e["id"],
                    source=e["source"],
                    target=e["target"],
                    condition=e.get("condition"),
                )
                for e in edges_data
            ]

            # Execute workflow
            await self._execute_nodes(nodes, edges, context)

            # Update execution record with success
            await self.db.workflowexecution.update(
                where={"id": execution.id},
                data={
                    "status": "SUCCESS" if not context.errors else "PARTIAL",
                    "completedAt": datetime.utcnow(),
                    "logs": json.dumps(context.logs),
                    "nodeResults": json.dumps(context.node_results),
                },
            )

            context.add_log(
                "info", "Workflow execution completed successfully")

        except Exception as e:
            # Update execution record with error
            context.add_error("Workflow execution failed", error=e)

            await self.db.workflowexecution.update(
                where={"id": execution.id},
                data={
                    "status": "ERROR",
                    "completedAt": datetime.utcnow(),
                    "error": str(e),
                    "logs": json.dumps(context.logs),
                    "nodeResults": json.dumps(context.node_results),
                },
            )

            raise

        return execution.id

    async def _execute_nodes(
        self,
        nodes: List[WorkflowNode],
        edges: List[WorkflowEdge],
        context: ExecutionContext,
    ) -> None:
        """Execute workflow nodes in the correct order."""
        # Build adjacency list
        graph: Dict[str, List[str]] = {node.id: [] for node in nodes}
        in_degree: Dict[str, int] = {node.id: 0 for node in nodes}

        for edge in edges:
            graph[edge.source].append(edge.target)
            in_degree[edge.target] += 1

        # Find starting nodes (nodes with no incoming edges)
        queue = [node_id for node_id, degree in in_degree.items()
                 if degree == 0]

        # Create node lookup
        node_map = {node.id: node for node in nodes}

        # Execute nodes in topological order
        executed_count = 0

        while queue:
            current_id = queue.pop(0)
            node = node_map[current_id]

            # Execute node
            context.add_log(
                "info", f"Executing node: {node.name}", node_id=node.id)

            try:
                result = await self._execute_node(node, context)
                context.set_node_result(node.id, result)
                context.add_log(
                    "info",
                    f"Node completed: {node.name}",
                    node_id=node.id,
                    data={"result": result},
                )
                executed_count += 1

            except Exception as e:
                context.add_error(
                    f"Node execution failed: {node.name}", node_id=node.id, error=e)
                # Continue execution for other nodes
                continue

            # Add connected nodes to queue
            for next_id in graph[current_id]:
                in_degree[next_id] -= 1
                if in_degree[next_id] == 0:
                    queue.append(next_id)

        context.add_log(
            "info", f"Executed {executed_count}/{len(nodes)} nodes")

    async def _execute_node(self, node: WorkflowNode, context: ExecutionContext) -> Any:
        """Execute a single node."""
        if node.type == NodeType.TRIGGER:
            return await self._execute_trigger_node(node, context)
        elif node.type == NodeType.ACTION:
            return await self._execute_action_node(node, context)
        elif node.type == NodeType.CONDITION:
            return await self._execute_condition_node(node, context)
        elif node.type == NodeType.TRANSFORM:
            return await self._execute_transform_node(node, context)
        elif node.type == NodeType.DELAY:
            return await self._execute_delay_node(node, context)
        elif node.type == NodeType.LOOP:
            return await self._execute_loop_node(node, context)
        else:
            raise ValueError(f"Unknown node type: {node.type}")

    async def _execute_trigger_node(self, node: WorkflowNode, context: ExecutionContext) -> Dict[str, Any]:
        """Execute a trigger node."""
        # Trigger nodes just pass through the trigger data
        return {"status": "triggered", "data": context.variables}

    async def _execute_action_node(self, node: WorkflowNode, context: ExecutionContext) -> Dict[str, Any]:
        """Execute an action node using the connector system."""
        if not node.connector_id or not node.integration_id or not node.action_id:
            raise ValueError(
                f"Action node {node.id} missing connector_id, integration_id, or action_id"
            )

        # Get integration service
        integration_service = IntegrationService(self.db)

        # Get connector
        connector = integration_service.registry.get_connector(
            node.connector_id)
        if not connector:
            raise ValueError(f"Connector '{node.connector_id}' not found")

        # Get integration and credentials
        try:
            credentials = await integration_service.get_integration_credentials(
                integration_id=node.integration_id,
                user_id=context.user_id,
            )
        except Exception as e:
            raise ValueError(f"Failed to get credentials: {str(e)}")

        # Resolve parameters from node config and context
        params = self._resolve_parameters(node.config, context)

        context.add_log(
            "info",
            f"Executing connector action: {node.connector_id}.{node.action_id}",
            node_id=node.id,
            data={"params": params},
        )

        # Execute connector action
        try:
            result = await connector.execute(
                action_id=node.action_id,
                params=params,
                credentials=credentials,
            )

            if not result.success:
                raise ValueError(result.error or "Action execution failed")

            # Update integration last used timestamp
            await self.db.integration.update(
                where={"id": node.integration_id},
                data={"lastUsed": datetime.utcnow()},
            )

            # Store result data in context for downstream nodes
            if result.data:
                # Store under a namespaced key
                context.set_variable(f"node_{node.id}_result", result.data)

                # Also store as generic output for immediate use
                context.set_variable("last_action_result", result.data)

            return {
                "status": "completed",
                "connector": node.connector_id,
                "action": node.action_id,
                "output": "Action completed successfully" if result.success else (result.error or "Action failed"),
                "data": result.data,
            }

        except Exception as e:
            context.add_error(
                f"Connector action failed: {str(e)}",
                node_id=node.id,
                error=e,
            )
            raise

    def _resolve_parameters(
        self,
        config: Dict[str, Any],
        context: ExecutionContext,
    ) -> Dict[str, Any]:
        """
        Resolve parameters by substituting variables from context.

        Now uses the enhanced template engine that supports:
        - ${variable} - direct variable substitution
        - ${node_id.result.field} - accessing node result fields
        - ${loop_item.field} - accessing loop item fields
        - {{helper_name args}} - template helper functions
        - JSONPath queries, array operations, string manipulation, etc.
        """
        # Use the enhanced template engine for resolution
        return template_engine.resolve(config, context.variables)

    def _substitute_variables(self, text: str, context: ExecutionContext) -> Any:
        """
        Legacy method: Substitute variables in text string.

        NOTE: This is kept for backward compatibility. New code should use
        the template_engine directly which provides more features.

        Examples:
        - "${email}" -> context.get_variable("email")
        - "${loop_item.name}" -> context.get_variable("loop_item")["name"]
        - "${node_abc123_result.data}" -> context.get_variable("node_abc123_result")["data"]
        """
        # Use the template engine for consistency
        return template_engine._resolve_variables(text, context.variables)

    async def _execute_condition_node(self, node: WorkflowNode, context: ExecutionContext) -> Dict[str, Any]:
        """Execute a condition node (if/else logic)."""
        condition = node.config.get("condition", "true")

        # Simple condition evaluation
        # In production, use a safe expression evaluator
        try:
            # Replace variables in condition
            for var_name, var_value in context.variables.items():
                condition = condition.replace(
                    f"${{{var_name}}}", str(var_value))

            # Evaluate condition
            result = eval(condition)

            return {"condition_met": bool(result), "condition": condition}

        except Exception as e:
            context.add_error(
                f"Condition evaluation failed: {condition}", node_id=node.id, error=e)
            return {"condition_met": False, "error": str(e)}

    async def _execute_transform_node(self, node: WorkflowNode, context: ExecutionContext) -> Dict[str, Any]:
        """Execute a transform node (data manipulation)."""
        transform_type = node.config.get("type", "map")
        input_data = node.config.get("input", {})

        # Replace variables in input
        for key, value in input_data.items():
            if isinstance(value, str) and value.startswith("$"):
                var_name = value[1:]
                input_data[key] = context.get_variable(var_name)

        if transform_type == "map":
            # Simple mapping transformation
            mapping = node.config.get("mapping", {})
            output = {}

            for out_key, in_key in mapping.items():
                if in_key in input_data:
                    output[out_key] = input_data[in_key]

            return {"output": output}

        elif transform_type == "filter":
            # Filter data based on criteria
            filter_key = node.config.get("filterKey")
            filter_value = node.config.get("filterValue")

            filtered = [item for item in input_data if item.get(
                filter_key) == filter_value]

            return {"output": filtered}

        else:
            return {"output": input_data}

    async def _execute_delay_node(self, node: WorkflowNode, context: ExecutionContext) -> Dict[str, Any]:
        """Execute a delay node (wait for specified time)."""
        delay_seconds = node.config.get("delay", 0)

        context.add_log(
            "info", f"Delaying for {delay_seconds} seconds", node_id=node.id)

        await asyncio.sleep(delay_seconds)

        return {"delayed_seconds": delay_seconds}

    async def _execute_loop_node(self, node: WorkflowNode, context: ExecutionContext) -> Dict[str, Any]:
        """Execute a loop node (iterate over items)."""
        loop_type = node.config.get("loop_type", "foreach")
        items_key = node.config.get("items", "items")

        # Get items from context or config
        items = context.get_variable(items_key)
        if items is None:
            items = node.config.get("items_data", [])

        if not isinstance(items, list):
            context.add_error(
                f"Loop items must be a list, got {type(items)}", node_id=node.id)
            return {"status": "error", "error": "Invalid items type"}

        context.add_log(
            "info",
            f"Starting loop: {loop_type} over {len(items)} items",
            node_id=node.id
        )

        results = []

        if loop_type == "foreach":
            # Iterate over each item
            for index, item in enumerate(items):
                # Set loop variables in context
                context.set_variable("loop_index", index)
                context.set_variable("loop_item", item)
                context.set_variable("loop_current", item)

                context.add_log(
                    "info",
                    f"Loop iteration {index + 1}/{len(items)}",
                    node_id=node.id,
                    data={"item": item}
                )

                # Store result
                results.append({
                    "index": index,
                    "item": item,
                    "processed": True
                })

        elif loop_type == "while":
            # While loop (limit iterations for safety)
            condition = node.config.get("condition", "false")
            max_iterations = node.config.get("max_iterations", 100)
            iteration = 0

            while iteration < max_iterations:
                # Evaluate condition
                try:
                    # Replace variables in condition
                    eval_condition = condition
                    for var_name, var_value in context.variables.items():
                        eval_condition = eval_condition.replace(
                            f"${{{var_name}}}", str(var_value))

                    if not eval(eval_condition):
                        break

                    context.set_variable("loop_index", iteration)
                    iteration += 1

                except Exception as e:
                    context.add_error(
                        f"Loop condition evaluation failed: {condition}", node_id=node.id, error=e)
                    break

        context.add_log(
            "info",
            f"Loop completed: processed {len(results)} items",
            node_id=node.id
        )

        # Store results in context for next nodes
        context.set_variable("loop_results", results)

        return {
            "status": "completed",
            "loop_type": loop_type,
            "iterations": len(results),
            "results": results
        }


async def cancel_execution(db: Prisma, execution_id: str) -> bool:
    """Cancel a running workflow execution."""
    execution = await db.workflowexecution.find_unique(where={"id": execution_id})

    if not execution:
        return False

    if execution.status not in ["QUEUED", "RUNNING"]:
        return False

    await db.workflowexecution.update(
        where={"id": execution_id},
        data={
            "status": "CANCELLED",
            "completedAt": datetime.utcnow(),
        },
    )

    return True
