"""
Seed script to populate workflow analytics data for testing.

This script creates:
- Multiple workflows with different statuses and categories
- Workflow executions with various statuses and durations
- Data spread across multiple days for trend visualization

Run: python -m scripts.seed_workflow_analytics_data
"""
from src.app.services.database import prisma_session
import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


# Configuration
USER_ID = "user_demo_001"
DAYS_OF_DATA = 14  # Generate 2 weeks of data
NUM_WORKFLOWS = 15
EXECUTIONS_PER_DAY_RANGE = (5, 25)  # Random executions per day

# Workflow templates
WORKFLOW_TEMPLATES = [
    {
        "name": "Patient Intake Automation",
        "description": "Automate patient intake forms and scheduling",
        "category": "Patient Care",
        "status": "PUBLISHED",
    },
    {
        "name": "Lab Results Notification",
        "description": "Send notifications when lab results are ready",
        "category": "Clinical Workflows",
        "status": "PUBLISHED",
    },
    {
        "name": "Appointment Reminder System",
        "description": "Send appointment reminders via email and SMS",
        "category": "Patient Engagement",
        "status": "PUBLISHED",
    },
    {
        "name": "Insurance Verification",
        "description": "Verify patient insurance before appointments",
        "category": "Administrative",
        "status": "PUBLISHED",
    },
    {
        "name": "Prescription Refill Workflow",
        "description": "Automate prescription refill requests",
        "category": "Medication Management",
        "status": "PUBLISHED",
    },
    {
        "name": "Care Coordination Alerts",
        "description": "Alert care team of patient status changes",
        "category": "Care Coordination",
        "status": "PUBLISHED",
    },
    {
        "name": "Billing Automation",
        "description": "Automate billing and claims submission",
        "category": "Administrative",
        "status": "PUBLISHED",
    },
    {
        "name": "Post-Discharge Follow-up",
        "description": "Schedule follow-ups after hospital discharge",
        "category": "Patient Care",
        "status": "PUBLISHED",
    },
    {
        "name": "Quality Metrics Reporting",
        "description": "Generate quality metrics reports weekly",
        "category": "Analytics",
        "status": "PAUSED",
    },
    {
        "name": "Emergency Department Triage",
        "description": "Assist with ED triage process",
        "category": "Clinical Workflows",
        "status": "PUBLISHED",
    },
    {
        "name": "Referral Management",
        "description": "Track and manage specialist referrals",
        "category": "Care Coordination",
        "status": "PUBLISHED",
    },
    {
        "name": "Test Workflow - Email",
        "description": "Testing email workflow integration",
        "category": "Testing",
        "status": "DRAFT",
    },
    {
        "name": "Chronic Disease Management",
        "description": "Monitor patients with chronic conditions",
        "category": "Patient Care",
        "status": "PUBLISHED",
    },
    {
        "name": "Vaccine Reminder Campaign",
        "description": "Send vaccine reminders to eligible patients",
        "category": "Patient Engagement",
        "status": "ARCHIVED",
    },
    {
        "name": "Telemedicine Workflow",
        "description": "Coordinate virtual visits",
        "category": "Patient Care",
        "status": "PUBLISHED",
    },
]

# Sample nodes and edges for workflows
SAMPLE_NODES = [
    {"id": "trigger-1", "type": "trigger", "data": {"label": "Manual Trigger"}},
    {"id": "action-1", "type": "action",
        "data": {"label": "Send Email", "service": "gmail"}},
    {"id": "action-2", "type": "action", "data": {"label": "Update Database"}},
]

SAMPLE_EDGES = [
    {"id": "e1", "source": "trigger-1", "target": "action-1"},
    {"id": "e2", "source": "action-1", "target": "action-2"},
]


async def create_user_if_not_exists(db):
    """Ensure the demo user exists."""
    user = await db.user.find_unique(where={"id": USER_ID})
    if not user:
        print(f"Creating demo user: {USER_ID}")
        user = await db.user.create(
            data={
                "id": USER_ID,
                "email": "demo@example.com",
                "name": "Demo User",
            }
        )
        print(f"✓ Created user: {user.email}")
    else:
        print(f"✓ User already exists: {user.email}")
    return user


async def create_workflows(db):
    """Create workflow definitions."""
    workflows = []

    print(f"\nCreating {len(WORKFLOW_TEMPLATES)} workflows...")

    for template in WORKFLOW_TEMPLATES:
        # Check if workflow already exists by name
        existing = await db.workflow.find_first(
            where={
                "userId": USER_ID,
                "name": template["name"],
            }
        )

        if existing:
            print(
                f"  - Workflow '{template['name']}' already exists, skipping...")
            workflows.append(existing)
            continue

        workflow = await db.workflow.create(
            data={
                "userId": USER_ID,
                "name": template["name"],
                "description": template["description"],
                "category": template["category"],
                "status": template["status"],
                "nodes": json.dumps(SAMPLE_NODES),
                "edges": json.dumps(SAMPLE_EDGES),
                "metadata": json.dumps({"auto_generated": True}),
                "publishedAt": datetime.now() if template["status"] == "PUBLISHED" else None,
            }
        )
        workflows.append(workflow)
        print(f"  ✓ Created: {workflow.name} ({workflow.status})")

    return workflows


async def create_executions(db, workflows):
    """Create workflow executions over time."""
    print(f"\nCreating executions for the past {DAYS_OF_DATA} days...")

    # Only create executions for PUBLISHED workflows
    active_workflows = [w for w in workflows if w.status == "PUBLISHED"]

    if not active_workflows:
        print("  ! No published workflows to create executions for")
        return []

    executions = []
    end_date = datetime.now()

    for day_offset in range(DAYS_OF_DATA):
        current_date = end_date - timedelta(days=DAYS_OF_DATA - day_offset - 1)
        num_executions = random.randint(*EXECUTIONS_PER_DAY_RANGE)

        print(
            f"  Day {day_offset + 1}/{DAYS_OF_DATA} ({current_date.strftime('%Y-%m-%d')}): {num_executions} executions")

        for _ in range(num_executions):
            # Pick a random workflow
            workflow = random.choice(active_workflows)

            # Random start time during the day
            hour = random.randint(0, 23)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            started_at = current_date.replace(
                hour=hour, minute=minute, second=second)

            # Determine execution status with weighted probability
            status_roll = random.random()
            if status_roll < 0.85:  # 85% success
                status = "SUCCESS"
                duration = random.uniform(0.5, 10.0)  # 0.5 to 10 seconds
                error = None
            elif status_roll < 0.95:  # 10% error
                status = "ERROR"
                duration = random.uniform(0.1, 5.0)
                error = random.choice([
                    "Connection timeout",
                    "Invalid credentials",
                    "Rate limit exceeded",
                    "Service unavailable",
                    "Validation error: missing required field",
                ])
            else:  # 5% other statuses
                status = random.choice(["QUEUED", "CANCELLED"])
                duration = random.uniform(
                    0.1, 2.0) if status == "CANCELLED" else None
                error = "User cancelled" if status == "CANCELLED" else None

            completed_at = started_at + \
                timedelta(seconds=duration) if duration else None

            # Create execution
            execution = await db.workflowexecution.create(
                data={
                    "workflowId": workflow.id,
                    "status": status,
                    "startedAt": started_at,
                    "completedAt": completed_at,
                    "error": error,
                    "logs": json.dumps([
                        {"timestamp": started_at.isoformat(
                        ), "message": "Execution started"},
                        {"timestamp": completed_at.isoformat() if completed_at else started_at.isoformat(),
                         "message": f"Execution {status.lower()}"},
                    ]),
                    "nodeResults": json.dumps({"trigger-1": {"status": "completed"}}),
                    "metadata": json.dumps({"auto_generated": True, "workflow_name": workflow.name}),
                }
            )
            executions.append(execution)

    print(f"✓ Created {len(executions)} total executions")
    return executions


async def print_summary(db):
    """Print summary of generated data."""
    print("\n" + "="*60)
    print("DATA GENERATION SUMMARY")
    print("="*60)

    # Count workflows by status
    total_workflows = await db.workflow.count(where={"userId": USER_ID})
    draft = await db.workflow.count(where={"userId": USER_ID, "status": "DRAFT"})
    published = await db.workflow.count(where={"userId": USER_ID, "status": "PUBLISHED"})
    paused = await db.workflow.count(where={"userId": USER_ID, "status": "PAUSED"})
    archived = await db.workflow.count(where={"userId": USER_ID, "status": "ARCHIVED"})

    print(f"\nWorkflows:")
    print(f"  Total:     {total_workflows}")
    print(f"  Published: {published}")
    print(f"  Draft:     {draft}")
    print(f"  Paused:    {paused}")
    print(f"  Archived:  {archived}")

    # Count executions by status
    total_executions = await db.workflowexecution.count(
        where={"workflow": {"is": {"userId": USER_ID}}}
    )
    success = await db.workflowexecution.count(
        where={"workflow": {"is": {"userId": USER_ID}}, "status": "SUCCESS"}
    )
    error = await db.workflowexecution.count(
        where={"workflow": {"is": {"userId": USER_ID}}, "status": "ERROR"}
    )

    success_rate = (success / total_executions *
                    100) if total_executions > 0 else 0

    print(f"\nExecutions:")
    print(f"  Total:        {total_executions}")
    print(f"  Successful:   {success} ({success_rate:.1f}%)")
    print(f"  Failed:       {error}")

    # Get date range
    oldest = await db.workflowexecution.find_first(
        where={"workflow": {"is": {"userId": USER_ID}}},
        order={"startedAt": "asc"}
    )
    newest = await db.workflowexecution.find_first(
        where={"workflow": {"is": {"userId": USER_ID}}},
        order={"startedAt": "desc"}
    )

    if oldest and newest:
        print(f"\nDate Range:")
        print(f"  From: {oldest.startedAt.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  To:   {newest.startedAt.strftime('%Y-%m-%d %H:%M:%S')}")

    print("\n" + "="*60)
    print(f"✓ Analytics endpoint ready!")
    print(f"  Test: GET /workflows/analytics?user_id={USER_ID}&days=7")
    print("="*60 + "\n")


async def main():
    """Main seeding function."""
    print("="*60)
    print("WORKFLOW ANALYTICS DATA SEEDER")
    print("="*60)

    async with prisma_session() as db:
        # Step 1: Create user
        await create_user_if_not_exists(db)

        # Step 2: Create workflows
        workflows = await create_workflows(db)

        # Step 3: Create executions
        await create_executions(db, workflows)

        # Step 4: Print summary
        await print_summary(db)


if __name__ == "__main__":
    asyncio.run(main())
