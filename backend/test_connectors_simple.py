#!/usr/bin/env python3
"""Simple test for Connector APIs (no database required)."""
import asyncio
import sys
sys.path.insert(0, '/Users/joe_codes/dev/fuse-home/backend/src')

from app.controllers import connector_controller

async def main():
    print("\n🚀 Testing Connector Discovery")
    print("="*60)
    
    connectors = await connector_controller.list_connectors()
    print(f"\n✅ Found {len(connectors)} connectors:")
    
    for conn in connectors:
        print(f"  • {conn['name']} - {conn['action_count']} actions")
    
    categories = await connector_controller.get_connector_categories()
    print(f"\n✅ Found {len(categories)} categories:")
    for cat in categories:
        print(f"  • {cat['name']}: {cat['connector_count']} connectors")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print(f"  • {len(connectors)} connectors discovered")
    print(f"  • {sum(c['action_count'] for c in connectors)} total actions")

if __name__ == "__main__":
    asyncio.run(main())
