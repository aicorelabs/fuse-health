"""Workflow execution engine."""
import asyncio
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from prisma import Prisma


class NodeType(str, Enum):
    """Types of workflow nodes."""
    TRIGGER = "trigger"
    ACTION = "action"
    CONDITION = "condition"
    LOOP = "loop"
    DELAY = "delay"
    TRANSFORM = "transform"
    AI = "ai"


class WorkflowNode:
    """Represents a node in the workflow."""

    def __init__(
        self,
        id: str,
        type: NodeType,
        name: str,
        service_type: Optional[str] = None,
        connection_id: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
    ):
        self.id = id
        self.type = type
        self.name = name
        self.service_type = service_type
        self.connection_id = connection_id
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
                    service_type=n["data"].get("serviceType"),
                    connection_id=n["data"].get("connectionId"),
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
        elif node.type == NodeType.AI:
            return await self._execute_ai_node(node, context)
        else:
            raise ValueError(f"Unknown node type: {node.type}")

    async def _execute_trigger_node(self, node: WorkflowNode, context: ExecutionContext) -> Dict[str, Any]:
        """Execute a trigger node."""
        # Trigger nodes just pass through the trigger data
        return {"status": "triggered", "data": context.variables}

    async def _execute_action_node(self, node: WorkflowNode, context: ExecutionContext) -> Dict[str, Any]:
        """Execute an action node (e.g., send email, API call)."""
        # This will be implemented with actual service integrations
        # For now, simulate the action

        if not node.service_type:
            raise ValueError(f"Action node {node.id} missing service_type")

        # Get connection if needed
        connection = None
        if node.connection_id:
            connection = await self.db.connection.find_unique(where={"id": node.connection_id})

            if not connection:
                raise ValueError(f"Connection {node.connection_id} not found")

        context.add_log(
            "info",
            f"Executing action: {node.service_type}",
            node_id=node.id,
            data={"config": node.config},
        )

        # Simulate different service types
        result = {}
        
        if node.service_type == "google_sheets":
            # Simulate Google Sheets read
            spreadsheet_id = node.config.get("spreadsheet_id")
            range_name = node.config.get("range", "Sheet1!A:Z")
            
            # Simulate fetching data (in real implementation, use Google Sheets API)
            mock_data = [
                {"name": "John Doe", "email": "john@example.com", "status": "Active"},
                {"name": "Jane Smith", "email": "jane@example.com", "status": "Active"},
                {"name": "Bob Johnson", "email": "bob@example.com", "status": "Pending"},
            ]
            
            context.set_variable("sheet_data", mock_data)
            
            result = {
                "status": "completed",
                "service": node.service_type,
                "connection": connection.displayName if connection else None,
                "output": f"Fetched {len(mock_data)} rows from Google Sheets",
                "data": mock_data,
                "row_count": len(mock_data),
            }
            
        elif node.service_type == "gmail":
            # Simulate Gmail send
            to = node.config.get("to")
            subject = node.config.get("subject")
            body = node.config.get("body")
            
            # Replace variables in email fields
            loop_item = context.get_variable("loop_item")
            if loop_item and isinstance(loop_item, dict):
                # Replace placeholders with loop item values
                if to:
                    for key, value in loop_item.items():
                        to = to.replace(f"${{{key}}}", str(value))
                if subject:
                    for key, value in loop_item.items():
                        subject = subject.replace(f"${{{key}}}", str(value))
                if body:
                    for key, value in loop_item.items():
                        body = body.replace(f"${{{key}}}", str(value))
            
            result = {
                "status": "completed",
                "service": node.service_type,
                "connection": connection.displayName if connection else None,
                "output": f"Email sent to {to}",
                "email_details": {
                    "to": to,
                    "subject": subject,
                    "body_preview": body[:50] + "..." if body and len(body) > 50 else body,
                }
            }
            
        else:
            # Default simulation
            result = {
                "status": "completed",
                "service": node.service_type,
                "connection": connection.displayName if connection else None,
                "output": f"Action {node.name} executed successfully",
            }

        return result

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
            context.add_error(f"Loop items must be a list, got {type(items)}", node_id=node.id)
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
                        eval_condition = eval_condition.replace(f"${{{var_name}}}", str(var_value))
                    
                    if not eval(eval_condition):
                        break
                    
                    context.set_variable("loop_index", iteration)
                    iteration += 1
                    
                except Exception as e:
                    context.add_error(f"Loop condition evaluation failed: {condition}", node_id=node.id, error=e)
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

    async def _execute_ai_node(self, node: WorkflowNode, context: ExecutionContext) -> Dict[str, Any]:
        """Execute an AI node (LLM processing)."""
        ai_provider = node.config.get("provider", "openai")
        model = node.config.get("model", "gpt-4")
        prompt = node.config.get("prompt", "")
        system_prompt = node.config.get("system_prompt", "You are a helpful assistant.")
        temperature = node.config.get("temperature", 0.7)
        max_tokens = node.config.get("max_tokens", 500)
        
        # Replace variables in prompts
        loop_item = context.get_variable("loop_item")
        if loop_item and isinstance(loop_item, dict):
            for key, value in loop_item.items():
                prompt = prompt.replace(f"${{{key}}}", str(value))
                system_prompt = system_prompt.replace(f"${{{key}}}", str(value))
        
        # Also replace other context variables
        for var_name, var_value in context.variables.items():
            if var_name != "loop_item":
                prompt = prompt.replace(f"${{{var_name}}}", str(var_value))
                system_prompt = system_prompt.replace(f"${{{var_name}}}", str(var_value))
        
        context.add_log(
            "info",
            f"Executing AI node: {ai_provider}/{model}",
            node_id=node.id,
            data={
                "provider": ai_provider,
                "model": model,
                "prompt_preview": prompt[:100] + "..." if len(prompt) > 100 else prompt
            }
        )
        
        # Simulate AI response (in production, call actual API)
        if ai_provider == "openai":
            # Simulate OpenAI API call
            simulated_response = f"[AI Generated Response based on: {prompt[:50]}...]"
            
            if "email" in prompt.lower() or "write" in prompt.lower():
                simulated_response = f"""Subject: Personalized Message

Dear User,

This is an AI-generated personalized email based on your request.

{prompt}

Best regards,
AI Assistant"""
            
            elif "summarize" in prompt.lower():
                simulated_response = "This is a concise summary of the provided content, highlighting the key points and main ideas."
            
            elif "analyze" in prompt.lower():
                simulated_response = "Based on the analysis, the data shows positive trends with key insights indicating successful performance."
        
        elif ai_provider == "anthropic":
            simulated_response = f"[Claude AI response to: {prompt[:50]}...]"
        
        else:
            simulated_response = f"[AI response from {ai_provider}]"
        
        # Store AI response in context
        context.set_variable("ai_response", simulated_response)
        context.set_variable("ai_last_response", simulated_response)
        
        context.add_log(
            "info",
            f"AI node completed",
            node_id=node.id,
            data={
                "response_preview": simulated_response[:100] + "..." if len(simulated_response) > 100 else simulated_response,
                "tokens_used": len(simulated_response.split())  # Rough estimate
            }
        )
        
        return {
            "status": "completed",
            "provider": ai_provider,
            "model": model,
            "response": simulated_response,
            "prompt_used": prompt,
            "tokens_estimate": len(simulated_response.split())
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
