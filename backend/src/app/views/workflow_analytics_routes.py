"""Workflow analytics routes."""
from fastapi import APIRouter, Query

from ..controllers import workflow_analytics_controller

router = APIRouter(prefix="/workflows/analytics",
                   tags=["workflows", "analytics"])


@router.get("")
async def get_workflow_analytics(
    user_id: str = Query(..., description="User ID to get analytics for"),
    days: int = Query(
        7, description="Number of days to include in analytics", ge=1, le=90),
):
    """
    Get workflow analytics for a user.

    Returns metrics including:
    - Overview (total workflows, executions, success rate, avg execution time)
    - Daily execution trends
    - Workflow execution counts
    - Category distribution
    - Status distributions
    - Recent executions
    """
    return await workflow_analytics_controller.get_workflow_analytics_handler(
        user_id=user_id,
        days=days,
    )
