# Workflow API Guide

## Overview

We provide **3 different ways** to create workflows, from simplest to most flexible:

1. **Quick Helpers** - Simplest, for common use cases (e.g., email)
2. **Builder API** - Typed nodes with automatic conversion
3. **Raw JSON** - Full control for advanced users

---

## 1. Quick Helpers (Easiest ⭐️)

### Create Email Workflow

The simplest way - just provide recipient, subject, and body:

```bash
curl -X POST "http://localhost:8000/workflows/quick/email?\
user_id=user_demo_001&\
name=My%20Email%20Workflow&\
recipient=user@example.com&\
subject=Hello&\
body=This%20is%20a%20test" | python3 -m json.tool
```

**Benefits:**
- ✅ Only 5 required parameters
- ✅ No JSON structure needed
- ✅ Perfect for simple workflows
- ✅ Automatically creates trigger + action nodes

**When to use:** When you need a simple email notification workflow

---

## 2. Builder API (Recommended 🎯)

### Typed Nodes with Automatic Conversion

Uses Pydantic models for type safety and better developer experience:

```bash
curl -X POST http://localhost:8000/workflows/builder \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_demo_001",
    "name": "My Workflow",
    "description": "A workflow with typed nodes",
    "category": "Communication",
    "trigger_nodes": [
      {
        "id": "trigger-1",
        "position": {"x": 100, "y": 100},
        "label": "Manual Trigger",
        "trigger_type": "manual"
      }
    ],
    "action_nodes": [
      {
        "id": "action-1",
        "position": {"x": 300, "y": 100},
        "label": "Send Email",
        "service_type": "gmail",
        "config": {
          "to": "user@example.com",
          "subject": "Test",
          "body": "Hello World"
        }
      }
    ],
    "condition_nodes": [
      {
        "id": "condition-1",
        "position": {"x": 500, "y": 100},
        "label": "Check Temperature",
        "condition": "${temperature} > 20"
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger-1",
        "target": "action-1"
      },
      {
        "id": "e2",
        "source": "action-1",
        "target": "condition-1"
      }
    ]
  }'
```

**Available Node Types:**

### Trigger Nodes
```json
{
  "id": "trigger-1",
  "position": {"x": 100, "y": 100},
  "label": "My Trigger",
  "trigger_type": "manual",  // manual, scheduled, webhook, event
  "config": {}
}
```

### Action Nodes
```json
{
  "id": "action-1",
  "position": {"x": 200, "y": 100},
  "label": "Send Email",
  "service_type": "gmail",
  "connection_id": "conn-123",  // Optional
  "config": {
    "to": "user@example.com",
    "subject": "Hello",
    "body": "World"
  }
}
```

### Condition Nodes
```json
{
  "id": "condition-1",
  "position": {"x": 300, "y": 100},
  "label": "Check Value",
  "condition": "${temperature} > 20",
  "config": {}
}
```

### Transform Nodes
```json
{
  "id": "transform-1",
  "position": {"x": 400, "y": 100},
  "label": "Map Data",
  "transform_type": "map",  // map, filter, aggregate
  "mapping": {
    "output_field": "input_field"
  },
  "config": {}
}
```

### Delay Nodes
```json
{
  "id": "delay-1",
  "position": {"x": 500, "y": 100},
  "label": "Wait 5 seconds",
  "delay_seconds": 5,
  "config": {}
}
```

**Benefits:**
- ✅ Type-safe with Pydantic validation
- ✅ Organized by node type
- ✅ Clear structure
- ✅ Automatic conversion to internal format
- ✅ Better error messages

**When to use:** Most workflows, especially when building a frontend

---

## 3. Raw JSON (Advanced 🔧)

### Full Control with Raw Structure

For advanced users who need complete control:

```bash
curl -X POST http://localhost:8000/workflows/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_demo_001",
    "name": "My Workflow",
    "description": "Advanced workflow",
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": {"x": 100, "y": 100},
        "data": {
          "label": "Manual Trigger",
          "triggerType": "manual",
          "config": {}
        }
      },
      {
        "id": "action-1",
        "type": "action",
        "position": {"x": 300, "y": 100},
        "data": {
          "label": "Send Email",
          "serviceType": "gmail",
          "config": {
            "to": "user@example.com",
            "subject": "Test",
            "body": "Hello"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger-1",
        "target": "action-1"
      }
    ],
    "category": "Communication",
    "metadata": {}
  }'
```

**Benefits:**
- ✅ Complete control over structure
- ✅ Can add custom fields
- ✅ Direct mapping to database format

**When to use:** 
- Advanced integrations
- Custom node types
- Frontend canvas (React Flow) direct export

---

## Comparison

| Feature | Quick Helpers | Builder API | Raw JSON |
|---------|--------------|-------------|----------|
| **Ease of Use** | ⭐️⭐️⭐️⭐️⭐️ | ⭐️⭐️⭐️⭐️ | ⭐️⭐️ |
| **Type Safety** | ✅ | ✅ | ❌ |
| **Flexibility** | ❌ | ✅ | ✅✅ |
| **Use Case** | Simple tasks | Most workflows | Advanced |
| **Frontend** | ❌ | ✅ | ✅ |
| **Validation** | Auto | Pydantic | Manual |

---

## Workflow Lifecycle

Once created, all workflows follow the same lifecycle:

### 1. Validate
```bash
GET /workflows/{workflow_id}/validate
```

### 2. Publish
```bash
POST /workflows/{workflow_id}/publish
```

### 3. Execute
```bash
POST /workflows/{workflow_id}/execute
```
```json
{
  "trigger_data": {
    "source": "manual",
    "user": "john@example.com"
  }
}
```

### 4. Monitor
```bash
GET /workflows/{workflow_id}/executions
```

### 5. Manage
```bash
POST /workflows/{workflow_id}/pause    # Pause execution
POST /workflows/{workflow_id}/archive  # Archive
DELETE /workflows/{workflow_id}        # Delete
```

---

## Full Example: Multi-Node Workflow

Here's a complete example using the Builder API:

```bash
curl -X POST http://localhost:8000/workflows/builder \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_demo_001",
    "name": "Patient Alert System",
    "description": "Alert staff when patient vitals are abnormal",
    "category": "Healthcare",
    "trigger_nodes": [
      {
        "id": "trigger-1",
        "position": {"x": 100, "y": 100},
        "label": "Vitals Updated",
        "trigger_type": "webhook"
      }
    ],
    "condition_nodes": [
      {
        "id": "condition-1",
        "position": {"x": 300, "y": 100},
        "label": "Check Heart Rate",
        "condition": "${heart_rate} > 120"
      }
    ],
    "action_nodes": [
      {
        "id": "action-1",
        "position": {"x": 500, "y": 50},
        "label": "Send Alert Email",
        "service_type": "gmail",
        "config": {
          "to": "nurse@hospital.com",
          "subject": "ALERT: High Heart Rate",
          "body": "Patient ${patient_id} has heart rate of ${heart_rate}"
        }
      },
      {
        "id": "action-2",
        "position": {"x": 500, "y": 150},
        "label": "Log Event",
        "service_type": "logger",
        "config": {
          "level": "warning",
          "message": "Abnormal vitals detected"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger-1",
        "target": "condition-1"
      },
      {
        "id": "e2",
        "source": "condition-1",
        "target": "action-1",
        "condition": "true"
      },
      {
        "id": "e3",
        "source": "condition-1",
        "target": "action-2",
        "condition": "true"
      }
    ]
  }'
```

---

## Best Practices

### 1. Use the Right API Level
- **Quick helpers** for simple, one-off workflows
- **Builder API** for frontend applications
- **Raw JSON** only when you need complete control

### 2. Always Validate Before Publishing
```bash
GET /workflows/{id}/validate
```

### 3. Use Descriptive Labels
```json
{
  "label": "Send Welcome Email to New Users",  // ✅ Good
  "label": "Action 1"                          // ❌ Bad
}
```

### 4. Organize with Categories
```json
{
  "category": "Healthcare",  // or "Communication", "Data Processing", etc.
}
```

### 5. Test with Draft Workflows
Workflows are created as `DRAFT` by default. Test thoroughly before publishing.

---

## Next Steps

1. **Create your first workflow** using Quick Helpers
2. **Validate and publish** it
3. **Execute** it with test data
4. **Monitor** the execution logs
5. **Build a frontend** using the Builder API

## API Documentation

Full API docs available at: `http://localhost:8000/docs`
