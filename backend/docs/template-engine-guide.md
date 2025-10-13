# Workflow Template Engine Guide

## Overview

The Fuse Health workflow execution engine includes a powerful template system for accessing and transforming JSON data from node outputs. This guide explains how to use template functions in your workflows.

---

## Table of Contents

- [Basic Variable Substitution](#basic-variable-substitution)
- [Helper Functions](#helper-functions)
- [JSON Operations](#json-operations)
- [Array Operations](#array-operations)
- [String Operations](#string-operations)
- [Conditional Logic](#conditional-logic)
- [Math Operations](#math-operations)
- [Date Operations](#date-operations)
- [Type Conversion](#type-conversion)
- [Real-World Examples](#real-world-examples)

---

## Basic Variable Substitution

### Simple Variables

Access variables using `${variable}` syntax:

```
${email}  → "user@example.com"
${count}  → 42
${user}   → {"name": "John", "email": "john@example.com"}
```

### Nested Properties

Access nested object properties using dot notation:

```
${user.name}              → "John"
${user.profile.city}      → "New York"
${api_response.data.id}   → "12345"
```

### Array Access

Access array elements by index:

```
${items[0]}           → First item
${items[0].name}      → "First Item"
${users[2].email}     → "user3@example.com"
```

### Node Results

Access outputs from previous workflow nodes:

```
${node_abc123_result.data.message}      → "Operation completed"
${node_abc123_result.data.items[0]}     → First item from node output
${last_action_result.success}           → true/false
```

### String Interpolation

Embed variables in strings:

```
"Hello ${user.name}!"
"Order ${order.id} total: $${order.total}"
"Processing ${loop_index + 1} of ${total_count}"
```

---

## Helper Functions

Helper functions use the `{{function_name args}}` syntax.

### Syntax

```
{{function_name argument1 argument2 ...}}
```

Arguments can be:
- Literal strings: `'hello'` or `"hello"`
- Numbers: `42` or `3.14`
- Booleans: `true` or `false`
- Variable references: `${variable}`

### Combining with Variables

You can use variables as helper arguments:

```
{{uppercase ${user.name}}}
{{json_get node_result 'data.items[0]'}}
{{if ${count} > 0}}Yes{{else}}No{{endif}}
```

---

## JSON Operations

### json_get

Extract value from JSON object by path.

**Syntax:** `{{json_get object_name 'path.to.value'}}`

**Examples:**
```
{{json_get node_result 'data.message'}}
{{json_get api_response 'users[0].name'}}
{{json_get patient_data 'demographics.address.city'}}
```

### json_query (JSONPath)

Query JSON using JSONPath syntax (advanced filtering).

**Syntax:** `{{json_query object_name '$.jsonpath.expression'}}`

**Examples:**
```
# Get all names
{{json_query items '$.items[*].name'}}

# Filter by condition
{{json_query items '$.items[?(@.price > 10)]'}}

# Get nested values
{{json_query data '$.users[*].profile.city'}}
```

### parse_json

Parse JSON string to object.

**Syntax:** `{{parse_json 'json_string'}}`

**Example:**
```
{{parse_json '{"name": "John", "age": 30}'}}
```

### to_json

Convert value to JSON string.

**Syntax:** `{{to_json ${value}}}`

**Example:**
```
{{to_json ${user_data}}}
# Output: {"name":"John","email":"john@example.com"}
```

---

## Array Operations

### first / last

Get first or last item from array.

```
{{first ${items}}}                    → First item
{{last ${items}}}                     → Last item
```

### length

Get length of array, string, or object.

```
{{length ${items}}}                   → 5
{{length ${user.name}}}               → 8 (string length)
{{length ${object}}}                  → Number of keys
```

### slice

Extract portion of array.

**Syntax:** `{{slice ${array} start end}}`

```
{{slice ${items} 0 3}}                → First 3 items
{{slice ${items} 5 10}}               → Items 5-10
```

### join

Join array items into string.

**Syntax:** `{{join ${array} 'separator'}}`

```
{{join ${names} ', '}}                → "Alice, Bob, Charlie"
{{join ${tags} ' | '}}                → "admin | user | guest"
```

### pluck / map

Extract specific property from each array item.

**Syntax:** `{{pluck ${array} 'property_name'}}`

```
{{pluck ${users} 'name'}}             → ["Alice", "Bob", "Charlie"]
{{pluck ${orders} 'total'}}           → [45.00, 78.50, 120.00]
```

### filter

Filter array by property value.

**Syntax:** `{{filter ${array} 'property' 'value'}}`

```
{{filter ${users} 'role' 'admin'}}    → Only admin users
{{filter ${orders} 'status' 'completed'}}
```

### unique

Get unique items from array.

```
{{unique ${tags}}}                    → Remove duplicates
```

### flatten

Flatten nested arrays.

```
{{flatten ${nested_array}}}
# [[1,2], [3,4]] → [1,2,3,4]
```

### sort

Sort array items.

**Syntax:** `{{sort ${array} 'key' reverse}}`

```
{{sort ${items}}}                     → Sort primitives
{{sort ${users} 'name'}}              → Sort by name
{{sort ${products} 'price' true}}     → Sort by price descending
```

---

## String Operations

### uppercase / lowercase / capitalize

Change string case.

```
{{uppercase ${text}}}                 → "HELLO WORLD"
{{lowercase ${text}}}                 → "hello world"
{{capitalize ${text}}}                → "Hello world"
```

### trim

Remove whitespace from start and end.

```
{{trim ${text}}}                      → "hello" (from "  hello  ")
```

### split

Split string into array.

**Syntax:** `{{split ${text} 'separator'}}`

```
{{split ${csv_line} ','}}             → ["a", "b", "c"]
{{split ${text} ' '}}                 → Split by space
```

### replace

Replace text in string.

**Syntax:** `{{replace ${text} 'old' 'new'}}`

```
{{replace ${message} 'hello' 'hi'}}
{{replace ${path} '/' '\\'}}          → Replace slashes
```

### substring

Extract substring.

**Syntax:** `{{substring ${text} start end}}`

```
{{substring ${text} 0 5}}             → First 5 characters
{{substring ${text} 5}}               → From position 5 to end
```

### concat

Concatenate multiple strings.

```
{{concat ${first_name} ' ' ${last_name}}}
{{concat 'Order ' ${order_id} ' is ready'}}
```

---

## Conditional Logic

### if

Conditional value selection.

**Syntax:** `{{if condition true_value false_value}}`

```
{{if ${count} > 0 'Yes' 'No'}}
{{if ${status} 'Active' 'Inactive'}}
{{if ${is_admin} 'Admin Panel' 'User Panel'}}
```

### default

Provide default value if empty/null.

**Syntax:** `{{default ${value} 'default'}}`

```
{{default ${user.name} 'Anonymous'}}
{{default ${description} 'No description'}}
```

### is_empty

Check if value is empty.

```
{{is_empty ${text}}}                  → true/false
{{is_empty ${array}}}                 → true if length is 0
```

### is_null

Check if value is null.

```
{{is_null ${value}}}                  → true/false
```

### equals

Compare two values.

```
{{equals ${status} 'completed'}}      → true/false
{{equals ${count} 0}}                 → true/false
```

---

## Math Operations

### sum / avg / min / max

Aggregate numbers.

```
{{sum 10 20 30}}                      → 60
{{avg 10 20 30}}                      → 20
{{min 10 20 30}}                      → 10
{{max 10 20 30}}                      → 30
```

**With arrays (use pluck first):**
```
{{sum {{pluck ${orders} 'total'}}}}   → Sum of all order totals
```

### round / floor / ceil

Round numbers.

```
{{round 3.14159 2}}                   → 3.14
{{floor 3.7}}                         → 3
{{ceil 3.2}}                          → 4
```

---

## Date Operations

### now

Get current timestamp.

```
{{now}}                               → "2025-10-12T10:30:00"
{{now '%Y-%m-%d'}}                    → "2025-10-12"
{{now '%B %d, %Y'}}                   → "October 12, 2025"
```

### format_date

Format date string.

**Syntax:** `{{format_date ${date} 'format'}}`

```
{{format_date ${created_at} '%Y-%m-%d'}}
{{format_date ${timestamp} '%B %d, %Y at %I:%M %p'}}
```

**Common format codes:**
- `%Y` - Year (2025)
- `%m` - Month (01-12)
- `%d` - Day (01-31)
- `%H` - Hour 24h (00-23)
- `%I` - Hour 12h (01-12)
- `%M` - Minute (00-59)
- `%S` - Second (00-59)
- `%B` - Month name (October)
- `%A` - Weekday name (Monday)

### date_diff

Calculate difference between dates.

**Syntax:** `{{date_diff ${date1} ${date2} 'unit'}}`

**Units:** `days`, `hours`, `minutes`, `seconds`

```
{{date_diff ${end_date} ${start_date} 'days'}}
{{date_diff {{now}} ${created_at} 'hours'}}
```

---

## Type Conversion

### to_string / to_number / to_boolean

Convert types.

```
{{to_string 123}}                     → "123"
{{to_number "45.67"}}                 → 45.67
{{to_boolean "true"}}                 → true
```

---

## Real-World Examples

### Example 1: Email Generation

**Scenario:** Generate personalized email from order data.

```json
{
  "to": "${user.email}",
  "subject": "Order ${order.id} Confirmation",
  "body": "Hi {{capitalize ${user.name}}},\n\nYour order #${order.id} has been confirmed.\n\nItems:\n{{join {{pluck ${order.items} 'name'}} '\n- '}}\n\nTotal: ${{round ${order.total} 2}}\n\nExpected delivery: {{format_date ${order.delivery_date} '%B %d, %Y'}}\n\nThank you!"
}
```

**Output:**
```
To: john@example.com
Subject: Order 12345 Confirmation
Body:
Hi John,

Your order #12345 has been confirmed.

Items:
- Product 1
- Product 2
- Product 3

Total: $145.99

Expected delivery: October 20, 2025

Thank you!
```

### Example 2: Conditional Notification

**Scenario:** Send different messages based on status.

```json
{
  "message": "{{if ${status} == 'completed' 'Processing complete! {{length ${results}}} items processed.' 'Processing in progress...'}}",
  "priority": "{{if ${error_count} > 0 'high' 'normal'}}",
  "details": "{{if ${is_success} ${results} 'Check logs for errors'}}"
}
```

### Example 3: Data Aggregation

**Scenario:** Calculate statistics from API response.

```json
{
  "total_items": "{{length ${api_response.data.items}}}",
  "item_names": "{{join {{pluck ${api_response.data.items} 'name'}} ', '}}",
  "average_price": "{{avg {{pluck ${api_response.data.items} 'price'}}}}",
  "expensive_items": "{{filter ${api_response.data.items} 'price' > 100}}",
  "summary": "Found {{length ${api_response.data.items}}} items with average price of ${{round {{avg {{pluck ${api_response.data.items} 'price'}}}} 2}}"
}
```

### Example 4: Healthcare Data Processing

**Scenario:** Process patient records from FHIR API.

```json
{
  "patient_id": "${fhir_response.id}",
  "full_name": "{{concat ${fhir_response.name[0].given[0]} ' ' ${fhir_response.name[0].family}}}",
  "age": "{{date_diff {{now}} ${fhir_response.birthDate} 'days' / 365}}",
  "active_medications": "{{join {{pluck {{filter ${medications} 'status' 'active'}} 'name'}} ', '}}",
  "allergies": "{{default {{join {{pluck ${allergies} 'substance'}} ', '}} 'None reported'}}",
  "last_visit": "{{format_date ${last_encounter.date} '%B %d, %Y'}}"
}
```

### Example 5: Loop Processing with Transformations

**Scenario:** Process each item in a loop with transformations.

```json
{
  "nodes": [
    {
      "type": "loop",
      "config": {
        "items": "${api_response.data.patients}"
      }
    },
    {
      "type": "action",
      "config": {
        "patient_name": "{{uppercase ${loop_item.name}}}",
        "email_body": "Dear {{capitalize ${loop_item.name}}},\n\nYour appointment is on {{format_date ${loop_item.appointment} '%B %d'}}.",
        "tags": "{{join {{unique ${loop_item.tags}}} ', '}}",
        "is_priority": "{{if {{length {{filter ${loop_item.conditions} 'severity' 'high'}}}} > 0 true false}}"
      }
    }
  ]
}
```

### Example 6: Complex JSON Query

**Scenario:** Filter and transform complex nested data.

```json
{
  "high_value_orders": "{{json_query orders '$.orders[?(@.total > 100)]'}}",
  "vip_customer_names": "{{pluck {{json_query customers '$.customers[?(@.tier == \"VIP\")]'}} 'name'}}",
  "recent_orders": "{{json_query orders '$.orders[?(@.created_date > \"2025-01-01\")]'}}",
  "summary": "{{length {{json_query orders '$.orders[?(@.total > 100)]'}}}} high-value orders from VIP customers: {{join {{pluck {{json_query customers '$.customers[?(@.tier == \"VIP\")]'}} 'name'}} ', '}}"
}
```

---

## Best Practices

### 1. Use Specific Paths

Be explicit about paths to avoid ambiguity:

✅ Good: `${node_abc123_result.data.user.email}`
❌ Bad: `${data.email}` (which data?)

### 2. Provide Defaults

Always provide fallback values for optional data:

```
{{default ${user.phone} 'Not provided'}}
{{default ${description} 'No description available'}}
```

### 3. Validate Before Processing

Use conditional checks before operations:

```
{{if {{is_empty ${items}}} 'No items' {{join {{pluck ${items} 'name'}} ', '}}}}
```

### 4. Format for Readability

Use helper functions to format output:

```
{{capitalize ${status}}}
{{round ${price} 2}}
{{format_date ${timestamp} '%B %d, %Y'}}
```

### 5. Combine Operations

Chain operations for complex transformations:

```
{{uppercase {{trim {{replace ${text} '_' ' '}}}}}}
{{round {{avg {{pluck ${items} 'price'}}}} 2}}
```

### 6. Use JSONPath for Complex Queries

For advanced filtering, use JSONPath instead of multiple filters:

```
{{json_query data '$.users[?(@.age > 18 && @.active == true)]'}}
```

---

## Debugging Templates

### Check Variable Availability

Use simple substitution first to verify variable exists:

```
${variable}  # Does it resolve?
```

### Test Helper Functions

Test helper functions with known values:

```
{{uppercase 'hello'}}  # Should output: HELLO
```

### Use length to Inspect Arrays

Check if arrays have data:

```
Array length: {{length ${items}}}
```

### Print Intermediate Values

Store intermediate results in variables:

```json
{
  "debug_names": "{{pluck ${items} 'name'}}",
  "debug_count": "{{length ${items}}}",
  "result": "..."
}
```

---

## Performance Considerations

1. **Avoid Repeated Queries**: Store query results in variables instead of repeating the same query.

2. **Use Specific Paths**: `${data.items[0]}` is faster than `{{first ${data.items}}}`.

3. **Limit JSONPath Complexity**: Complex JSONPath expressions can be slow on large datasets.

4. **Cache in Variables**: If you use the same value multiple times, store it first:

```
Set variable: processed_items = {{pluck ${items} 'name'}}
Use: {{join ${processed_items} ', '}}
Use: {{length ${processed_items}}}
```

---

## Migration from Old System

The old system used only `${variable}` syntax. The new system is backward compatible, but offers enhanced features.

### Old Way
```
${items[0].name}
${user.email}
```

### New Way (Still Supported)
```
${items[0].name}  # Still works!
${user.email}     # Still works!
```

### New Enhanced Features
```
{{pluck ${items} 'name'}}          # Extract all names
{{uppercase ${user.email}}}        # Transform values
{{if ${count} > 0 'Yes' 'No'}}     # Conditional logic
```

---

## Summary

The Fuse Health template engine provides powerful tools for:

- ✅ **Accessing** JSON data with simple `${path}` syntax
- ✅ **Querying** with JSONPath for complex filtering
- ✅ **Transforming** with 40+ helper functions
- ✅ **Formatting** strings, dates, and numbers
- ✅ **Conditional** logic for dynamic content
- ✅ **Array** operations like filter, map, pluck, join
- ✅ **Math** operations for calculations
- ✅ **Type** conversion and validation

Use these templates in workflow node configurations to build powerful, data-driven automation workflows!
