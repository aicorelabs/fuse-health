# Workflow Builder Testing Guide

## Quick Start

### 1. Ensure Both Servers Are Running

**Backend** (Terminal 1):
```bash
cd /Users/joe_codes/dev/fuse-home/backend
uv run fastapi dev src/app/main.py --host 0.0.0.0 --port 8000
```

**Frontend** (Terminal 2):
```bash
cd /Users/joe_codes/dev/fuse-home/frontend
npm run dev
```

### 2. Access the Workflow Builder

- **Blank Canvas (Create New)**: http://localhost:3000/dashboard/workflows
- **Edit Existing**: http://localhost:3000/dashboard/workflows?id={workflow_id}
- **Workflows List**: http://localhost:3000/dashboard/workflows/list

## Test Scenarios

### Scenario 1: Create a New Workflow

1. **Navigate to blank canvas**
   ```
   http://localhost:3000/dashboard/workflows
   ```

2. **Verify blank state**
   - No nodes on canvas
   - Title shows empty input
   - "Create" button visible (not "Save")
   
3. **Set workflow details**
   - Click workflow name input
   - Enter: "Patient Follow-up Automation"
   - Click description input
   - Enter: "Automated patient follow-up after discharge"

4. **Add nodes from template**
   - Click "Schedule Trigger" in right sidebar
   - Node appears on canvas
   - Click "Google Sheets" 
   - Node appears and auto-connects
   - Click "AI Assistant"
   - Node appears and auto-connects
   - Click "Email" action
   - Node appears and auto-connects

5. **Configure a node**
   - Click on "AI Assistant" node
   - Right sidebar shows configuration
   - Enter config values:
     - Prompt: "Generate follow-up email based on patient data"
     - Model: "gpt-4"
   
6. **Save workflow**
   - Click "Create" button
   - Wait for "Workflow created successfully!" alert
   - URL updates to include `?id={new_id}`
   - Button changes from "Create" to "Save"

7. **Verify creation**
   - Click "Back" button
   - Should see new workflow in list
   - Status should be "DRAFT"

### Scenario 2: Edit Existing Workflow

1. **Create test workflow via API** (if needed)
   ```bash
   curl -X POST http://localhost:8000/workflows \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "demo-user",
       "name": "Test Workflow",
       "description": "For testing edits",
       "nodes": [
         {
           "id": "trigger-1",
           "type": "trigger",
           "position": {"x": 100, "y": 100},
           "data": {"label": "Start", "config": {}}
         }
       ],
       "edges": []
     }'
   ```
   Save the returned workflow ID.

2. **Navigate to workflow**
   ```
   http://localhost:3000/dashboard/workflows?id={workflow_id}
   ```

3. **Verify loading**
   - Loading spinner appears briefly
   - Workflow name loads in header
   - Description loads
   - Nodes appear on canvas
   - Edges/connections render

4. **Make changes**
   - Update workflow name: "Test Workflow - Updated"
   - Add new node (click any template)
   - Move existing nodes (drag on canvas)
   - Click "Save"
   - Wait for "Workflow saved successfully!" alert

5. **Verify persistence**
   - Refresh page (Cmd+R / Ctrl+R)
   - Changes should persist
   - Name still shows "Test Workflow - Updated"
   - New node still present

### Scenario 3: Publish Workflow

1. **Start with saved workflow**
   - Load existing workflow with ID
   - Ensure workflow has valid structure (at least one trigger node)

2. **Check validation**
   - Look at validation panel above canvas
   - Should show green checkmark if valid
   - Should show warnings/errors if invalid

3. **Attempt publish with errors**
   - Remove all nodes (if any exist)
   - Click "Publish" button
   - Should show validation error alert

4. **Publish valid workflow**
   - Add required nodes (trigger + action)
   - Ensure validation shows no errors
   - Click "Save" first
   - Click "Publish" button
   - Wait for "Workflow published successfully!" alert

5. **Verify publish**
   - Click "Back" to workflows list
   - Status should change from "DRAFT" to "PUBLISHED"

### Scenario 4: Canvas Interactions

1. **Add multiple nodes**
   - Click 5 different templates
   - Verify auto-connection (Zapier-style chaining)
   - Each new node connects to previous

2. **Insert node in middle**
   - Right-click on edge between two nodes
   - Click "Insert step here"
   - New node appears in middle
   - Edges reroute through new node

3. **Delete node**
   - Click node to select
   - Press Delete key (or click delete button)
   - Node removed from canvas
   - Connected edges removed

4. **Move nodes**
   - Drag nodes around canvas
   - Edges follow and redraw
   - Click "Save"
   - Positions persist on reload

5. **Canvas controls**
   - Use minimap to navigate
   - Zoom in/out with scroll wheel
   - Pan with middle mouse button drag
   - Fit view with controls button

### Scenario 5: Navigate Between Pages

1. **From workflows list**
   - Go to: http://localhost:3000/dashboard/workflows/list
   - Click "Create Workflow" button
   - Should navigate to blank builder

2. **From workflow detail**
   - Go to workflow detail page (click workflow name in list)
   - Click "Edit Workflow" button
   - Should navigate to builder with workflow loaded

3. **Back navigation**
   - From builder, click "Back" button
   - Should return to workflows list
   - Workflow changes should be saved

## API Testing

### Check Backend Endpoints

1. **List workflows**
   ```bash
   curl http://localhost:8000/workflows?user_id=demo-user
   ```

2. **Get specific workflow**
   ```bash
   curl http://localhost:8000/workflows/{workflow_id}
   ```

3. **Create workflow**
   ```bash
   curl -X POST http://localhost:8000/workflows \
     -H "Content-Type: application/json" \
     -d @test-workflow.json
   ```

4. **Update workflow**
   ```bash
   curl -X PUT http://localhost:8000/workflows/{workflow_id} \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Updated Name",
       "description": "Updated description",
       "nodes": [...],
       "edges": [...]
     }'
   ```

5. **Publish workflow**
   ```bash
   curl -X POST http://localhost:8000/workflows/{workflow_id}/publish
   ```

## Browser Console Testing

Open browser DevTools (F12) and check:

1. **Network tab**
   - Look for API calls to `/workflows`
   - Status should be 200 or 201
   - Response should contain workflow data

2. **Console tab**
   - Should see no errors (red messages)
   - React Query logs may appear (info level)

3. **React DevTools**
   - Check component state
   - Verify `nodes` and `edgesRaw` arrays
   - Check `workflowId` value

## Common Issues & Solutions

### Issue: "Cannot find workflow"
- **Cause**: Invalid workflow ID in URL
- **Solution**: Check ID exists in database, or remove `?id=` param

### Issue: Changes not saving
- **Cause**: Backend server not running or API error
- **Solution**: Check backend logs, verify server running on port 8000

### Issue: Workflow not loading
- **Cause**: CORS error or network issue
- **Solution**: Check browser console for errors, verify CORS settings

### Issue: Publish button disabled
- **Cause**: Validation errors or workflow not saved
- **Solution**: Fix validation errors, save workflow first

### Issue: URL doesn't update after create
- **Cause**: Navigation error
- **Solution**: Check browser console, verify router.push() working

## Performance Checks

- **Load time**: Workflow should load in < 500ms
- **Save time**: Save operation should complete in < 1s
- **Canvas rendering**: Smooth dragging with 20+ nodes
- **No memory leaks**: Use browser memory profiler

## Success Criteria

✅ Create new workflow from blank canvas  
✅ Save workflow to database  
✅ Load existing workflow from URL param  
✅ Edit and update existing workflow  
✅ Publish workflow with validation  
✅ Navigate back to list page  
✅ Canvas interactions work smoothly  
✅ Validation shows appropriate errors  
✅ Loading states display correctly  
✅ Error handling works (network errors, etc.)  

## Next Steps After Testing

1. Implement auto-save (debounced)
2. Add keyboard shortcuts (Ctrl+S to save)
3. Improve error messages (user-friendly)
4. Add workflow templates
5. Implement undo/redo
6. Add real-time collaboration
7. Performance optimization for large workflows
