# Template Engine Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Workflow Execution Engine                      │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Workflow Nodes                             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │ │
│  │  │ Trigger  │→ │  Action  │→ │Transform │→ │  Action  │    │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │ │
│  │                                                               │ │
│  │  Each node has config with templates:                        │ │
│  │  {                                                            │ │
│  │    "email": "${user.email}",                                 │ │
│  │    "subject": "Hello {{uppercase ${user.name}}}!"            │ │
│  │  }                                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              _resolve_parameters()                            │ │
│  │                                                                │ │
│  │  Calls Template Engine for each node config                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Template Engine                              │
│                 (template_engine.py)                                │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  resolve(template, context)                                   │ │
│  │                                                                │ │
│  │  1. Check type (string, dict, list)                          │ │
│  │  2. Process recursively                                       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  _resolve_string(text, context)                              │ │
│  │                                                                │ │
│  │  Step 1: Resolve helper functions {{helper args}}            │ │
│  │  Step 2: Resolve variables ${variable.path}                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │             Helper Functions (40+)                            │ │
│  │                                                                │ │
│  │  JSON:  json_get, json_query, parse_json, to_json            │ │
│  │  Array: pluck, filter, join, sort, unique, flatten           │ │
│  │  String: uppercase, lowercase, trim, split, replace          │ │
│  │  Math:  sum, avg, min, max, round, floor, ceil               │ │
│  │  Date:  now, format_date, date_diff                          │ │
│  │  Logic: if, default, is_empty, is_null, equals               │ │
│  │  Type:  to_string, to_number, to_boolean                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Resolved Value                                               │ │
│  │                                                                │ │
│  │  Returns transformed data back to workflow engine             │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Processing Flow

### Example: Email Generation

**Input Config:**
```json
{
  "to": "${user.email}",
  "subject": "Order ${order.id} - {{uppercase ${order.status}}}",
  "body": "You have {{length ${order.items}}} items totaling ${{round {{sum {{pluck ${order.items} 'price'}}}} 2}}"
}
```

**Context:**
```json
{
  "user": {"email": "john@example.com"},
  "order": {
    "id": "12345",
    "status": "completed",
    "items": [
      {"name": "Item 1", "price": 10.99},
      {"name": "Item 2", "price": 25.50}
    ]
  }
}
```

**Processing Steps:**

```
Step 1: Process "to" field
├─ Input: "${user.email}"
├─ Detect: Variable only, no helpers
├─ Resolve: user.email → "john@example.com"
└─ Output: "john@example.com"

Step 2: Process "subject" field
├─ Input: "Order ${order.id} - {{uppercase ${order.status}}}"
├─ Detect: Both helper and variable
├─ Step 2a: Resolve helpers
│  ├─ Find: "{{uppercase ${order.status}}}"
│  ├─ Resolve arg: ${order.status} → "completed"
│  ├─ Call helper: uppercase("completed") → "COMPLETED"
│  └─ Replace: "Order ${order.id} - COMPLETED"
├─ Step 2b: Resolve variables
│  ├─ Find: "${order.id}"
│  ├─ Resolve: order.id → "12345"
│  └─ Replace: "Order 12345 - COMPLETED"
└─ Output: "Order 12345 - COMPLETED"

Step 3: Process "body" field
├─ Input: "You have {{length ${order.items}}} items totaling ${{round {{sum {{pluck ${order.items} 'price'}}}} 2}}"
├─ Detect: Multiple nested helpers
├─ Step 3a: Resolve first helper {{length ${order.items}}}
│  ├─ Resolve arg: ${order.items} → [{"name":"Item 1","price":10.99},{"name":"Item 2","price":25.50}]
│  ├─ Call helper: length([...]) → 2
│  └─ Replace: "You have 2 items totaling ${{round {{sum {{pluck ${order.items} 'price'}}}} 2}}"
├─ Step 3b: Resolve nested helper {{round {{sum {{pluck ${order.items} 'price'}}}} 2}}
│  ├─ Innermost: {{pluck ${order.items} 'price'}}
│  │  ├─ Resolve arg: ${order.items} → [...]
│  │  ├─ Call pluck: Extract 'price' from each → [10.99, 25.50]
│  │  └─ Result: [10.99, 25.50]
│  ├─ Middle: {{sum [10.99, 25.50]}}
│  │  ├─ Call sum: 10.99 + 25.50 → 36.49
│  │  └─ Result: 36.49
│  ├─ Outer: {{round 36.49 2}}
│  │  ├─ Call round: round(36.49, 2) → 36.49
│  │  └─ Result: 36.49
│  └─ Replace: "You have 2 items totaling $36.49"
└─ Output: "You have 2 items totaling $36.49"
```

**Final Output:**
```json
{
  "to": "john@example.com",
  "subject": "Order 12345 - COMPLETED",
  "body": "You have 2 items totaling $36.49"
}
```

## Template Resolution Order

```
┌─────────────────────────────────────────────────────────────┐
│                    Template String                          │
│  "Hello {{uppercase ${user.name}}}, you have ${count}!"     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Find and Resolve Helpers ({{...}})                 │
│                                                             │
│  Pattern: \{\{([^}]+)\}\}                                   │
│  Found: "{{uppercase ${user.name}}}"                        │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Step 1a: Parse helper expression                       ││
│  │   Input: "uppercase ${user.name}"                      ││
│  │   Split: ["uppercase", "${user.name}"]                 ││
│  │   Helper: "uppercase"                                  ││
│  │   Args: ["${user.name}"]                               ││
│  └────────────────────────────────────────────────────────┘│
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Step 1b: Resolve arguments (variables first)          ││
│  │   Input: "${user.name}"                                ││
│  │   Resolve: user.name → "john doe"                      ││
│  │   Result: "john doe"                                   ││
│  └────────────────────────────────────────────────────────┘│
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Step 1c: Call helper function                          ││
│  │   Helper: uppercase                                    ││
│  │   Args: ["john doe"]                                   ││
│  │   Call: uppercase(context, "john doe")                 ││
│  │   Result: "JOHN DOE"                                   ││
│  └────────────────────────────────────────────────────────┘│
│                         ↓                                    │
│  Replace: "Hello JOHN DOE, you have ${count}!"              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Find and Resolve Variables (${...})                │
│                                                             │
│  Pattern: \$\{([^}]+)\}                                     │
│  Found: "${count}"                                          │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Step 2a: Parse path                                    ││
│  │   Input: "count"                                       ││
│  │   Parts: ["count"]                                     ││
│  └────────────────────────────────────────────────────────┘│
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Step 2b: Navigate path in context                      ││
│  │   Start: context                                       ││
│  │   Navigate: context["count"]                           ││
│  │   Result: 5                                            ││
│  └────────────────────────────────────────────────────────┘│
│                         ↓                                    │
│  Replace: "Hello JOHN DOE, you have 5!"                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Final Result                             │
│  "Hello JOHN DOE, you have 5!"                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Structures

### ExecutionContext

```python
class ExecutionContext:
    """Workflow execution context with variables."""
    
    variables: Dict[str, Any] = {
        # User input
        "user": {"email": "...", "name": "..."},
        
        # Node results
        "node_abc123_result": {
            "success": True,
            "data": {...}
        },
        "last_action_result": {...},
        
        # Loop variables
        "loop_index": 0,
        "loop_item": {...},
        
        # Trigger data
        "webhook_payload": {...}
    }
```

### Helper Function Signature

```python
def helper_function(
    context: Dict[str, Any],  # Full execution context
    *args: Any                # Resolved arguments
) -> Any:                     # Return value
    """
    All helpers follow this pattern.
    
    Args are pre-resolved:
    - "${variable}" is resolved to actual value
    - "'string'" is parsed to string
    - Numbers and booleans are parsed
    
    Context is available for complex operations.
    """
    pass
```

## Integration Points

### 1. Workflow Execution Service

```python
# backend/src/app/services/workflow_execution_service.py

from .template_engine import template_engine

def _resolve_parameters(
    self,
    config: Dict[str, Any],
    context: ExecutionContext,
) -> Dict[str, Any]:
    """Resolve node config parameters."""
    return template_engine.resolve(config, context.variables)
```

### 2. Node Configuration

```json
{
  "id": "action1",
  "type": "action",
  "data": {
    "connectorId": "gmail",
    "integrationId": "int_123",
    "actionId": "send_email",
    "config": {
      // These fields are processed by template engine
      "to": "${recipient.email}",
      "subject": "{{capitalize ${subject_line}}}",
      "body": "Dear {{capitalize ${recipient.name}}}, ..."
    }
  }
}
```

### 3. Context Building

```python
# Workflow engine builds context from:
# 1. Trigger data
context.set_variable("user_id", trigger_data["user_id"])

# 2. Node results
result = await connector.execute(...)
context.set_variable(f"node_{node.id}_result", result.data)

# 3. Loop state
context.set_variable("loop_index", index)
context.set_variable("loop_item", item)
```

## Performance Optimization

### 1. Single-pass Resolution

```
Input:  "Hello {{uppercase ${name}}}"
        ↓
Pass 1: Resolve helpers → "Hello {{uppercase 'john'}}"
        ↓
        Execute helper → "Hello JOHN"
        ↓
Pass 2: Resolve variables → "Hello JOHN"
        ↓
Output: "Hello JOHN"
```

### 2. Early Type Detection

```python
if isinstance(value, str):
    # Only strings need template processing
    return self._resolve_string(value, context)
else:
    # Numbers, booleans, None pass through
    return value
```

### 3. Pattern Caching

```python
# Regex patterns compiled once
VARIABLE_PATTERN = re.compile(r'\$\{([^}]+)\}')
HELPER_PATTERN = re.compile(r'\{\{([^}]+)\}\}')
```

## Error Handling

```
Template: "{{uppercase ${missing_var}}}"
                        ↓
Step 1: Resolve variable ${missing_var}
        ↓ variable not found
        Return original: "${missing_var}"
                        ↓
Step 2: Call helper uppercase("${missing_var}")
        ↓ execute anyway
        Return: "${MISSING_VAR}"
                        ↓
Final: "${MISSING_VAR}"
```

Graceful degradation: Invalid templates return original string rather than throwing errors.

## Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Pyramid                             │
│                                                             │
│                       ▲                                      │
│                      ╱ ╲                                     │
│                     ╱   ╲    Integration Tests              │
│                    ╱     ╲   (Full workflows)               │
│                   ╱───────╲                                  │
│                  ╱         ╲                                 │
│                 ╱  Unit     ╲  Function Tests               │
│                ╱   Tests     ╲ (Each helper)                │
│               ╱───────────────╲                              │
│              ╱                 ╲                             │
│             ╱   Variable Tests  ╲ (Path resolution)         │
│            ╱─────────────────────╲                           │
│                                                             │
│  80+ test cases covering:                                   │
│  • Variable resolution (simple, nested, arrays)             │
│  • Helper functions (all 40+)                               │
│  • Error handling                                           │
│  • Edge cases                                               │
│  • Real-world scenarios                                     │
└─────────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                 Security Boundaries                         │
│                                                             │
│  User Input → Template String                               │
│                      ↓                                       │
│                 ┌────────────┐                              │
│                 │ Validation │                              │
│                 └────────────┘                              │
│                      ↓                                       │
│            Template Engine                                  │
│                      ↓                                       │
│         ┌─────────────────────────┐                         │
│         │  Predefined Functions   │                         │
│         │  (No eval/exec)         │                         │
│         └─────────────────────────┘                         │
│                      ↓                                       │
│              Resolved Output                                │
│                                                             │
│  ✓ No arbitrary code execution                              │
│  ✓ No file system access                                    │
│  ✓ No network access                                        │
│  ✓ All operations sandboxed                                 │
└─────────────────────────────────────────────────────────────┘
```

---

*For implementation details, see: `backend/src/app/services/template_engine.py`*
