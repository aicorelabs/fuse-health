# Services and Workflow Nodes Synchronization

This document describes the synchronization between the Connection Services system and Workflow Builder nodes.

## Architecture Principle

**All services available in the "Add Connection" modal must have corresponding workflow nodes.**

This ensures users can:
1. Create a connection for a service (e.g., Gmail, OpenAI)
2. Use that connection in workflow nodes (e.g., "Gmail Action", "OpenAI Chat")

## Service-to-Node Mapping

| Service Type | Display Name | Workflow Node(s) | Category |
|-------------|--------------|------------------|----------|
| `gmail` | Gmail | `gmail-action` | Communication |
| `slack` | Slack | `slack-action` | Communication |
| `google_sheets` | Google Sheets | `google-sheets` | Data |
| `http` | HTTP/REST API | `http-action` | Data |
| `database` | Database | `database-query` | Data |
| `openai` | OpenAI | `openai-chat` | AI |
| `anthropic` | Anthropic (Claude) | `anthropic-chat` | AI |

## Backend Files

### Service Definitions
**File:** `/backend/src/app/services/connections/providers/service_definitions.py`

Defines the `SERVICE_DEFINITIONS` dictionary with:
- Authentication type (OAuth2, API Key, Basic Auth, Custom)
- OAuth configuration (scopes, endpoints)
- Test endpoints
- Category

### Workflow Node Types
**File:** `/backend/src/app/views/workflow_routes.py`

Endpoint: `GET /workflows/node-types`

Returns node type definitions with:
- Node fields and configuration
- Category (trigger, action, data, logic, ai)
- Service type mapping (via `service_type` field)

### API Endpoints
**File:** `/backend/src/app/views/service_routes.py`

- `GET /services` - List all available services
- `GET /services/{service_type}` - Get service details

## Frontend Integration

### Connection Modal
**File:** `/frontend/app/dashboard/connections/components/AddConnectionModal.tsx`

Fetches services via `useServicesQuery()` hook which calls `/services` endpoint.

### Workflow Builder
**File:** `/frontend/app/dashboard/workflows/page.tsx`

Fetches node types via `useNodeTypes()` hook which calls `/workflows/node-types` endpoint.

## Adding New Services

To add a new service that can be used in workflows:

### 1. Add to SERVICE_DEFINITIONS
```python
# /backend/src/app/services/connections/providers/service_definitions.py

"new_service": {
    "display_name": "New Service",
    "description": "Description of the service",
    "category": "communication",  # or "data", "ai", "clinical", etc.
    "auth_type": "api_key",  # or "oauth2", "basic_auth", "bearer_token", "custom"
    "auth_config": {
        "requires": ["api_key"],
    },
    "test_endpoint": "https://api.newservice.com/health",
}
```

### 2. Add Workflow Node Type
```python
# /backend/src/app/views/workflow_routes.py

{
    "id": "new-service-action",
    "label": "New Service",
    "description": "Description of what the node does",
    "category": "action",  # or "data", "ai", etc.
    "service_type": "new_service",  # Must match SERVICE_DEFINITIONS key
    "fields": [
        {"id": "label", "label": "Label", "type": "text", "required": True},
        # Add configuration fields...
    ]
}
```

### 3. Implement Execution Logic
```python
# /backend/src/app/services/workflow_execution_service.py

# Add handling in _execute_action_node or create new execution method
```

## Naming Conventions

- Service types use **snake_case** (e.g., `google_sheets`, `openai`)
- Node IDs use **kebab-case** (e.g., `gmail-action`, `openai-chat`)
- Display names use **Title Case** (e.g., "Gmail", "Google Sheets")

## Notes

- Services without workflow nodes have been removed: Epic FHIR, PubMed, SendGrid, DICOM
- These can be re-added later when corresponding workflow nodes are implemented
- Trigger nodes don't require connections (they start workflows)
- Logic nodes (condition, transform, loop, delay) don't require connections
