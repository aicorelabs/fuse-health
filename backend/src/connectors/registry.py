"""
Connector registry for automatic discovery and management.

The registry automatically discovers all connector classes from the
filesystem and provides methods to list, search, and retrieve them.
"""

import importlib
import inspect
from pathlib import Path
from typing import Dict, List, Optional, Type
import sys

from .base import BaseConnector, ConnectorCategory, ConnectorMetadata


class ConnectorRegistry:
    """
    Central registry for connector discovery and management.

    Features:
    - Auto-discovery of connectors from filesystem
    - Lazy loading (only load connector when needed)
    - Caching of metadata for performance
    - Category filtering and search
    - Thread-safe singleton pattern

    Usage:
        registry = ConnectorRegistry()
        connectors = registry.list_connectors(category="healthcare")
        connector = registry.get_connector("openfda")
    """

    _instance = None
    _initialized = False

    def __new__(cls):
        """Singleton pattern to ensure only one registry instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize registry (only once)."""
        if not self._initialized:
            self._connectors: Dict[str, Type[BaseConnector]] = {}
            self._metadata_cache: Dict[str, ConnectorMetadata] = {}
            self._initialized = True

    def discover_connectors(self, base_path: Optional[str] = None):
        """
        Auto-discover all connectors from filesystem.

        Scans the connectors directory for Python files that define
        BaseConnector subclasses and automatically registers them.

        Args:
            base_path: Path to connectors directory (defaults to this package)
        """
        if base_path is None:
            # Default to the connectors package directory
            base_path = Path(__file__).parent
        else:
            base_path = Path(base_path)

        print(f"🔍 Discovering connectors in {base_path}")

        # Determine the correct module prefix based on how this module was imported
        # Check __name__ to see if we're imported as 'connectors.registry' or 'src.connectors.registry'
        if __name__.startswith("src.connectors"):
            module_prefix = "src.connectors"
        elif __name__.startswith("connectors"):
            module_prefix = "connectors"
        else:
            # Fallback: try to determine from file path
            if "src/connectors" in str(base_path) or "src\\connectors" in str(base_path):
                module_prefix = "src.connectors"
            else:
                module_prefix = "connectors"

        print(f"📦 Using module prefix: {module_prefix}")

        # Scan all subdirectories (categories)
        for category_dir in base_path.iterdir():
            if not category_dir.is_dir():
                continue
            if category_dir.name.startswith("_"):
                continue
            if category_dir.name in ["__pycache__"]:
                continue

            # Scan connector files
            for connector_file in category_dir.glob("*.py"):
                if connector_file.name.startswith("_"):
                    continue

                # Build module path with correct prefix
                # e.g., "src.connectors.healthcare.openfda" or "connectors.healthcare.openfda"
                module_path = f"{module_prefix}.{category_dir.name}.{connector_file.stem}"

                try:
                    # Import module
                    module = importlib.import_module(module_path)

                    # Find BaseConnector subclasses
                    for name, obj in inspect.getmembers(module, inspect.isclass):
                        if (issubclass(obj, BaseConnector) and
                            obj != BaseConnector and
                                obj.__module__ == module_path):  # Only classes defined in this module

                            # Instantiate and register
                            try:
                                connector_instance = obj()
                                metadata = connector_instance.get_metadata()
                                self.register(metadata.id, obj, metadata)
                                print(
                                    f"✅ Registered: {metadata.name} ({metadata.id})")
                            except Exception as e:
                                print(f"⚠️  Failed to instantiate {name}: {e}")

                except Exception as e:
                    print(
                        f"❌ Failed to load connector from {module_path}: {e}")

        print(
            f"✨ Discovery complete. {len(self._connectors)} connectors registered.\n")

    def register(
        self,
        connector_id: str,
        connector_class: Type[BaseConnector],
        metadata: Optional[ConnectorMetadata] = None
    ):
        """
        Manually register a connector.

        Args:
            connector_id: Unique connector identifier
            connector_class: Connector class (not instance)
            metadata: Optional pre-computed metadata for caching
        """
        self._connectors[connector_id] = connector_class

        if metadata:
            self._metadata_cache[connector_id] = metadata

    def unregister(self, connector_id: str):
        """
        Unregister a connector.

        Args:
            connector_id: Connector identifier to remove
        """
        self._connectors.pop(connector_id, None)
        self._metadata_cache.pop(connector_id, None)

    def get_connector(self, connector_id: str) -> Optional[BaseConnector]:
        """
        Get connector instance by ID.

        Args:
            connector_id: Connector identifier

        Returns:
            Connector instance, or None if not found
        """
        connector_class = self._connectors.get(connector_id)
        if connector_class:
            return connector_class()
        return None

    def get_metadata(self, connector_id: str) -> Optional[ConnectorMetadata]:
        """
        Get connector metadata without instantiating.

        This is more efficient than get_connector() when you only
        need metadata.

        Args:
            connector_id: Connector identifier

        Returns:
            ConnectorMetadata, or None if not found
        """
        # Check cache first
        if connector_id in self._metadata_cache:
            return self._metadata_cache[connector_id]

        # Load and cache
        connector = self.get_connector(connector_id)
        if connector:
            metadata = connector.get_metadata()
            self._metadata_cache[connector_id] = metadata
            return metadata

        return None

    def list_connectors(
        self,
        category: Optional[ConnectorCategory] = None,
        auth_type: Optional[str] = None
    ) -> List[ConnectorMetadata]:
        """
        List all registered connectors with optional filtering.

        Args:
            category: Filter by category
            auth_type: Filter by authentication type

        Returns:
            List of ConnectorMetadata objects
        """
        metadatas = []

        for connector_id in self._connectors.keys():
            metadata = self.get_metadata(connector_id)
            if metadata:
                # Apply filters
                if category and metadata.category != category:
                    continue
                if auth_type and metadata.auth_type != auth_type:
                    continue

                metadatas.append(metadata)

        # Sort by name
        metadatas.sort(key=lambda m: m.name)

        return metadatas

    def search(self, query: str) -> List[ConnectorMetadata]:
        """
        Search connectors by name or description.

        Args:
            query: Search query (case-insensitive)

        Returns:
            List of matching ConnectorMetadata objects
        """
        query_lower = query.lower()
        results = []

        for metadata in self.list_connectors():
            if (query_lower in metadata.name.lower() or
                query_lower in metadata.description.lower() or
                    query_lower in metadata.id.lower()):
                results.append(metadata)

        return results

    def get_connector_ids(self) -> List[str]:
        """
        Get list of all registered connector IDs.

        Returns:
            List of connector IDs
        """
        return list(self._connectors.keys())

    def is_registered(self, connector_id: str) -> bool:
        """
        Check if a connector is registered.

        Args:
            connector_id: Connector identifier

        Returns:
            True if registered, False otherwise
        """
        return connector_id in self._connectors

    def get_categories(self) -> List[str]:
        """
        Get list of all categories that have connectors.

        Returns:
            List of category names
        """
        categories = set()
        for metadata in self.list_connectors():
            categories.add(metadata.category)
        return sorted(list(categories))

    def count(self) -> int:
        """
        Get total number of registered connectors.

        Returns:
            Number of connectors
        """
        return len(self._connectors)

    def clear(self):
        """Clear all registered connectors (mainly for testing)."""
        self._connectors.clear()
        self._metadata_cache.clear()

    def __str__(self) -> str:
        """String representation."""
        return f"ConnectorRegistry({self.count()} connectors)"

    def __repr__(self) -> str:
        """Detailed representation."""
        return f"<ConnectorRegistry connectors={list(self._connectors.keys())}>"


# Global registry instance
registry = ConnectorRegistry()


def init_registry():
    """
    Initialize the global registry with auto-discovery.

    Call this at application startup to discover and register
    all available connectors.
    """
    registry.discover_connectors()


# Auto-initialize on import (can be disabled if needed)
# Uncomment the line below to enable auto-discovery
# init_registry()
