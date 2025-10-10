# Workflow Analytics Data Preparation

This directory contains scripts to prepare and verify data for the workflow analytics dashboard.

## Overview

The workflow analytics dashboard requires:
- Workflow records with various statuses (DRAFT, PUBLISHED, PAUSED, ARCHIVED)
- Workflow executions with different outcomes (SUCCESS, ERROR, RUNNING, etc.)
- Historical data spanning multiple days for trend visualization

## Scripts

### 1. Seed Data Script
**File**: `seed_workflow_analytics_data.py`

Creates realistic test data for the analytics dashboard:
- 15 diverse workflows across different categories
- 5-25 executions per day over 14 days
- ~85% success rate, ~10% error rate, ~5% other statuses
- Realistic execution durations (0.5-10 seconds)

**Usage**:
```bash
cd backend
python -m scripts.seed_workflow_analytics_data
```

**What it creates**:
- Demo user (`user_demo_001`)
- 15 workflows with categories:
  - Patient Care
  - Clinical Workflows
  - Patient Engagement
  - Administrative
  - Care Coordination
  - Analytics
  - Medication Management
  - Testing
- 100-350 executions spread over 14 days
- Various execution statuses with realistic error messages

### 2. Verification Script
**File**: `verify_workflow_data.py`

Checks existing data and shows what the analytics endpoint will return.

**Usage**:
```bash
cd backend
python -m scripts.verify_workflow_data
```

**What it shows**:
- User verification
- List of workflows with status distribution
- Recent executions with details
- Date range coverage
- Preview of analytics metrics

## Quick Start

### Step 1: Seed the Database
```bash
cd backend
python -m scripts.seed_workflow_analytics_data
```

Expected output:
```
==============================================================
WORKFLOW ANALYTICS DATA SEEDER
==============================================================

✓ User already exists: demo@example.com

Creating 15 workflows...
  ✓ Created: Patient Intake Automation (PUBLISHED)
  ✓ Created: Lab Results Notification (PUBLISHED)
  ...

Creating executions for the past 14 days...
  Day 1/14 (2025-09-27): 15 executions
  Day 2/14 (2025-09-28): 18 executions
  ...
✓ Created 245 total executions

==============================================================
DATA GENERATION SUMMARY
==============================================================

Workflows:
  Total:     15
  Published: 11
  Draft:     1
  Paused:    1
  Archived:  2

Executions:
  Total:        245
  Successful:   208 (84.9%)
  Failed:       25

Date Range:
  From: 2025-09-27 08:15:30
  To:   2025-10-10 23:45:12

==============================================================
✓ Analytics endpoint ready!
  Test: GET /workflows/analytics?user_id=user_demo_001&days=7
==============================================================
```

### Step 2: Verify the Data
```bash
cd backend
python -m scripts.verify_workflow_data
```

### Step 3: Test the Analytics Endpoint

#### Using curl:
```bash
curl "http://localhost:8000/workflows/analytics?user_id=user_demo_001&days=7"
```

#### Using the Frontend:
1. Start the backend: `cd backend && uvicorn src.app.main:app --reload`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to: `http://localhost:3000/dashboard/workflow-analytics`

## Data Structure

### Workflows
Each workflow includes:
```json
{
  "id": "clx...",
  "userId": "user_demo_001",
  "name": "Patient Intake Automation",
  "description": "Automate patient intake forms and scheduling",
  "status": "PUBLISHED",
  "category": "Patient Care",
  "nodes": [...],
  "edges": [...],
  "metadata": {"auto_generated": true},
  "createdAt": "2025-10-01T12:00:00Z",
  "publishedAt": "2025-10-01T12:00:00Z"
}
```

### Executions
Each execution includes:
```json
{
  "id": "clx...",
  "workflowId": "clx...",
  "status": "SUCCESS",
  "startedAt": "2025-10-10T14:30:00Z",
  "completedAt": "2025-10-10T14:30:03.5Z",
  "error": null,
  "logs": [
    {"timestamp": "...", "message": "Execution started"},
    {"timestamp": "...", "message": "Execution success"}
  ],
  "nodeResults": {"trigger-1": {"status": "completed"}},
  "metadata": {"auto_generated": true, "workflow_name": "..."}
}
```

## Analytics Endpoint Response

The `/workflows/analytics` endpoint returns:

```json
{
  "overview": {
    "total_workflows": 15,
    "active_workflows": 11,
    "draft_workflows": 1,
    "total_executions": 142,
    "success_rate": 84.5,
    "avg_execution_time": 3.24
  },
  "daily_executions": [
    {"date": "2025-10-04", "total": 20, "success": 17, "error": 2, "running": 0},
    {"date": "2025-10-05", "total": 23, "success": 19, "error": 3, "running": 0},
    ...
  ],
  "workflow_execution_counts": [
    {"workflow_id": "...", "workflow_name": "Patient Intake Automation", "executions": 45, "success": 38, "error": 5},
    ...
  ],
  "category_distribution": [
    {"category": "Patient Care", "count": 5},
    {"category": "Clinical Workflows", "count": 2},
    ...
  ],
  "status_distribution": [
    {"status": "PUBLISHED", "count": 11},
    {"status": "DRAFT", "count": 1},
    ...
  ],
  "execution_status_distribution": [
    {"status": "SUCCESS", "count": 120},
    {"status": "ERROR", "count": 15},
    ...
  ],
  "recent_executions": [...]
}
```

## Customization

### Adjust Data Generation

Edit `seed_workflow_analytics_data.py`:

```python
# Configuration
USER_ID = "user_demo_001"          # Change user ID
DAYS_OF_DATA = 14                  # Days of historical data
NUM_WORKFLOWS = 15                 # Number of workflows
EXECUTIONS_PER_DAY_RANGE = (5, 25) # Min-max executions per day
```

### Add Custom Workflows

Add to `WORKFLOW_TEMPLATES` in the seed script:

```python
{
    "name": "My Custom Workflow",
    "description": "Description here",
    "category": "Custom Category",
    "status": "PUBLISHED",  # or DRAFT, PAUSED, ARCHIVED
}
```

### Adjust Success Rate

Modify the status probability in `create_executions()`:

```python
if status_roll < 0.85:  # 85% success (adjust this)
    status = "SUCCESS"
elif status_roll < 0.95:  # 10% error (adjust this)
    status = "ERROR"
```

## Troubleshooting

### Error: User not found
Run the seed script first to create the demo user.

### Error: No data in analytics
1. Verify data exists: `python -m scripts.verify_workflow_data`
2. Check the date range - data is generated for the past 14 days
3. Ensure backend is running: `uvicorn src.app.main:app --reload`

### Error: Database connection failed
1. Check `DATABASE_URL` in your `.env` file
2. Ensure PostgreSQL is running
3. Run migrations: `prisma migrate dev`

## Production Considerations

For production use:
1. Remove the seed scripts or move to a test environment
2. Implement real workflow execution tracking
3. Add data retention policies
4. Consider archiving old executions
5. Add indexes for performance:
   - `workflow_executions.startedAt`
   - `workflow_executions.status`
   - `workflows.userId` and `workflows.status`

## Next Steps

After seeding data:
1. ✅ Test the analytics endpoint
2. ✅ View the frontend dashboard
3. ✅ Verify all charts render correctly
4. ✅ Test different time ranges (7, 14, 30 days)
5. ✅ Check performance with larger datasets

## Support

If you encounter issues:
1. Check the verification script output
2. Review backend logs for errors
3. Inspect the database directly using Prisma Studio: `npx prisma studio`
