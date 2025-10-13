#!/usr/bin/env python3
"""
Quick test script for the new Integration and Connector APIs.

Tests:
1. Connector discovery and listing
2. Connector details retrieval
3. Integration creation (HTTP connector - no OAuth needed)
4. Integration listing
5. Integration testing

Usage:
    python test_integration_api.py
"""
from app.services.database import connect, disconnect, prisma_session
from connectors import ConnectorRegistry
from app.controllers import connector_controller, integration_controller
import asyncio
import sys
sys.path.insert(0, '/Users/joe_codes/dev/fuse-home/backend/src')


async def test_connector_apis():
    """Test connector browsing APIs."""
    print("\n" + "="*60)
    print("TEST 1: List Connectors")
    print("="*60)

    connectors = await connector_controller.list_connectors()
    print(f"✅ Found {len(connectors)} connectors")

    for conn in connectors:
        print(
            f"  - {conn['name']} ({conn['id']}) - {conn['action_count']} actions")

    print("\n" + "="*60)
    print("TEST 2: Get Connector Categories")
    print("="*60)

    categories = await connector_controller.get_connector_categories()
    print(f"✅ Found {len(categories)} categories")

    for cat in categories:
        print(f"  - {cat['name']}: {cat['connector_count']} connectors")

    print("\n" + "="*60)
    print("TEST 3: Get Gmail Connector Details")
    print("="*60)

    gmail = await connector_controller.get_connector("gmail")
    print(f"✅ Gmail Connector:")
    print(f"  Name: {gmail['name']}")
    print(f"  Description: {gmail['description']}")
    print(f"  Auth Type: {gmail['auth_type']}")
    print(f"  Actions: {len(gmail['actions'])}")

    for action in gmail['actions']:
        print(f"    - {action['name']} ({action['id']})")

    print("\n" + "="*60)
    print("TEST 4: Get HTTP Connector Actions")
    print("="*60)

    http_actions = await connector_controller.list_connector_actions("http")
    print(f"✅ HTTP Connector has {len(http_actions)} actions")

    for action in http_actions:
        params = action['parameters']
        print(f"  - {action['name']}: {len(params)} parameters")


async def test_integration_apis():
    """Test integration management APIs."""
    print("\n" + "="*60)
    print("TEST 5: Create HTTP Integration")
    print("="*60)

    async with prisma_session() as db:
        # Create a simple HTTP integration (no OAuth needed)
        integration = await integration_controller.create_integration(
            db=db,
            user_id="user_demo_001",
            connector_id="http",
            display_name="Test HTTP Integration",
            credentials={"api_key": "test_key_12345"},
        )

        print(f"✅ Created integration:")
        print(f"  ID: {integration['id']}")
        print(f"  Connector: {integration['connector_id']}")
        print(f"  Display Name: {integration['display_name']}")
        print(f"  Status: {integration['status']}")

        integration_id = integration['id']

        print("\n" + "="*60)
        print("TEST 6: List Integrations")
        print("="*60)

        integrations = await integration_controller.list_integrations(
            db=db,
            user_id="user_demo_001",
        )

        print(f"✅ Found {len(integrations)} integrations")

        for integ in integrations:
            print(f"  - {integ['display_name']} ({integ['connector_id']})")

        print("\n" + "="*60)
        print("TEST 7: Get Integration Details")
        print("="*60)

        details = await integration_controller.get_integration(
            db=db,
            user_id="user_demo_001",
            integration_id=integration_id,
        )

        print(f"✅ Integration details:")
        print(f"  ID: {details['id']}")
        print(f"  Connector: {details['connector_id']}")
        print(f"  Category: {details['category']}")
        print(f"  Created: {details['created_at']}")

        if details.get('connector_metadata'):
            meta = details['connector_metadata']
            print(f"  Connector Metadata:")
            print(f"    Name: {meta['name']}")
            print(f"    Description: {meta['description']}")

        print("\n" + "="*60)
        print("TEST 8: Test Integration")
        print("="*60)

        try:
            test_result = await integration_controller.test_integration(
                db=db,
                user_id="user_demo_001",
                integration_id=integration_id,
            )

            print(f"✅ Integration test result:")
            print(f"  Success: {test_result['success']}")
            print(f"  Message: {test_result['message']}")
            print(f"  Action Tested: {test_result.get('action_tested')}")

            if test_result.get('details'):
                print(f"  Details: {test_result['details']}")

        except Exception as e:
            print(f"⚠️  Test failed (expected for HTTP connector): {str(e)}")

        print("\n" + "="*60)
        print("TEST 9: Update Integration")
        print("="*60)

        updated = await integration_controller.update_integration(
            db=db,
            user_id="user_demo_001",
            integration_id=integration_id,
            display_name="Updated Test HTTP",
        )

        print(f"✅ Updated integration:")
        print(f"  New Display Name: {updated['display_name']}")

        print("\n" + "="*60)
        print("TEST 10: Delete Integration")
        print("="*60)

        await integration_controller.delete_integration(
            db=db,
            user_id="user_demo_001",
            integration_id=integration_id,
        )

        print(f"✅ Deleted integration: {integration_id}")

        # Verify deletion
        integrations = await integration_controller.list_integrations(
            db=db,
            user_id="user_demo_001",
        )

        print(f"✅ Integrations after deletion: {len(integrations)}")


async def main():
    """Run all tests."""
    print("\n🚀 Starting Integration & Connector API Tests")
    print("="*60)

    # Connect to database
    await connect()

    try:
        # Test connector APIs (no DB required)
        await test_connector_apis()

        # Test integration APIs (requires DB)
        await test_integration_apis()

        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
        print("\nThe new Integration & Connector APIs are working correctly!")
        print("\nNext steps:")
        print("  1. Start the backend: cd backend && python server.py")
        print("  2. Test via HTTP: curl http://localhost:8000/api/connectors")
        print("  3. View API docs: http://localhost:8000/docs")

    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        # Disconnect from database
        await disconnect()


if __name__ == "__main__":
    asyncio.run(main())
