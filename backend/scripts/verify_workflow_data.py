"""
Verification script to check workflow analytics data.

This script shows:
- Current workflows and their statuses
- Recent executions
- Analytics summary

Run: python -m scripts.verify_workflow_data
"""
from src.app.services.database import prisma_session
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


USER_ID = "user_demo_001"


async def check_user(db):
    """Check if user exists."""
    print("="*60)
    print("CHECKING USER")
    print("="*60)

    user = await db.user.find_unique(where={"id": USER_ID})
    if user:
        print(f"✓ User exists: {user.email} (ID: {user.id})")
    else:
        print(f"✗ User not found: {USER_ID}")
        print(f"  Run the seed script first to create demo data.")

    return user


async def check_workflows(db):
    """Check workflows."""
    print("\n" + "="*60)
    print("WORKFLOWS")
    print("="*60)

    workflows = await db.workflow.find_many(
        where={"userId": USER_ID},
        order={"createdAt": "desc"}
    )

    if not workflows:
        print("✗ No workflows found")
        return []

    print(f"Found {len(workflows)} workflows:\n")

    status_counts = {}
    category_counts = {}

    for wf in workflows:
        status_counts[wf.status] = status_counts.get(wf.status, 0) + 1
        category = wf.category or "Uncategorized"
        category_counts[category] = category_counts.get(category, 0) + 1
        print(f"  • {wf.name}")
        print(f"    Status: {wf.status}, Category: {category}")
        print(f"    Created: {wf.createdAt.strftime('%Y-%m-%d %H:%M:%S')}")
        print()

    print("Status Distribution:")
    for status, count in status_counts.items():
        print(f"  {status}: {count}")

    print("\nCategory Distribution:")
    for category, count in category_counts.items():
        print(f"  {category}: {count}")

    return workflows


async def check_executions(db):
    """Check executions."""
    print("\n" + "="*60)
    print("EXECUTIONS")
    print("="*60)

    executions = await db.workflowexecution.find_many(
        where={"workflow": {"is": {"userId": USER_ID}}},
        include={"workflow": True},
        order={"startedAt": "desc"},
        take=10
    )

    if not executions:
        print("✗ No executions found")
        return []

    total_executions = await db.workflowexecution.count(
        where={"workflow": {"is": {"userId": USER_ID}}}
    )

    print(f"Total executions: {total_executions}")
    print(f"\nMost recent 10 executions:\n")

    for ex in executions:
        duration = "N/A"
        if ex.completedAt and ex.startedAt:
            duration = f"{(ex.completedAt - ex.startedAt).total_seconds():.2f}s"

        print(f"  • {ex.workflow.name if ex.workflow else 'Unknown'}")
        print(f"    Status: {ex.status}, Duration: {duration}")
        print(f"    Started: {ex.startedAt.strftime('%Y-%m-%d %H:%M:%S')}")
        if ex.error:
            print(f"    Error: {ex.error}")
        print()

    # Status distribution
    status_counts = {}
    all_executions = await db.workflowexecution.find_many(
        where={"workflow": {"is": {"userId": USER_ID}}}
    )

    for ex in all_executions:
        status_counts[ex.status] = status_counts.get(ex.status, 0) + 1

    print("Status Distribution:")
    for status, count in status_counts.items():
        pct = (count / total_executions * 100) if total_executions > 0 else 0
        print(f"  {status}: {count} ({pct:.1f}%)")

    return executions


async def check_date_range(db):
    """Check date range of executions."""
    print("\n" + "="*60)
    print("DATE RANGE")
    print("="*60)

    oldest = await db.workflowexecution.find_first(
        where={"workflow": {"is": {"userId": USER_ID}}},
        order={"startedAt": "asc"}
    )

    newest = await db.workflowexecution.find_first(
        where={"workflow": {"is": {"userId": USER_ID}}},
        order={"startedAt": "desc"}
    )

    if oldest and newest:
        print(
            f"Oldest execution: {oldest.startedAt.strftime('%Y-%m-%d %H:%M:%S')}")
        print(
            f"Newest execution: {newest.startedAt.strftime('%Y-%m-%d %H:%M:%S')}")

        days = (newest.startedAt - oldest.startedAt).days
        print(f"Span: {days} days")

        # Check executions per day
        print("\nExecutions per day (last 7 days):")
        for i in range(7):
            date = datetime.utcnow() - timedelta(days=6-i)
            start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)

            count = await db.workflowexecution.count(
                where={
                    "workflow": {"is": {"userId": USER_ID}},
                    "startedAt": {"gte": start, "lt": end}
                }
            )

            print(f"  {date.strftime('%Y-%m-%d')}: {count} executions")
    else:
        print("✗ No executions found")


async def test_analytics_endpoint_data(db):
    """Show what the analytics endpoint would return."""
    print("\n" + "="*60)
    print("ANALYTICS ENDPOINT PREVIEW")
    print("="*60)

    days = 7
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Get workflows
    workflows = await db.workflow.find_many(where={"userId": USER_ID})

    # Get executions in range
    executions = await db.workflowexecution.find_many(
        where={
            "workflow": {"is": {"userId": USER_ID}},
            "startedAt": {"gte": start_date}
        }
    )

    total_workflows = len(workflows)
    active_workflows = sum(1 for w in workflows if w.status == "PUBLISHED")
    total_executions = len(executions)
    successful = sum(1 for e in executions if e.status == "SUCCESS")
    failed = sum(1 for e in executions if e.status == "ERROR")

    success_rate = (successful / total_executions *
                    100) if total_executions > 0 else 0

    # Calculate avg execution time
    completed = [e for e in executions if e.completedAt and e.startedAt]
    avg_time = 0
    if completed:
        total_time = sum((e.completedAt - e.startedAt).total_seconds()
                         for e in completed)
        avg_time = total_time / len(completed)

    print(f"\nOverview Metrics (last {days} days):")
    print(f"  Total Workflows: {total_workflows}")
    print(f"  Active Workflows: {active_workflows}")
    print(f"  Total Executions: {total_executions}")
    print(f"  Success Rate: {success_rate:.1f}%")
    print(f"  Avg Execution Time: {avg_time:.2f}s")
    print(f"\nExecution Breakdown:")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    print(f"  Other: {total_executions - successful - failed}")


async def main():
    """Main verification function."""
    print("="*60)
    print("WORKFLOW ANALYTICS DATA VERIFICATION")
    print("="*60)
    print()

    async with prisma_session() as db:
        user = await check_user(db)
        if not user:
            return

        workflows = await check_workflows(db)
        executions = await check_executions(db)

        if executions:
            await check_date_range(db)
            await test_analytics_endpoint_data(db)

        print("\n" + "="*60)
        if workflows and executions:
            print("✓ Data looks good! Analytics should work properly.")
            print(f"\nTest the analytics endpoint:")
            print(
                f"  GET http://localhost:8000/workflows/analytics?user_id={USER_ID}&days=7")
        else:
            print("✗ Missing data. Run the seed script first:")
            print("  python -m scripts.seed_workflow_analytics_data")
        print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
