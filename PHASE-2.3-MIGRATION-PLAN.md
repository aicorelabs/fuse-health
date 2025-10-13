# Connector Registry Migration Plan

## Phase 2.3: Workflow Engine & API Migration

### Status: IN PROGRESS

---

## Overview

This phase migrates the workflow engine and API layer from the old Connection-based system to the new Integration/Connector architecture.

## Completed Work

### 1. New Services ✅

- **IntegrationService** (`backend/src/app/services/integration_service.py`)
  - Complete CRUD operations for integrations
  - Integration credential management with encryption
  - OAuth token refresh support
  - Integration testing functionality
  - Workflow validation (prevents deletion of in-use integrations)

- **Updated WorkflowExecutionService** (`backend/src/app/services/workflow_execution_service.py`)
  - Removed old Connection references
  - Added ConnectorRegistry integration
  - Implemented real connector execution in `_execute_action_node()`
  - Added parameter resolution with variable substitution
  - Removed deprecated AI node type (AI is now a connector)
  - Supports `${variable}` and `${path.to.value}` substitution
  - Updates integration `lastUsedAt` timestamp on execution

### 2. New Controllers ✅

- **IntegrationController** (`backend/src/app/controllers/integration_controller.py`)
  - `list_integrations()` - List user integrations with filters
  - `get_integration()` - Get specific integration details
  - `create_integration()` - Create new integration
  - `update_integration()` - Update integration
  - `delete_integration()` - Delete integration (with workflow validation)
  - `test_integration()` - Test integration with first action
  - `refresh_oauth_token()` - Refresh OAuth tokens

- **ConnectorController** (`backend/src/app/controllers/connector_controller.py`)
  - `list_connectors()` - List available connectors with category filter
  - `get_connector()` - Get connector details with actions
  - `list_connector_actions()` - List actions for connector
  - `get_connector_action()` - Get specific action details
  - `get_connector_categories()` - Get categories with counts

---

## Next Steps

### 3. Database Migration 🔄

Need to run Prisma migration to create Integration table and remove Connection table:

```bash
cd backend
prisma migrate dev --name replace_connection_with_integration
```

**Schema changes:**
- ✅ Integration table already defined in `schema.prisma`
- ❌ Connection table still exists (needs removal)
- ❌ WorkflowNode references need updating

**Migration tasks:**
1. Update `schema.prisma`:
   - Remove `Connection` model
   - Remove `Connection` reference from any other models
   - Verify `Integration` model is complete

2. Run migration:
   ```bash
   cd backend
   npx prisma migrate dev --name remove_connection_model
   ```

3. Regenerate Prisma client:
   ```bash
   cd backend
   npx prisma generate
   ```

### 4. API Routes 🔄

Update route files to expose new endpoints:

**Create new routes:**
- `backend/src/app/views/integration_routes.py`:
  ```python
  POST   /api/integrations          - Create integration
  GET    /api/integrations          - List integrations
  GET    /api/integrations/:id      - Get integration
  PATCH  /api/integrations/:id      - Update integration
  DELETE /api/integrations/:id      - Delete integration
  POST   /api/integrations/:id/test - Test integration
  POST   /api/integrations/:id/refresh-token - Refresh OAuth token
  ```

- `backend/src/app/views/connector_routes.py`:
  ```python
  GET /api/connectors                      - List connectors
  GET /api/connectors/categories           - Get categories
  GET /api/connectors/:id                  - Get connector
  GET /api/connectors/:id/actions          - List connector actions
  GET /api/connectors/:id/actions/:actionId - Get action details
  ```

**Update existing routes:**
- Update `backend/src/app/main.py` to register new routes
- Remove or deprecate old connection routes

### 5. OAuth Flow 🔄

Implement OAuth callback handlers:

**Create OAuth routes:**
- `backend/src/app/views/oauth_routes.py`:
  ```python
  GET /api/oauth/authorize/:connector_id  - Start OAuth flow
  GET /api/oauth/callback/:connector_id   - OAuth callback handler
  POST /api/oauth/exchange                - Exchange code for token
  ```

**OAuth Handler Integration:**
- Use existing `OAuthHandler` class
- Store tokens in Integration table
- Handle token refresh automatically

### 6. Frontend Updates 🔄

Update frontend to use new API:

**Integration Management UI:**
- Update `frontend/app/dashboard/connections/` → `frontend/app/dashboard/integrations/`
- Use new `/api/integrations` endpoints
- Show connector metadata (icon, description, category)
- OAuth authorization flow UI

**Workflow Builder UI:**
- Update node configuration to use:
  - `connectorId` instead of `serviceType`
  - `integrationId` instead of `connectionId`
  - `actionId` for specific connector action
- Action selector: Browse connectors → Select action → Configure parameters
- Integration selector: Show user's integrations for selected connector
- Parameter UI: Generate form based on action parameter schema

**API Client Updates:**
- `frontend/lib/api/connections.ts` → `frontend/lib/api/integrations.ts`
- `frontend/lib/api/connectors.ts` (new)
- Update all Connection references to Integration

### 7. Cleanup 🔄

Remove old Connection-based code:

**Files to delete:**
- ❌ `backend/src/app/controllers/connection_controller.py`
- ❌ `backend/src/app/services/connections/connection_service.py`
- ❌ `backend/src/app/models/connection.py`
- ❌ `backend/src/app/views/connection_routes.py` (or update to integration_routes)

**Code cleanup:**
- Remove all `Connection` model imports
- Remove old MCP server implementations
- Clean up any remaining `connection_id` references
- Update documentation

---

## Key Architecture Changes

### Node Data Structure

**Old:**
```json
{
  "id": "node1",
  "type": "action",
  "data": {
    "label": "Send Email",
    "serviceType": "gmail",
    "connectionId": "conn_123",
    "config": {
      "to": "user@example.com",
      "subject": "Hello"
    }
  }
}
```

**New:**
```json
{
  "id": "node1",
  "type": "action",
  "data": {
    "label": "Send Email",
    "connectorId": "gmail",
    "integrationId": "int_456",
    "actionId": "send_email",
    "config": {
      "to": "user@example.com",
      "subject": "Hello"
    }
  }
}
```

### Parameter Resolution

The new workflow engine supports powerful variable substitution:

```python
# Direct variable
"${email}" → context.get_variable("email")

# Nested path
"${loop_item.name}" → context.get_variable("loop_item")["name"]

# Node result reference
"${node_abc123_result.data}" → context.get_variable("node_abc123_result")["data"]
```

### Integration vs Connection

| Aspect | Old (Connection) | New (Integration) |
|--------|-----------------|-------------------|
| Credentials | Basic encryption | Strong encryption with EncryptionService |
| OAuth | Manual token management | Automatic token refresh |
| Metadata | Stored in Connection | Retrieved from ConnectorRegistry |
| Execution | Simulated actions | Real connector execution |
| Actions | Hardcoded by serviceType | Dynamic from connector actions |
| Discovery | Manual configuration | Auto-discovery via registry |

---

## Testing Plan

### Unit Tests
- [ ] Test IntegrationService CRUD operations
- [ ] Test workflow execution with real connectors
- [ ] Test parameter resolution and variable substitution
- [ ] Test OAuth token refresh
- [ ] Test integration validation (workflow usage check)

### Integration Tests
- [ ] End-to-end workflow execution with Gmail connector
- [ ] End-to-end workflow execution with Google Sheets connector
- [ ] OAuth flow with Slack connector
- [ ] Workflow with multiple connectors
- [ ] Loop with connector actions

### Manual Tests
- [ ] Create integration via UI
- [ ] Test integration via UI
- [ ] Build workflow with connector nodes
- [ ] Execute workflow end-to-end
- [ ] OAuth authorization flow
- [ ] Token refresh after expiry

---

## Migration Script

For users with existing workflows, provide migration script:

```python
# migrate_connections_to_integrations.py

async def migrate_connections_to_integrations(db: Prisma):
    """
    Migrate existing Connection records to Integration records.
    Update workflow nodes to use new structure.
    """
    
    # 1. Migrate Connection → Integration
    connections = await db.connection.find_many()
    
    for conn in connections:
        # Create corresponding integration
        integration = await db.integration.create(data={
            "userId": conn.userId,
            "connectorId": infer_connector_id(conn),
            "displayName": conn.displayName,
            "category": infer_category(conn),
            "authType": conn.authType,
            "encryptedData": conn.encryptedConfig,
            "status": "ACTIVE" if conn.isActive else "INACTIVE",
            "accessToken": conn.accessToken,
            "refreshToken": conn.refreshToken,
            "tokenExpiresAt": conn.tokenExpiresAt,
            "createdAt": conn.createdAt,
            "updatedAt": conn.updatedAt,
        })
        
        # 2. Update workflows using this connection
        workflows = await db.workflow.find_many(where={"userId": conn.userId})
        
        for workflow in workflows:
            nodes = json.loads(workflow.nodes)
            updated = False
            
            for node in nodes:
                if node.get("data", {}).get("connectionId") == conn.id:
                    # Update node structure
                    node["data"]["integrationId"] = integration.id
                    node["data"]["connectorId"] = integration.connectorId
                    
                    # Infer actionId from old serviceType
                    service_type = node["data"].get("serviceType")
                    if service_type:
                        node["data"]["actionId"] = infer_action_id(service_type, node["data"].get("config"))
                    
                    # Remove old fields
                    node["data"].pop("connectionId", None)
                    node["data"].pop("serviceType", None)
                    
                    updated = True
            
            if updated:
                await db.workflow.update(
                    where={"id": workflow.id},
                    data={"nodes": json.dumps(nodes)}
                )
    
    print(f"Migrated {len(connections)} connections to integrations")
```

---

## Rollback Plan

If issues arise:

1. Keep Connection table until migration fully validated
2. Workflow nodes can support both structures temporarily:
   ```python
   # Check for old or new structure
   if node.get("connectionId"):
       # Use old Connection lookup
   elif node.get("integrationId"):
       # Use new Integration lookup
   ```
3. Database rollback: `prisma migrate dev --name restore_connection_model`
4. Code rollback: Git revert to previous commit

---

## Success Criteria

- [ ] All 10 connectors working in workflows
- [ ] OAuth flow working end-to-end
- [ ] No Connection model references in code
- [ ] All tests passing
- [ ] Frontend working with new API
- [ ] Existing workflows migrated successfully
- [ ] Documentation updated
- [ ] Performance equivalent or better than old system

---

## Timeline

- **Phase 2.3a (Completed)**: Services and controllers - ✅ DONE
- **Phase 2.3b (Next)**: Database migration - 🔄 30 minutes
- **Phase 2.3c**: API routes - 🔄 1 hour
- **Phase 2.3d**: OAuth flow - 🔄 2 hours
- **Phase 2.3e**: Frontend updates - 🔄 4 hours
- **Phase 2.3f**: Testing - 🔄 2 hours
- **Phase 2.3g**: Cleanup - 🔄 1 hour

**Total estimated time remaining**: ~10 hours
