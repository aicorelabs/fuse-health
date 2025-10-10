# Workflow Builder API Integration

## Overview
Integrated the visual workflow builder canvas with the backend API to enable loading existing workflows via URL parameters and saving workflows to the database.

## Implementation Date
October 10, 2025

## Changes Made

### 1. File Modified
**Path**: `/frontend/app/dashboard/workflows/page.tsx`

### 2. Key Features Implemented

#### A. URL Parameter Support
- Added `useSearchParams()` to read workflow ID from URL query parameter (`?id=xxx`)
- Workflow builder now supports two modes:
  - **Create mode**: No ID in URL → blank canvas
  - **Edit mode**: ID in URL → loads existing workflow from API

#### B. API Integration
- **Load workflow**: Uses `useWorkflow(workflowId)` hook to fetch workflow data from backend
- **Create workflow**: Uses `useCreateWorkflow()` mutation to create new workflows
- **Update workflow**: Uses `useUpdateWorkflow()` mutation to save changes
- **Publish workflow**: Uses `usePublishWorkflow()` mutation to publish workflows

#### C. Data Transformation
Added helper functions to map between API format and frontend UI format:

```typescript
// Map API node types to UI properties
- getNodeCategory(apiType) → converts to trigger/data/logic/ai/action
- getAccentForNodeType(apiType) → returns color accent (violet/green/aqua/etc)
- getIconForNodeType(apiType) → returns Lucide icon component
- getChipTextForNodeType(apiType) → returns display text (Trigger/Action/Logic/AI)
- getApiNodeType(chipText) → reverse mapping for save operations
```

#### D. State Management Refactoring
- Removed hardcoded `initialFlows` and `activeFlowId` concept
- Simplified to single workflow state:
  - `nodes` - FlowNode[] for React Flow canvas
  - `edgesRaw` - FlowEdge[] for connections
  - `workflowName` - editable workflow name
  - `workflowDescription` - editable description
  - `workflowId` - current workflow ID (null for new workflows)

#### E. UI Enhancements
- **Back button**: Navigate to workflows list
- **Editable workflow name**: Inline text input in header
- **Editable description**: Inline text input below name
- **Save button**: 
  - Shows "Create" for new workflows
  - Shows "Save" for existing workflows
  - Displays "Saving..." during save operation
- **Publish button**:
  - Disabled until workflow is saved
  - Validates workflow before publishing
  - Shows error count badge if validation fails
- **Loading state**: Shows spinner when loading workflow from API

#### F. Workflow Conversion Logic

**Loading workflow (API → UI format)**:
```typescript
// Convert API WorkflowNode to FlowNode
const flowNodes: FlowNode[] = loadedWorkflow.nodes.map((node) => ({
  id: node.id,
  type: "step",
  position: node.position,
  data: {
    label: node.data.label,
    subtitle: node.data.serviceType || "Configure this step",
    accent: getAccentForNodeType(node.type),
    icon: getIconForNodeType(node.type),
    chipText: getChipTextForNodeType(node.type),
    helperText: "Select to configure",
    config: node.data.config || {},
    configFields: [],
    connectors: getDefaultConnectors(node.id, getNodeCategory(node.type)),
  },
}));
```

**Saving workflow (UI → API format)**:
```typescript
// Convert FlowNode to API WorkflowNode
const apiNodes: WorkflowNode[] = nodes.map((node) => ({
  id: node.id,
  type: getApiNodeType(node.data.chipText || "Action") as NodeType,
  position: node.position,
  data: {
    label: node.data.label,
    serviceType: node.data.subtitle !== "Configure this step" 
      ? node.data.subtitle 
      : undefined,
    config: node.data.config,
  },
}));
```

### 3. Callback Functions Updated

All callback functions refactored to work with simplified state:
- `handleInsertNode()` - Insert node between existing nodes
- `onNodesChange()` - Handle node position/selection changes
- `onEdgesChange()` - Handle edge creation/deletion
- `onConnect()` - Handle new connections
- `updateNodeConfig()` - Update node configuration
- `addNodeFromTemplate()` - Add new node from template palette
- `simulateExecution()` - Run simulation with current nodes/edges

### 4. User Flows

#### Creating a New Workflow
1. Navigate to `/dashboard/workflows` (no URL params)
2. Builder shows blank canvas
3. Add nodes from template palette
4. Configure nodes in right sidebar
5. Click "Create" button
6. Workflow saved to database, URL updates with ID
7. Continue editing or click "Publish"

#### Editing an Existing Workflow
1. Navigate to `/dashboard/workflows?id={workflow_id}`
2. Workflow data loads from API
3. Canvas shows existing nodes and connections
4. Make changes (add/remove/configure nodes)
5. Click "Save" to persist changes
6. Click "Publish" to make workflow active

#### Workflow List Integration
- List page (`/dashboard/workflows/list`) has "Edit" buttons
- Clicking "Edit" navigates to builder with ID param
- Builder "Back" button returns to list

## Technical Details

### Dependencies
- `useSearchParams` from `next/navigation` - URL param reading
- `useRouter` from `next/navigation` - Programmatic navigation
- React Query hooks from `@/lib/api/workflow-queries`
- Workflow types from `@/lib/api/workflows`

### State Initialization
```typescript
const searchParams = useSearchParams();
const workflowId = searchParams.get("id");
const { data: loadedWorkflow, isLoading } = useWorkflow(workflowId || "");

useEffect(() => {
  if (loadedWorkflow) {
    // Convert and load workflow data into canvas
    setWorkflowName(loadedWorkflow.name);
    setWorkflowDescription(loadedWorkflow.description || "");
    setNodes(convertedNodes);
    setEdgesRaw(convertedEdges);
  }
}, [loadedWorkflow]);
```

### Save Operation
```typescript
const handleSave = async () => {
  const { apiNodes, apiEdges } = convertToApiFormat();
  
  if (workflowId) {
    // Update existing
    await updateWorkflow.mutateAsync({
      workflowId,
      payload: { name, description, nodes: apiNodes, edges: apiEdges }
    });
  } else {
    // Create new
    const newWorkflow = await createWorkflow.mutateAsync({
      user_id: "user_demo_001",
      name, description, nodes: apiNodes, edges: apiEdges
    });
    router.push(`/dashboard/workflows?id=${newWorkflow.id}`);
  }
};
```

### Publish Operation
```typescript
const handlePublish = async () => {
  if (!workflowId) {
    alert("Please save the workflow first");
    return;
  }
  
  if (!validation.isValid) {
    alert(`Cannot publish: ${validation.errors.join(", ")}`);
    return;
  }
  
  await handleSave(); // Save first
  await publishWorkflow.mutateAsync(workflowId);
};
```

## Testing Checklist

- [ ] Navigate to `/dashboard/workflows` without ID → blank canvas
- [ ] Add nodes to blank canvas
- [ ] Configure node properties in sidebar
- [ ] Click "Create" → workflow saved, URL updates
- [ ] Make changes and click "Save" → changes persisted
- [ ] Click "Publish" → workflow published
- [ ] Navigate to `/dashboard/workflows?id={id}` → workflow loads
- [ ] Edit loaded workflow → changes save correctly
- [ ] Click "Back" button → returns to workflows list
- [ ] Edit workflow from list page → opens in builder

## API Endpoints Used

- `GET /workflows/{workflow_id}` - Load workflow
- `POST /workflows` - Create workflow
- `PUT /workflows/{workflow_id}` - Update workflow
- `POST /workflows/{workflow_id}/publish` - Publish workflow

## React Query Cache Management

- Cache automatically invalidated after mutations
- Workflow list updates when workflow saved/published
- Optimistic updates not implemented (could be added)

## Future Enhancements

1. **Auto-save**: Implement debounced auto-save on node/edge changes
2. **Undo/Redo**: Add undo/redo functionality for canvas changes
3. **Version History**: Implement workflow versioning
4. **Real-time Collaboration**: Add WebSocket for multi-user editing
5. **Workflow Templates**: Add pre-built workflow templates
6. **Copy/Paste**: Support copying workflows or workflow sections
7. **Keyboard Shortcuts**: Add keyboard shortcuts for common actions
8. **Drag-and-Drop**: Improve node template drag-and-drop UX

## Known Limitations

1. User ID is hardcoded as "user_demo_001" (need auth context)
2. No conflict resolution for concurrent edits
3. No workflow preview before publish
4. Limited validation feedback in UI
5. No recovery for failed save operations

## Related Files

- `/frontend/lib/api/workflows.ts` - API client
- `/frontend/lib/api/workflow-queries.ts` - React Query hooks
- `/frontend/app/dashboard/workflows/list/page.tsx` - Workflows list
- `/frontend/app/dashboard/workflows/[id]/page.tsx` - Workflow detail
- `/backend/src/app/views/workflow_routes.py` - API endpoints
- `/backend/src/app/services/workflow_service.py` - Backend service

## Summary

The workflow builder is now fully integrated with the backend API, supporting both creating new workflows and editing existing ones. The implementation provides a smooth user experience with proper loading states, validation, and error handling. The builder maintains the visual polish of the original design while adding robust data persistence capabilities.
