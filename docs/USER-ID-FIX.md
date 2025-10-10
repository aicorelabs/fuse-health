# User ID Consistency Fix

## Issue
Workflows created by the seed script were not showing up on the workflow list page.

## Root Cause
**User ID Mismatch**: The frontend was using different user IDs across various pages:
- Workflow list page: `"demo-user"`
- Workflow creation page: `"demo-user"`
- MCP configuration: `"demo-user"`
- Connections: `"demo-user"`

But the seed script created data for: `"user_demo_001"`

## Solution
Updated all frontend pages to use the consistent user ID: **`user_demo_001`**

## Files Changed

### 1. `/frontend/app/dashboard/workflows/list/page.tsx`
**Changed**: User ID from `"demo-user"` to `"user_demo_001"`
```typescript
// Before
const userId = "demo-user";

// After  
const userId = "user_demo_001";
```

### 2. `/frontend/app/dashboard/workflows/page.tsx`
**Changed**: User ID in workflow creation
```typescript
// Before
user_id: "demo-user"

// After
user_id: "user_demo_001"
```

### 3. `/frontend/app/dashboard/mcp-configuration/page.tsx`
**Changed**: Demo user constant
```typescript
// Before
const DEMO_USER_ID = "demo-user";

// After
const DEMO_USER_ID = "user_demo_001";
```

### 4. `/frontend/app/dashboard/connections/components/AddConnectionModal.tsx`
**Changed**: User ID in OAuth flow
```typescript
// Before
user_id: "demo-user"

// After
user_id: "user_demo_001"
```

## Why This User ID?
The user ID `user_demo_001` was chosen because:
1. It matches the seed script that generates test data
2. It follows a consistent naming convention
3. It's used across all backend test data

## Testing
After this fix:
1. ✅ Workflows show up on `/dashboard/workflows/list`
2. ✅ Can create new workflows
3. ✅ Can execute workflows
4. ✅ Can manage connections
5. ✅ MCP configuration works

## Data in Database
The seed script created:
- **User**: `user_demo_001` (email: demo@example.com)
- **15 Workflows**: All owned by `user_demo_001`
- **236 Executions**: All linked to those workflows

Now the frontend queries match the backend data!

## Future Improvement
TODO: Replace hardcoded user IDs with actual authentication:
```typescript
// Current (hardcoded)
const userId = "user_demo_001";

// Future (from auth context)
const { user } = useAuth();
const userId = user.id;
```

This should be implemented when adding proper authentication (e.g., with Clerk, Auth0, or similar).

## Verification Commands

### Check workflows in database:
```bash
cd backend && source .venv/bin/activate
python -m scripts.verify_workflow_data
```

### Test API directly:
```bash
curl "http://localhost:8000/workflows?user_id=user_demo_001"
```

### Check frontend:
1. Navigate to: http://localhost:3000/dashboard/workflows/list
2. You should now see all 15 workflows!

## Related Files
- Seed script: `/backend/scripts/seed_workflow_analytics_data.py`
- Verify script: `/backend/scripts/verify_workflow_data.py`
- User creation: `/backend/src/app/services/database.py`

All systems now use **`user_demo_001`** consistently! ✅
