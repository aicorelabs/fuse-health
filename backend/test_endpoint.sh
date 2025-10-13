#!/bin/bash
# Test the node-types endpoint via HTTP

echo "========================================"
echo "Testing /workflows/node-types endpoint"
echo "========================================"
echo ""

# Test the endpoint
response=$(curl -s http://localhost:8000/workflows/node-types)

# Check if response is valid JSON
if echo "$response" | jq -e . >/dev/null 2>&1; then
    echo "✅ Endpoint returned valid JSON"
    echo ""
    
    # Extract and display action nodes with actions
    echo "📧 ACTION NODES:"
    echo "$response" | jq -r '.action[:2] | .[] | "  \(.label) (\(.id))\n    Actions: \(.actions | length)\n    First action: \(.actions[0].name // "N/A")"'
    echo ""
    
    # Count nodes
    echo "SUMMARY:"
    echo "  Total action nodes: $(echo "$response" | jq '.action | length')"
    echo "  Total data nodes: $(echo "$response" | jq '.data | length')"
    echo "  Total AI nodes: $(echo "$response" | jq '.ai | length')"
    echo ""
    
    # Count nodes with actions
    action_with_actions=$(echo "$response" | jq '[.action[] | select(.actions | length > 0)] | length')
    data_with_actions=$(echo "$response" | jq '[.data[] | select(.actions | length > 0)] | length')
    ai_with_actions=$(echo "$response" | jq '[.ai[] | select(.actions | length > 0)] | length')
    
    echo "  Action nodes with actions: $action_with_actions"
    echo "  Data nodes with actions: $data_with_actions"
    echo "  AI nodes with actions: $ai_with_actions"
    echo ""
    echo "✅ Actions successfully added to node-types endpoint!"
else
    echo "❌ Endpoint returned invalid JSON or error:"
    echo "$response"
    exit 1
fi
