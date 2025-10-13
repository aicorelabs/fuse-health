#!/usr/bin/env python
"""Test the node-types endpoint to verify actions are included."""

import asyncio
from src.connectors.registry import ConnectorRegistry
from src.app.views.workflow_routes import get_node_types


async def test_node_types():
    """Test the get_node_types endpoint."""
    # Initialize registry
    registry = ConnectorRegistry()
    registry.discover_connectors()
    
    print("\n" + "="*60)
    print("Testing /workflows/node-types endpoint")
    print("="*60 + "\n")
    
    # Mock db dependency (not needed for this test since user_id is None)
    result = await get_node_types(user_id=None, db=None)
    
    # Check action nodes
    print("📧 ACTION NODES:")
    print("-" * 60)
    for node in result['action'][:3]:  # Show first 3
        print(f"\n{node['label']} ({node['id']})")
        print(f"  Description: {node['description']}")
        print(f"  Icon: {node.get('icon', 'N/A')}")
        print(f"  Auth Type: {node.get('auth_type', 'N/A')}")
        print(f"  Activated: {node.get('activated', False)}")
        
        actions = node.get('actions', [])
        print(f"  Actions ({len(actions)}):")
        for action in actions:
            print(f"    • {action['name']} ({action['id']})")
            print(f"      Description: {action['description']}")
            print(f"      Parameters: {len(action['params'])}")
            for param in action['params']:
                req = "required" if param['required'] else "optional"
                print(f"        - {param['name']} ({param['type']}) [{req}]")
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY:")
    print("="*60)
    print(f"Trigger nodes: {len(result['trigger'])}")
    print(f"Action nodes: {len(result['action'])}")
    print(f"Data nodes: {len(result['data'])}")
    print(f"Logic nodes: {len(result['logic'])}")
    print(f"AI nodes: {len(result['ai'])}")
    
    # Count total actions
    total_actions = sum(len(node.get('actions', [])) for node in result['action'])
    total_actions += sum(len(node.get('actions', [])) for node in result['data'])
    total_actions += sum(len(node.get('actions', [])) for node in result['ai'])
    print(f"\nTotal actions available: {total_actions}")
    print("\n✅ Test completed successfully!\n")


if __name__ == "__main__":
    asyncio.run(test_node_types())
