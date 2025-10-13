# Connector Actions Added to Node-Types Endpoint

## Summary

Successfully enhanced the `/workflows/node-types` endpoint to include available actions for each connector. Now when clients query for available node types, they receive detailed information about what actions each connector supports (e.g., for Gmail: send_email, list_messages, get_message, mark_as_read).

## Changes Made

### Backend Changes

#### 1. `/backend/src/app/views/workflow_routes.py`
- **Modified `get_node_types()` function**:
  - Added code to fetch available actions from each connector instance
  - For each connector, now calls `connector.get_actions()` to retrieve the list of supported actions
  - Includes action details: id, name, description, and parameters (with types, descriptions, and required flags)
  - Added error handling for connectors that fail to return actions
  - Fixed database import to use `connect()` from `services.database`

- **New fields in node definitions**:
  ```python
  {
      "id": "gmail",
      "label": "Gmail",
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
  ```

### Frontend Changes

#### 2. `/frontend/lib/api/workflows.ts`
- **Added new TypeScript interfaces**:
  - `ActionParameter`: Represents a parameter for an action
  - `ConnectorAction`: Represents a connector action with its metadata
  
- **Updated `NodeTypeDefinition` interface**:
  - Added optional `actions` field of type `ConnectorAction[]`
  - This allows TypeScript to properly type the actions returned from the API

## Example Output

### Gmail Connector Actions
```json
{
  "id": "gmail",
  "label": "Gmail",
  "description": "Send and manage emails using Gmail API with OAuth 2.0",
  "icon": "📧",
  "auth_type": "oauth2",
  "activated": false,
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
        {
          "name": "subject",
          "type": "string",
          "description": "Email subject line",
          "required": true
        },
        {
          "name": "body",
          "type": "string",
          "description": "Email body content (HTML or plain text)",
          "required": true
        },
        {
          "name": "cc",
          "type": "string",
          "description": "CC email addresses (comma-separated)",
          "required": false
        },
        {
          "name": "bcc",
          "type": "string",
          "description": "BCC email addresses (comma-separated)",
          "required": false
        }
      ]
    },
    {
      "id": "list_messages",
      "name": "List Messages",
      "description": "List messages from Gmail inbox",
      "params": [
        {
          "name": "query",
          "type": "string",
          "description": "Gmail search query (e.g., 'is:unread', 'from:example@gmail.com')",
          "required": false
        },
        {
          "name": "max_results",
          "type": "integer",
          "description": "Maximum number of messages to return (default: 10, max: 100)",
          "required": false
        }
      ]
    },
    {
      "id": "get_message",
      "name": "Get Message",
      "description": "Get a specific email message by ID",
      "params": [
        {
          "name": "message_id",
          "type": "string",
          "description": "Gmail message ID",
          "required": true
        }
      ]
    },
    {
      "id": "mark_as_read",
      "name": "Mark as Read",
      "description": "Mark a message as read",
      "params": [
        {
          "name": "message_id",
          "type": "string",
          "description": "Gmail message ID to mark as read",
          "required": true
        }
      ]
    }
  ]
}
```

### Slack Connector Actions
```json
{
  "id": "slack",
  "label": "Slack",
  "description": "Send messages and interact with Slack workspaces",
  "icon": "💬",
  "auth_type": "oauth2",
  "activated": false,
  "actions": [
    {
      "id": "send_message",
      "name": "Send Message",
      "description": "Send a message to a Slack channel or user",
      "params": [...]
    },
    {
      "id": "list_channels",
      "name": "List Channels",
      "description": "List all channels in the workspace",
      "params": [...]
    },
    {
      "id": "get_channel_info",
      "name": "Get Channel Info",
      "description": "Get information about a specific channel",
      "params": [...]
    },
    {
      "id": "list_users",
      "name": "List Users",
      "description": "List all users in the workspace",
      "params": [...]
    },
    {
      "id": "update_message",
      "name": "Update Message",
      "description": "Update an existing message",
      "params": [...]
    }
  ]
}
```

## Statistics

- **Total Action Nodes with Actions**: 2 (Gmail, Slack)
- **Total Data Nodes with Actions**: 6 (PubMed, RxNorm, openFDA, ClinicalTrials, HTTP, Google Sheets)
- **Total AI Nodes with Actions**: 2 (OpenAI, Anthropic)
- **Total Actions Available**: 42

## Testing

Created test scripts to verify the implementation:
- `backend/test_node_types.py` - Direct Python test
- `backend/test_http_endpoint.py` - HTTP endpoint test

Both tests confirm that actions are properly returned for all connectors.

## Benefits

1. **Better UX**: Frontend can now display available actions in a dropdown/selector
2. **Type Safety**: Connectors define their own actions with proper parameter types
3. **Documentation**: Each action includes description and parameter details
4. **Discoverability**: Users can see what actions are available before configuring a node
5. **Validation**: Parameter requirements (required/optional, types) help validate user input

## Next Steps

Frontend implementation can now:
1. Display action dropdowns when configuring connector nodes
2. Show action descriptions and parameter requirements
3. Build dynamic forms based on action parameters
4. Validate user input against parameter types and requirements
