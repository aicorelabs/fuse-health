"""Workflow analytics controller."""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from ..services.database import prisma_session


async def get_workflow_analytics_handler(
    user_id: str,
    days: int = 7,
) -> Dict[str, Any]:
    """
    Get workflow analytics for a user.

    Args:
        user_id: User ID to get analytics for
        days: Number of days to include in analytics (default: 7)

    Returns:
        Dictionary containing analytics data
    """
    async with prisma_session() as db:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get all workflows for user
        workflows = await db.workflow.find_many(
            where={
                "userId": user_id,
            },
            include={
                "executions": {
                    "where": {
                        "startedAt": {
                            "gte": start_date,
                        }
                    }
                }
            }
        )

        # Get all executions in the date range
        executions = await db.workflowexecution.find_many(
            where={
                "workflow": {
                    "is": {
                        "userId": user_id,
                    }
                },
                "startedAt": {
                    "gte": start_date,
                }
            },
            include={
                "workflow": True,
            },
            order={
                "startedAt": "asc",
            }
        )

        # Calculate metrics
        total_workflows = len(workflows)
        active_workflows = sum(1 for w in workflows if w.status == "PUBLISHED")
        draft_workflows = sum(1 for w in workflows if w.status == "DRAFT")

        total_executions = len(executions)
        successful_executions = sum(
            1 for e in executions if e.status == "SUCCESS")
        failed_executions = sum(1 for e in executions if e.status == "ERROR")
        running_executions = sum(
            1 for e in executions if e.status == "RUNNING")

        # Calculate success rate
        success_rate = (successful_executions /
                        total_executions * 100) if total_executions > 0 else 0

        # Calculate average execution time
        completed_executions = [
            e for e in executions if e.completedAt and e.startedAt]
        avg_execution_time = 0
        if completed_executions:
            total_time = sum(
                (e.completedAt - e.startedAt).total_seconds()
                for e in completed_executions
            )
            avg_execution_time = total_time / len(completed_executions)

        # Group executions by day
        daily_executions = {}
        for execution in executions:
            day_key = execution.startedAt.strftime("%Y-%m-%d")
            if day_key not in daily_executions:
                daily_executions[day_key] = {
                    "date": day_key,
                    "total": 0,
                    "success": 0,
                    "error": 0,
                    "running": 0,
                }

            daily_executions[day_key]["total"] += 1
            if execution.status == "SUCCESS":
                daily_executions[day_key]["success"] += 1
            elif execution.status == "ERROR":
                daily_executions[day_key]["error"] += 1
            elif execution.status == "RUNNING":
                daily_executions[day_key]["running"] += 1

        # Get workflow execution counts
        workflow_execution_counts = {}
        for execution in executions:
            workflow_id = execution.workflowId
            if workflow_id not in workflow_execution_counts:
                workflow_name = execution.workflow.name if execution.workflow else "Unknown"
                workflow_execution_counts[workflow_id] = {
                    "workflow_id": workflow_id,
                    "workflow_name": workflow_name,
                    "executions": 0,
                    "success": 0,
                    "error": 0,
                }

            workflow_execution_counts[workflow_id]["executions"] += 1
            if execution.status == "SUCCESS":
                workflow_execution_counts[workflow_id]["success"] += 1
            elif execution.status == "ERROR":
                workflow_execution_counts[workflow_id]["error"] += 1

        # Get category distribution
        category_distribution = {}
        for workflow in workflows:
            category = workflow.category or "Uncategorized"
            if category not in category_distribution:
                category_distribution[category] = 0
            category_distribution[category] += 1

        # Get status distribution
        status_distribution = {
            "DRAFT": draft_workflows,
            "PUBLISHED": active_workflows,
            "PAUSED": sum(1 for w in workflows if w.status == "PAUSED"),
            "ARCHIVED": sum(1 for w in workflows if w.status == "ARCHIVED"),
        }

        # Get execution status distribution
        execution_status_distribution = {
            "SUCCESS": successful_executions,
            "ERROR": failed_executions,
            "RUNNING": running_executions,
            "QUEUED": sum(1 for e in executions if e.status == "QUEUED"),
            "CANCELLED": sum(1 for e in executions if e.status == "CANCELLED"),
        }

        # Get recent executions (last 10)
        recent_executions = sorted(
            executions, key=lambda e: e.startedAt, reverse=True)[:10]

        return {
            "overview": {
                "total_workflows": total_workflows,
                "active_workflows": active_workflows,
                "draft_workflows": draft_workflows,
                "total_executions": total_executions,
                "success_rate": round(success_rate, 2),
                "avg_execution_time": round(avg_execution_time, 2),
            },
            "daily_executions": list(daily_executions.values()),
            "workflow_execution_counts": list(workflow_execution_counts.values()),
            "category_distribution": [
                {"category": k, "count": v}
                for k, v in category_distribution.items()
            ],
            "status_distribution": [
                {"status": k, "count": v}
                for k, v in status_distribution.items()
            ],
            "execution_status_distribution": [
                {"status": k, "count": v}
                for k, v in execution_status_distribution.items()
            ],
            "recent_executions": [
                {
                    "id": e.id,
                    "workflow_id": e.workflowId,
                    "workflow_name": e.workflow.name if e.workflow else "Unknown",
                    "status": e.status,
                    "started_at": e.startedAt.isoformat() if e.startedAt else None,
                    "completed_at": e.completedAt.isoformat() if e.completedAt else None,
                    "duration": (e.completedAt - e.startedAt).total_seconds() if e.completedAt and e.startedAt else None,
                }
                for e in recent_executions
            ],
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": days,
            }
        }
