"""
Task Management MCP Server - Handles task operations
"""

import json
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime

from fastmcp import FastMCP
from fastmcp.server.context import Context
from .models import Task

# Task Management Server - Handles task operations
task_server = FastMCP("TaskServer")

# In-memory task storage (in production, use a proper database)
task_storage: Dict[str, Dict] = {}


@task_server.tool
async def create_task(description: str, priority: str = "medium", tags: List[str] = None, context: Context = None) -> Dict[str, Any]:
    """Create a new task with the given details."""
    if tags is None:
        tags = []
    
    task_id = uuid.uuid4().hex[:8]
    
    task = Task(
        id=task_id,
        description=description,
        priority=priority,
        tags=tags
    )
    
    # Use json.dumps with default=str to handle datetime serialization
    task_dict = json.loads(json.dumps(task.dict(), default=str))
    task_storage[task_id] = task_dict
    
    # Log the task creation
    if context:
        await context.info(f"Created new task: {task_id}")
    
    return {
        "success": True,
        "task": task_dict,
        "message": f"Task {task_id} created successfully"
    }




@task_server.tool
async def list_tasks(status: Optional[str] = None) -> List[Dict[str, Any]]:
    """List all tasks, optionally filtered by status."""
    tasks = list(task_storage.values())
    
    if status:
        tasks = [task for task in tasks if task["status"] == status]
    
    return tasks


@task_server.tool
async def update_task_status(task_id: str, status: str, context: Context) -> Dict[str, Any]:
    """Update the status of an existing task."""
    if task_id not in task_storage:
        return {"success": False, "error": f"Task {task_id} not found"}

    task_storage[task_id]["status"] = status
    task_storage[task_id]["updated_at"] = datetime.now().isoformat()
    
    if context:
        await context.info(f"Updated task {task_id} status to: {status}")
    
    return {
        "success": True,
        "task": task_storage[task_id],
        "message": f"Task {task_id} status updated to {status}"
    }


@task_server.resource("tasks://all")
async def get_all_tasks() -> str:
    """Get all tasks as a JSON resource."""
    return json.dumps(list(task_storage.values()), indent=2, default=str)


@task_server.resource("tasks://{task_id}")
async def get_task_by_id(task_id: str) -> str:
    """Get a specific task by ID."""
    if task_id in task_storage:
        return json.dumps(task_storage[task_id], indent=2, default=str)
    else:
        return json.dumps({"error": f"Task {task_id} not found"})
