"""Controller logic for task management operations."""
from __future__ import annotations

from typing import List, Optional

from fastapi import HTTPException

from src.server.task_server import (
    create_task as task_server_create_task,
    list_tasks as task_server_list_tasks,
    update_task_status as task_server_update_task_status,
)

from ..models.task import (
    CreateTaskRequest,
    CreateTaskResponse,
    TaskModel,
    TaskStatus,
    UpdateTaskStatusRequest,
    UpdateTaskStatusResponse,
)


async def list_tasks(status: Optional[TaskStatus]) -> List[TaskModel]:
    try:
        data = await task_server_list_tasks(status.value if status else None)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not isinstance(data, list):
        raise HTTPException(status_code=500, detail="Unexpected response format from task_list_tasks tool")

    return [TaskModel.model_validate(item) for item in data]


async def create_task(payload: CreateTaskRequest) -> CreateTaskResponse:
    try:
        result = await task_server_create_task(
            description=payload.description,
            priority=payload.priority.value,
            tags=payload.tags,
            context=None,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return CreateTaskResponse.model_validate(result)


async def update_task_status(task_id: str, payload: UpdateTaskStatusRequest) -> UpdateTaskStatusResponse:
    try:
        result = await task_server_update_task_status(
            task_id=task_id,
            status=payload.status.value,
            context=None,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return UpdateTaskStatusResponse.model_validate(result)
