# Connector Action Selector Component Update

## Overview
Updated the `ConnectorActionSelector` component to dynamically display available actions for a selected connector when a workflow node is opened.

## Changes Made

### 1. **ConnectorActionSelector Component** (`frontend/app/dashboard/workflows/components/ConnectorActionSelector.tsx`)

#### New Features:
- **Service Type Filtering**: Component now accepts `serviceType` prop to filter integrations based on the connector type (e.g., "gmail", "epic", "pubmed")
- **Current Selection Display**: Shows which action is currently selected with visual indicators
- **Expandable Integration List**: Click on an integration to expand and see all available actions
- **Dynamic Action Loading**: Uses React Query hooks to fetch actions from the API when an integration is expanded
- **Action Parameters Preview**: Shows parameter badges with required field indicators (marked with *)

#### Props Interface:
```typescript
interface ConnectorActionSelectorProps {
    nodeId: string;
    serviceType?: string;           // NEW: Filter integrations by connector type
    currentSelection?: {            // NEW: Show current selection
        connectorId?: string;
        actionId?: string;
        integrationId?: string;
    };
    onSelect: (data: {
        connectorId: string;
        actionId: string;
        integrationId: string;
        connectorName: string;
        actionName: string;
        integrationName: string;
    }) => void;
}
```

#### Component Behavior:
1. **Load Integrations**: Fetches all integrations and filters by `serviceType` if provided
2. **Display Integration Cards**: Shows each integration with connector icon and name
3. **Expand on Click**: When clicked, expands to show all available actions for that connector
4. **Fetch Actions**: Dynamically fetches actions using `useConnectorActions` hook
5. **Action Selection**: Clicking an action calls `onSelect` callback with full details
6. **Visual Feedback**: 
   - Expanded integrations have blue border
   - Selected actions have green highlight with checkmark
   - Required parameters marked with asterisk

#### Example Actions for Gmail:
- Send Email
- List Messages
- Get Message
- Mark as Read

### 2. **Workflows Page** (`frontend/app/dashboard/workflows/page.tsx`)

Updated the `ConnectorActionSelector` usage to pass the required props:

```tsx
<ConnectorActionSelector
    nodeId={selectedNode.id}
    serviceType={selectedNode.data.serviceType}  // NEW
    currentSelection={{                          // NEW
        connectorId: selectedNode.data.config.connectorId,
        actionId: selectedNode.data.config.actionId,
        integrationId: selectedNode.data.config.integrationId,
    }}
    onSelect={(data) => handleConnectorActionSelect(selectedNode.id, data)}
/>
```

## User Experience Flow

1. **Open Node Configuration**: User clicks on a workflow node (e.g., Gmail node)
2. **See Available Integrations**: Component displays all Gmail integrations the user has created
3. **Expand Integration**: User clicks on an integration to see available actions
4. **View Actions**: All Gmail actions are displayed:
   - Send Email (with parameters: to, subject, body, cc, bcc)
   - Mark as Read (with parameter: message_id)
   - List Messages (with parameters: query, max_results)
   - Get Message (with parameter: message_id)
5. **Select Action**: User clicks on desired action
6. **Configure Parameters**: Node configuration updates to show relevant parameter fields

## Technical Details

### API Integration
- Uses `useConnectors()` to fetch all available connectors
- Uses `useIntegrations()` to fetch user's active integrations
- Uses `useConnectorActions(connectorId)` to fetch actions for a specific connector
- All data fetching is done with React Query for caching and loading states

### Loading States
- Shows spinner while loading connectors and integrations
- Shows spinner while fetching actions for expanded integration
- Graceful fallback if no integrations exist

### Error Handling
- Displays helpful message if no integrations found
- Suggests creating an integration if serviceType is specified
- Console error logging for failed API calls

## Benefits

1. **Dynamic Action Discovery**: Users see exactly what actions are available for their connectors
2. **Better UX**: Visual feedback with icons, badges, and selection indicators
3. **Scalable**: Works with any connector type (Gmail, Epic, PubMed, etc.)
4. **Type-Safe**: Full TypeScript support with proper interfaces
5. **Performance**: React Query caching prevents unnecessary API calls
6. **Accessible**: Clear visual hierarchy and actionable UI elements

## Testing Recommendations

1. Test with Gmail connector to see all 4 actions
2. Test with multiple integrations for the same connector
3. Test with no integrations (should show helpful message)
4. Test action selection persistence (should show checkmark on previously selected action)
5. Test parameter display for actions with different parameter counts
