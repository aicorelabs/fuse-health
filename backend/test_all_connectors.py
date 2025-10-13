"""
Comprehensive test script for all 10 connectors.

Tests connector discovery, metadata, actions, and validates structure.
"""
from connectors import ConnectorRegistry
from dotenv import load_dotenv
import sys
import os
from pathlib import Path

# Add backend/src to Python path
backend_src = Path(__file__).parent / "src"
sys.path.insert(0, str(backend_src))

load_dotenv()


# Initialize registry to discover all connectors
registry = ConnectorRegistry()
registry.discover_connectors()


def print_header(title: str):
    """Print a formatted header."""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")


def print_success(message: str):
    """Print success message."""
    print(f"✅ {message}")


def print_info(message: str):
    """Print info message."""
    print(f"ℹ️  {message}")


def test_connector_discovery():
    """Test that all 10 connectors are discovered."""
    print_header("Test 1: Connector Discovery")

    registry = ConnectorRegistry()
    connectors = registry.list_connectors()

    print_info(f"Discovered {len(connectors)} connector(s)")

    expected_connectors = {
        "openfda": "openFDA",
        "rxnorm": "RxNorm",
        "clinicaltrials": "ClinicalTrials.gov",
        "pubmed": "PubMed",
        "gmail": "Gmail",
        "slack": "Slack",
        "openai": "OpenAI",
        "anthropic": "Anthropic",
        "google_sheets": "Google Sheets",
        "http": "HTTP Request",
    }

    for connector_id, expected_name in expected_connectors.items():
        found = any(c.id == connector_id for c in connectors)
        if found:
            print_success(f"Found connector: {expected_name} ({connector_id})")
        else:
            print(f"❌ Missing connector: {expected_name} ({connector_id})")

    if len(connectors) == 10:
        print_success("All 10 connectors discovered!")
    else:
        print(f"⚠️  Expected 10 connectors, found {len(connectors)}")

    return len(connectors) == 10


def test_connector_categories():
    """Test that connectors are properly categorized."""
    print_header("Test 2: Connector Categories")

    registry = ConnectorRegistry()

    expected_categories = {
        "healthcare": ["openfda", "rxnorm", "clinicaltrials", "pubmed"],
        "communication": ["gmail", "slack"],
        "ai": ["openai", "anthropic"],
        "data": ["google_sheets"],
        "web": ["http"],
    }

    all_correct = True
    for category, connector_ids in expected_categories.items():
        connectors = registry.list_connectors(category=category)
        connector_id_list = [c.id for c in connectors]

        print_info(
            f"{category.upper()} category: {len(connectors)} connector(s)")

        for expected_id in connector_ids:
            if expected_id in connector_id_list:
                print_success(f"  - {expected_id}")
            else:
                print(f"  ❌ Missing {expected_id} in {category}")
                all_correct = False

    if all_correct:
        print_success("All connectors in correct categories!")

    return all_correct


def test_connector_metadata():
    """Test that all connectors have proper metadata."""
    print_header("Test 3: Connector Metadata")

    registry = ConnectorRegistry()
    connectors = registry.list_connectors()

    all_valid = True
    for metadata in connectors:
        # Check required fields
        required_fields = ["id", "name", "description",
                           "category", "auth_type", "icon"]
        missing_fields = [
            f for f in required_fields if not getattr(metadata, f, None)]

        if missing_fields:
            print(f"❌ {metadata.id}: Missing fields {missing_fields}")
            all_valid = False
        else:
            print_success(f"{metadata.name}: All metadata fields present")

    if all_valid:
        print_success("All connectors have valid metadata!")

    return all_valid


def test_connector_actions():
    """Test that all connectors have defined actions."""
    print_header("Test 4: Connector Actions")

    registry = ConnectorRegistry()
    connectors = registry.list_connectors()

    total_actions = 0
    for metadata in connectors:
        connector = registry.get_connector(metadata.id)

        if connector:
            actions = connector.get_actions()
            action_count = len(actions)
            total_actions += action_count

            print_info(f"{metadata.name}: {action_count} action(s)")
            for action in actions:
                param_count = len(action.params)
                required_count = sum(1 for p in action.params if p.required)
                print(
                    f"    - {action.name} ({param_count} params, {required_count} required)")
        else:
            print(f"❌ Failed to load connector: {metadata.id}")

    print_success(f"Total: {total_actions} actions across all connectors")
    return total_actions > 0


def test_auth_types():
    """Test authentication type distribution."""
    print_header("Test 5: Authentication Types")

    registry = ConnectorRegistry()
    connectors = registry.list_connectors()

    auth_distribution = {}
    for metadata in connectors:
        auth_type = metadata.auth_type
        auth_distribution[auth_type] = auth_distribution.get(auth_type, 0) + 1

    for auth_type, count in sorted(auth_distribution.items()):
        print_info(f"{auth_type}: {count} connector(s)")

    print_success("Authentication type distribution analyzed")
    return True


def test_oauth_connectors():
    """Test that OAuth connectors have proper configuration."""
    print_header("Test 6: OAuth Configuration")

    registry = ConnectorRegistry()
    connectors = registry.list_connectors()

    oauth_connectors = [c for c in connectors if c.auth_type == "oauth2"]

    print_info(f"Found {len(oauth_connectors)} OAuth connector(s)")

    all_valid = True
    for metadata in oauth_connectors:
        oauth_config = metadata.oauth_config or {}

        required_fields = ["authorization_url", "token_url", "scopes"]
        missing = [f for f in required_fields if not oauth_config.get(f)]

        if missing:
            print(f"❌ {metadata.name}: Missing OAuth fields {missing}")
            all_valid = False
        else:
            scopes_count = len(oauth_config.get("scopes", []))
            print_success(
                f"{metadata.name}: OAuth config valid ({scopes_count} scopes)")

    return all_valid


def test_public_api_connectors():
    """Test connectors that don't require authentication."""
    print_header("Test 7: Public API Connectors")

    registry = ConnectorRegistry()
    connectors = registry.list_connectors()

    public_connectors = [c for c in connectors if c.auth_type == "none"]

    print_info(f"Found {len(public_connectors)} public API connector(s)")

    for metadata in public_connectors:
        print_success(f"{metadata.name} - No authentication required")

    return True


def test_registry_statistics():
    """Test registry statistics."""
    print_header("Test 8: Registry Statistics")

    registry = ConnectorRegistry()

    stats = {
        "total_connectors": registry.count(),
        "categories": registry.get_categories(),
        "connector_ids": registry.get_connector_ids(),
    }

    print_info(f"Total connectors: {stats['total_connectors']}")
    print_info(f"Categories: {', '.join(stats['categories'])}")
    print_info(f"Connector IDs: {', '.join(stats['connector_ids'])}")

    print_success("Registry statistics retrieved")
    return True


def run_all_tests():
    """Run all tests and report results."""
    print_header("🚀 Starting Connector Test Suite")

    tests = [
        ("Connector Discovery", test_connector_discovery),
        ("Connector Categories", test_connector_categories),
        ("Connector Metadata", test_connector_metadata),
        ("Connector Actions", test_connector_actions),
        ("Authentication Types", test_auth_types),
        ("OAuth Configuration", test_oauth_connectors),
        ("Public API Connectors", test_public_api_connectors),
        ("Registry Statistics", test_registry_statistics),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test '{test_name}' failed with error: {str(e)}")
            results.append((test_name, False))

    # Print summary
    print_header("📊 Test Summary")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\n{'='*70}")
    print(f"Results: {passed}/{total} tests passed")
    print(f"{'='*70}")

    if passed == total:
        print("\n🎉 All tests passed! Connector system is ready.")
        return 0
    else:
        print(
            f"\n⚠️  {total - passed} test(s) failed. Please review the output above.")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
