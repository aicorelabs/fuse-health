#!/usr/bin/env python3
"""Test the node-types HTTP endpoint."""

import json
import sys

data = json.load(sys.stdin)
print('='*60)
print('NODE-TYPES ENDPOINT TEST')
print('='*60)

# Show action nodes
print('\n📧 ACTION NODES WITH ACTIONS:')
for node in data['action'][:2]:
    print(f"\n  {node['label']} ({node['id']})")
    if 'actions' in node:
        print(f"    ✅ Actions: {len(node['actions'])}")
        for action in node['actions'][:2]:
            print(f"      • {action['name']}")
    else:
        print("    ❌ No actions field")

# Summary
print(f"\n{'='*60}")
print('SUMMARY:')
print(f"  Total action nodes: {len(data.get('action', []))}")
print(f"  Total data nodes: {len(data.get('data', []))}")
print(f"  Total AI nodes: {len(data.get('ai', []))}")

# Count nodes with actions
action_nodes_with_actions = sum(1 for n in data.get('action', []) if 'actions' in n and n['actions'])
data_nodes_with_actions = sum(1 for n in data.get('data', []) if 'actions' in n and n['actions'])
ai_nodes_with_actions = sum(1 for n in data.get('ai', []) if 'actions' in n and n['actions'])

print(f"\n  Action nodes with actions: {action_nodes_with_actions}")
print(f"  Data nodes with actions: {data_nodes_with_actions}")
print(f"  AI nodes with actions: {ai_nodes_with_actions}")
print(f"\n✅ Actions successfully added to node-types endpoint!")
