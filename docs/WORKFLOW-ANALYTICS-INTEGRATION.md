# Workflow Analytics Integration

## Overview
This document describes the workflow analytics feature that was added to the Fuse Health platform, similar to the existing MCP analytics dashboard.

## Backend Implementation

### 1. Analytics Controller
**File**: `backend/src/app/controllers/workflow_analytics_controller.py`

The controller provides comprehensive workflow analytics including:
- **Overview Metrics**:
  - Total workflows (active, draft, etc.)
  - Total executions in the time period
  - Success rate percentage
  - Average execution time
  
- **Time Series Data**:
  - Daily execution trends (success, error, running counts)
  
- **Workflow Performance**:
  - Execution counts per workflow
  - Success/error rates per workflow
  
- **Distributions**:
  - Category distribution (workflow categories)
  - Status distribution (DRAFT, PUBLISHED, PAUSED, ARCHIVED)
  - Execution status distribution (SUCCESS, ERROR, RUNNING, QUEUED, CANCELLED)
  
- **Recent Activity**:
  - Last 10 executions with details

### 2. Analytics Routes
**File**: `backend/src/app/views/workflow_analytics_routes.py`

- **Endpoint**: `GET /workflows/analytics`
- **Query Parameters**:
  - `user_id` (required): User ID to get analytics for
  - `days` (optional, default: 7): Number of days to include (1-90)
- **Response**: Comprehensive analytics object

### 3. Main App Integration
**File**: `backend/src/app/main.py`

Added workflow analytics routes to the FastAPI application:
```python
from .views import workflow_analytics_routes
app.include_router(workflow_analytics_routes.router)
```

## Frontend Implementation

### 1. Analytics Page
**File**: `frontend/app/dashboard/workflow-analytics/page.tsx`

A comprehensive dashboard featuring:

#### Key Metrics Cards
- Total Workflows (with active count)
- Total Executions (in selected period)
- Success Rate (with quality indicator)
- Average Execution Time

#### Visualizations

1. **Daily Execution Trend** (Area Chart)
   - Shows successful vs failed executions over time
   - Helps identify execution patterns and issues

2. **Status Distribution** (Pie Chart)
   - Shows breakdown of execution statuses
   - Helps understand current execution state

3. **Category Mix** (Pie Chart)
   - Shows distribution of workflows by category
   - Helps understand workflow organization

4. **Top Workflows** (Bar Chart)
   - Shows most frequently executed workflows
   - Helps identify heavily used workflows

5. **Recent Executions** (List)
   - Shows last 6 executions with status and duration
   - Provides quick view of recent activity

### 2. API Integration
**File**: `frontend/lib/api/endpoints.ts`

Added:
- `WorkflowAnalyticsResponse` TypeScript interface
- `fetchWorkflowAnalytics()` function

**File**: `frontend/lib/api/workflow-queries.ts`

Added:
- `workflowKeys.analytics()` query key
- `useWorkflowAnalytics()` React Query hook

### 3. Navigation
**File**: `frontend/components/dashboard/sidebar-nav.tsx`

Added "Workflow analytics" navigation item:
- Icon: TrendingUp
- Route: `/dashboard/workflow-analytics`
- Description: "Track execution trends and performance"

## Features

### Backend Features
- ✅ Configurable time range (1-90 days)
- ✅ Comprehensive metrics calculation
- ✅ Time series data for trends
- ✅ Workflow-level performance tracking
- ✅ Category and status distributions
- ✅ Recent execution history

### Frontend Features
- ✅ Responsive dashboard layout
- ✅ Real-time data fetching with React Query
- ✅ Interactive charts using Recharts
- ✅ Loading and error states
- ✅ Custom tooltips for chart data
- ✅ Consistent design with MCP analytics
- ✅ Status-based color coding
- ✅ Execution duration display

## Data Flow

1. **User visits** `/dashboard/workflow-analytics`
2. **Frontend calls** `useWorkflowAnalytics(userId, days)`
3. **React Query fetches** from `GET /workflows/analytics?user_id={userId}&days={days}`
4. **Backend queries** Prisma database for:
   - Workflows owned by user
   - Executions in date range
   - Aggregated metrics
5. **Backend returns** comprehensive analytics object
6. **Frontend renders** visualizations and metrics

## Database Queries

The analytics controller performs the following database operations:
- `workflow.find_many()` - Get all user workflows with executions
- `workflowexecution.find_many()` - Get executions in date range
- Aggregations performed in Python for:
  - Status counts
  - Success rates
  - Average execution times
  - Daily groupings

## Performance Considerations

- Queries are scoped to specific user
- Date range limits amount of data processed
- Indexes on:
  - `workflows.userId`
  - `workflows.status`
  - `workflowexecution.workflowId`
  - `workflowexecution.status`
  - `workflowexecution.startedAt`

## Future Enhancements

Potential improvements:
- [ ] Add caching for frequently accessed analytics
- [ ] Export functionality for reports
- [ ] Period comparison (week over week)
- [ ] Real-time updates using WebSockets
- [ ] Custom date range selection
- [ ] Drill-down into specific workflows
- [ ] Performance benchmarking across workflows
- [ ] Error pattern analysis
- [ ] Execution time percentiles (p50, p95, p99)
- [ ] Resource usage tracking

## Testing

To test the implementation:

1. **Start Backend**:
   ```bash
   cd backend
   uv run uvicorn src.app.main:app --reload
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to**: http://localhost:3000/dashboard/workflow-analytics

4. **Verify**:
   - Metrics display correctly
   - Charts render properly
   - Data updates when changing parameters
   - Error states work
   - Loading states work

## API Example

### Request
```
GET /workflows/analytics?user_id=user_demo_001&days=7
```

### Response
```json
{
  "overview": {
    "total_workflows": 12,
    "active_workflows": 8,
    "draft_workflows": 3,
    "total_executions": 145,
    "success_rate": 94.48,
    "avg_execution_time": 2.34
  },
  "daily_executions": [...],
  "workflow_execution_counts": [...],
  "category_distribution": [...],
  "status_distribution": [...],
  "execution_status_distribution": [...],
  "recent_executions": [...],
  "date_range": {
    "start": "2025-10-03T12:00:00Z",
    "end": "2025-10-10T12:00:00Z",
    "days": 7
  }
}
```

## Files Modified/Created

### Backend
- ✅ Created: `backend/src/app/controllers/workflow_analytics_controller.py`
- ✅ Created: `backend/src/app/views/workflow_analytics_routes.py`
- ✅ Modified: `backend/src/app/main.py`

### Frontend
- ✅ Created: `frontend/app/dashboard/workflow-analytics/page.tsx`
- ✅ Modified: `frontend/lib/api/endpoints.ts`
- ✅ Modified: `frontend/lib/api/workflow-queries.ts`
- ✅ Modified: `frontend/components/dashboard/sidebar-nav.tsx`

## Summary

The workflow analytics feature provides comprehensive insights into workflow usage and performance, matching the style and functionality of the existing MCP analytics dashboard. It enables users to:
- Monitor workflow execution trends
- Identify performance bottlenecks
- Track success rates
- Understand usage patterns
- Make data-driven decisions about workflow optimization
