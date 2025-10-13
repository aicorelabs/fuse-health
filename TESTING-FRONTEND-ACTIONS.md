# Testing the Frontend Integration

## Quick Test Steps

1. **Open the workflow builder**
   - Navigate to: http://localhost:3000/dashboard/workflows
   - Create a new workflow or open an existing one

2. **Add a Gmail node**
   - Look in the right sidebar under "ACTION" category
   - Click on the "Gmail" card (📧 icon)
   - A Gmail node should appear on the canvas

3. **Click the Gmail node**
   - The node should be selected (highlighted)
   - Right sidebar should change from "Node Library" to "Configure Gmail"
   - Title should say "Configure Gmail"
   - Description should say "Select an integration and action"

4. **View Gmail actions**
   - If you have Gmail integrations, you'll see them listed
   - Click on an integration to expand it
   - You should see 4 actions:
     - Send Email
     - List Messages
     - Get Message
     - Mark as Read

5. **Select an action**
   - Click on "Send Email"
   - The action card should highlight with a green border
   - A checkmark should appear next to "Send Email"
   - The node on the canvas should update to show "Gmail - Send Email"

6. **Verify parameters**
   - Each action should show parameter badges
   - Required parameters should have a red asterisk (*)
   - Example for Send Email: `to*`, `subject*`, `body*`, `cc`, `bcc`

## What to Look For

### ✅ Success Indicators:
- Gmail node shows 📧 icon
- Right sidebar switches to configuration mode when node is selected
- Actions list appears (4 Gmail actions)
- Action descriptions are visible
- Parameter badges show correctly
- Required parameters marked with *
- Selecting an action updates the node

### ❌ Potential Issues:
- If no integrations shown: Need to create a Gmail integration first
- If actions don't show: Check browser console for errors
- If sidebar doesn't switch: Check `requiresConnectorSelection` flag
- If actions are empty: Verify backend is returning actions in node-types

## Browser Console Commands

To verify data is loading correctly, open browser console and run:

```javascript
// Check if node types data includes actions
console.log('Checking Gmail node type...');
const gmailNode = document.querySelector('[data-id="gmail"]');
console.log(gmailNode);

// Or check React DevTools
// Look for ConnectorActionSelector component
// Check its props.nodeDefinition.actions
```

## Expected API Response

When the frontend fetches `/workflows/node-types`, it should receive:

```json
{
  "action": [
    {
      "id": "gmail",
      "label": "Gmail",
      "description": "Send and manage emails using Gmail API with OAuth 2.0",
      "icon": "📧",
      "actions": [
        {
          "id": "send_email",
          "name": "Send Email",
          "description": "Send an email via Gmail",
          "params": [
            {
              "name": "to",
              "type": "string",
              "description": "Recipient email address",
              "required": true
            },
            ...
          ]
        },
        ...
      ]
    }
  ]
}
```

## Troubleshooting

### Issue: Actions not showing
**Solution**: 
1. Check backend is running: `curl http://localhost:8000/workflows/node-types | jq '.action[0].actions'`
2. Verify actions are in the response
3. Check browser network tab for the API call
4. Look for JavaScript errors in console

### Issue: Sidebar doesn't switch
**Solution**:
1. Verify `requiresConnectorSelection` is true on the node
2. Check `selectedNode` state in React DevTools
3. Ensure `serviceType` is set correctly

### Issue: No integrations available
**Solution**:
1. Go to `/dashboard/integrations`
2. Create a Gmail integration
3. Authorize with Google OAuth
4. Return to workflows and try again

## Manual Verification

Check each component:

1. **Backend API**:
   ```bash
   curl http://localhost:8000/workflows/node-types | python3 -m json.tool | grep -A 20 '"id": "gmail"'
   ```

2. **Frontend Data Loading**:
   - Open React DevTools
   - Find component tree: `WorkflowsPage → useNodeTypes`
   - Check `data.action` array
   - Find Gmail node
   - Verify `actions` array has 4 items

3. **Component Rendering**:
   - Find `ConnectorActionSelector` in React DevTools
   - Check props:
     - `nodeDefinition` should have `actions` array
     - `serviceType` should be "gmail"
     - `onSelect` should be a function

4. **Action Selection**:
   - Select an action
   - Check `handleConnectorActionSelect` is called
   - Verify node data updates in React state
   - Confirm node subtitle changes on canvas

## Success Screenshot Checklist

Take screenshots showing:
- [ ] Gmail node in node library
- [ ] Gmail node added to canvas
- [ ] Right sidebar showing "Configure Gmail"
- [ ] List of 4 Gmail actions
- [ ] Expanded action showing parameters
- [ ] Selected action with checkmark
- [ ] Updated node showing "Gmail - Send Email"
