# Backend Node Types Integration

## Overview
Integrated the workflow builder to dynamically fetch available node types from the backend API instead of using hardcoded templates. This ensures the frontend always displays the exact node types supported by the backend execution engine.

## Implementation Date
October 10, 2025

## Changes Made

### 1. Backend Changes

#### A. New API Endpoint
**File**: `/backend/src/app/views/workflow_routes.py`

Added `GET /workflows/node-types` endpoint that returns available node types organized by category:

```python
@router.get("/node-types")
async def get_node_types():
    """Get available node types and their configurations."""
    return {
        "trigger": [
            {
                "id": "manual-trigger",
                "label": "Manual Trigger",
                "description": "Start workflow manually",
                "category": "trigger",
                "fields": [...]
            },
            # ... more triggers
        ],
        "action": [...],  # Gmail, Slack, HTTP, etc.
        "data": [...],    # Google Sheets, Database, etc.
        "logic": [...],   # Condition, Transform, Loop, Delay
        "ai": [...],      # OpenAI, Anthropic, etc.
    }
```

#### B. Node Type Definitions
The endpoint returns node types with the following information:
- `id` - Unique identifier (e.g., "gmail-action", "openai-chat")
- `label` - Display name (e.g., "Gmail", "OpenAI Chat")
- `description` - Brief description of what the node does
- `category` - One of: trigger, action, data, logic, ai
- `service_type` - Optional service identifier (e.g., "gmail", "openai")
- `fields` - Array of configuration fields with validation rules

### 2. Frontend Changes

#### A. API Client Updates
**File**: `/frontend/lib/api/workflows.ts`

Added types and API function:

```typescript
export interface NodeTypeField {
    id: string;
    label: string;
    type: "text" | "email" | "number" | "textarea";
    required?: boolean;
    placeholder?: string;
}

export interface NodeTypeDefinition {
    id: string;
    label: string;
    description: string;
    category: "trigger" | "action" | "data" | "logic" | "ai";
    service_type?: string;
    fields: NodeTypeField[];
}

export interface NodeTypesResponse {
    trigger: NodeTypeDefinition[];
    action: NodeTypeDefinition[];
    data: NodeTypeDefinition[];
    logic: NodeTypeDefinition[];
    ai: NodeTypeDefinition[];
}

export function getNodeTypes(options?: RequestOptions) {
    return request<NodeTypesResponse>(`/workflows/node-types`, undefined, options);
}
```

#### B. React Query Hook
**File**: `/frontend/lib/api/workflow-queries.ts`

```typescript
export function useNodeTypes(options?: UseQueryOptions<NodeTypesResponse>) {
    return useQuery({
        queryKey: workflowKeys.nodeTypes(),
        queryFn: () => workflowsApi.getNodeTypes(),
        staleTime: 1000 * 60 * 60, // 1 hour - node types don't change often
        ...options,
    });
}
```

#### C. Workflow Builder Updates
**File**: `/frontend/app/dashboard/workflows/page.tsx`

**1. Added Helper Functions:**

```typescript
// Map category to accent colors
function getAccentForCategory(category: string): keyof typeof accentStyles {
    const accentMap = {
        trigger: "violet",
        action: "blue",
        data: "green",
        logic: "aqua",
        ai: "pink",
    };
    return accentMap[category] || "blue";
}

// Map category to icons
function getIconForCategory(category: string): LucideIcon {
    const iconMap = {
        trigger: Clock3,
        action: Mail,
        data: Table,
        logic: Filter,
        ai: Sparkles,
    };
    return iconMap[category] || Settings;
}

// Map category to chip text
function getChipTextForCategory(category: string): string {
    const chipMap = {
        trigger: "Trigger",
        action: "Action",
        data: "Data",
        logic: "Logic",
        ai: "AI",
    };
    return chipMap[category] || "Action";
}
```

**2. Fetch Node Types:**

```typescript
// Load node types from backend
const { data: nodeTypesData, isLoading: isLoadingNodeTypes } = useNodeTypes();
```

**3. Dynamic Template Conversion:**

Updated `addNodeFromTemplate()` to:
- First check if node type exists in backend data
- Convert backend `NodeTypeDefinition` to frontend `NodeTemplate` format
- Fall back to local templates if backend data unavailable
- Map field types (convert "number" to "text" for compatibility)

**4. Dynamic Sidebar Rendering:**

The node template sidebar now:
- Shows loading spinner while fetching node types
- Renders backend node types when available
- Falls back to local templates if backend fails
- Groups nodes by category (trigger, data, logic, ai, action)
- Shows service type if available
- Uses dynamic icons and colors based on category

## Benefits

### 1. Single Source of Truth
- Backend defines what nodes are available
- No more sync issues between frontend templates and backend execution
- New node types automatically appear in UI when added to backend

### 2. Dynamic Configuration
- Field definitions come from backend
- Validation rules defined in one place
- Easy to add new node types without frontend changes

### 3. Service Integration
- Backend can dynamically add/remove service integrations
- Node availability can be based on user permissions
- Future: Node types could be user-specific or tenant-specific

### 4. Better Maintainability
- One place to update when adding new nodes
- Reduces code duplication
- Type safety maintained across stack

## Architecture

```
┌─────────────────────────────────────────────┐
│ Backend API                                  │
│  GET /workflows/node-types                   │
│    ↓                                        │
│  Returns: Node Type Definitions             │
│   - trigger, action, data, logic, ai        │
│   - With fields and validation rules        │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTP Request
                   ↓
┌─────────────────────────────────────────────┐
│ Frontend API Client (workflows.ts)           │
│  getNodeTypes()                              │
│    ↓                                        │
│  React Query Hook (workflow-queries.ts)     │
│    useNodeTypes()                           │
│      - Caches for 1 hour                    │
│      - Auto-refetches on stale              │
└──────────────────┬──────────────────────────┘
                   │
                   │ Data Flow
                   ↓
┌─────────────────────────────────────────────┐
│ Workflow Builder (page.tsx)                 │
│  1. Fetches node types on mount             │
│  2. Converts to NodeTemplate format         │
│  3. Renders in sidebar                      │
│  4. Creates nodes from backend definitions  │
└─────────────────────────────────────────────┘
```

## Node Type Categories

### Trigger (Violet)
- Manual Trigger
- Schedule Trigger
- Webhook Trigger
- Event Trigger (EHR events)

### Action (Blue)
- Gmail - Send emails
- Slack - Send messages
- HTTP Request - API calls

### Data (Green)
- Google Sheets - Read/write spreadsheets
- Database Query - SQL queries

### Logic (Aqua)
- Condition - Branch based on conditions
- Transform - Map/filter/aggregate data
- Loop - Iterate over items
- Delay - Wait for specified time

### AI (Pink)
- OpenAI Chat - ChatGPT text generation
- Anthropic Claude - Claude text generation

## Field Types

Backend supports these field types:
- `text` - Single line text input
- `email` - Email address input
- `number` - Numeric input
- `textarea` - Multi-line text input

Frontend maps these to:
- `text` - For text and number inputs
- `email` - For email inputs
- `textarea` - For multi-line inputs
- `multi` - For complex inputs (future)

## Configuration Fields

Each node type defines its configuration fields:

```typescript
{
    id: "to",                           // Field identifier
    label: "To",                        // Display label
    type: "email",                      // Input type
    required: true,                     // Validation
    placeholder: "user@example.com"     // Hint text
}
```

## Fallback Behavior

The system has three layers of resilience:

1. **Primary**: Backend node types via API
2. **Secondary**: Cached node types (1 hour stale time)
3. **Tertiary**: Local hardcoded templates (`nodeTemplates` from constants)

If backend is unreachable:
- React Query returns cached data if available
- If no cache, renders local templates
- User can still build workflows with local templates

## Testing

### 1. Test Backend Endpoint

```bash
curl http://localhost:8000/workflows/node-types | jq
```

Expected: JSON object with trigger, action, data, logic, and ai arrays.

### 2. Test Frontend Integration

1. Open workflow builder: http://localhost:3000/dashboard/workflows
2. Check right sidebar "Add Node" section
3. Verify nodes are loading from backend (check Network tab)
4. Verify all 5 categories render (trigger, data, logic, ai, action)
5. Click on a node type to add it to canvas

### 3. Test Fallback

1. Stop backend server
2. Refresh workflow builder
3. Should still show nodes (from cache or local templates)
4. Can still add nodes to canvas

### 4. Test New Node Type

1. Add new node definition to backend `/workflows/node-types`
2. Restart backend
3. Refresh frontend (or wait for cache to expire)
4. New node should appear in sidebar

## Future Enhancements

### 1. Dynamic Icons
Load icons from backend or use icon names to dynamically select

### 2. Permission-Based Nodes
Filter available nodes based on user permissions or subscription tier

### 3. Custom Node Types
Allow users/organizations to define custom node types

### 4. Node Marketplace
Public registry of community-contributed node types

### 5. Version Management
Support multiple versions of the same node type

### 6. Real-time Updates
WebSocket updates when new node types are deployed

### 7. Node Documentation
Link to detailed docs for each node type

### 8. Visual Node Editor
Backend UI to manage available node types

## Performance Considerations

- **Cache Strategy**: 1-hour stale time reduces API calls
- **Lazy Loading**: Node types only fetched when builder opens
- **Optimistic Rendering**: Show UI while loading
- **Error Boundaries**: Graceful degradation if API fails

## Migration Notes

### Existing Workflows
- Existing workflows continue to work
- Node type IDs remain stable
- Configuration fields backward compatible

### Adding New Nodes
1. Add to backend `/workflows/node-types` endpoint
2. Implement execution logic in `workflow_execution_service.py`
3. No frontend changes needed (auto-discovers)

### Removing Nodes
1. Mark as deprecated in backend
2. Add migration path for existing workflows
3. Eventually remove from endpoint

## Related Files

- `/backend/src/app/views/workflow_routes.py` - Node types endpoint
- `/frontend/lib/api/workflows.ts` - API client types
- `/frontend/lib/api/workflow-queries.ts` - React Query hooks
- `/frontend/app/dashboard/workflows/page.tsx` - Builder component
- `/frontend/app/dashboard/workflows/components/constants.ts` - Local fallback templates

## Summary

The workflow builder now dynamically fetches available node types from the backend, ensuring perfect synchronization between what the UI shows and what the backend can execute. This architecture is more maintainable, scalable, and sets the foundation for advanced features like custom node types and permission-based filtering.
