"""
Integration Service - Manages connector-based integrations.

Replaces the old Connection model with the new Integration model.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

from prisma import Prisma

# Import connectors - use try/except for import compatibility
try:
    from src.connectors import ConnectorRegistry
    from src.connectors.encryption import EncryptionService
    from src.connectors.base import AuthType
except ImportError:
    from ...connectors import ConnectorRegistry
    from ...connectors.encryption import EncryptionService
    from ...connectors.base import AuthType


class IntegrationService:
    """Service for managing connector integrations."""

    def __init__(self, db: Prisma):
        self.db = db
        self.registry = ConnectorRegistry()
        self.registry.discover_connectors()
        self.encryption = EncryptionService()

    async def list_integrations(
        self,
        user_id: str,
        connector_id: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        List integrations for a user.

        Args:
            user_id: User ID
            connector_id: Filter by connector ID
            category: Filter by category
            status: Filter by status

        Returns:
            List of integration dictionaries
        """
        where_clause = {"userId": user_id}

        if connector_id:
            where_clause["connectorId"] = connector_id
        if category:
            where_clause["category"] = category.upper()
        if status:
            where_clause["status"] = status.upper()

        integrations = await self.db.integration.find_many(
            where=where_clause,
            order={"createdAt": "desc"},
        )

        # Enrich with connector metadata
        result = []
        for integration in integrations:
            metadata = self.registry.get_metadata(integration.connectorId)

            result.append({
                "id": integration.id,
                "connector_id": integration.connectorId,
                "display_name": integration.displayName,
                "category": integration.category,
                "auth_type": integration.authType,
                "status": integration.status,
                "created_at": integration.createdAt.isoformat(),
                "updated_at": integration.updatedAt.isoformat(),
                "last_used_at": integration.lastUsed.isoformat() if integration.lastUsed else None,
                "connector_metadata": {
                    "name": metadata.name if metadata else integration.connectorId,
                    "description": metadata.description if metadata else None,
                    "icon": metadata.icon if metadata else None,
                } if metadata else None,
            })

        return result

    async def get_integration(self, integration_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific integration."""
        integration = await self.db.integration.find_first(
            where={"id": integration_id, "userId": user_id}
        )

        if not integration:
            return None

        metadata = self.registry.get_metadata(integration.connectorId)

        return {
            "id": integration.id,
            "connector_id": integration.connectorId,
            "display_name": integration.displayName,
            "category": integration.category,
            "auth_type": integration.authType,
            "status": integration.status,
            "created_at": integration.createdAt.isoformat(),
            "updated_at": integration.updatedAt.isoformat(),
            "last_used_at": integration.lastUsed.isoformat() if integration.lastUsed else None,
            "token_expires_at": integration.tokenExpiresAt.isoformat() if integration.tokenExpiresAt else None,
            "connector_metadata": {
                "name": metadata.name if metadata else integration.connectorId,
                "description": metadata.description if metadata else None,
                "icon": metadata.icon if metadata else None,
                "auth_type": metadata.auth_type if metadata else None,
            } if metadata else None,
        }

    async def create_integration(
        self,
        user_id: str,
        connector_id: str,
        display_name: str,
        credentials: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Create a new integration.

        Args:
            user_id: User ID
            connector_id: Connector identifier
            display_name: User-friendly name
            credentials: Connector credentials (will be encrypted)

        Returns:
            Created integration dictionary
        """
        # Validate connector exists
        if not self.registry.is_registered(connector_id):
            raise ValueError(f"Connector '{connector_id}' not found")

        metadata = self.registry.get_metadata(connector_id)

        # Encrypt credentials
        encrypted_data = self.encryption.encrypt_credentials(credentials)

        # Convert auth_type to uppercase for Prisma enum
        auth_type_upper = metadata.auth_type.upper() if metadata.auth_type else "NONE"

        # Create integration
        integration = await self.db.integration.create(
            data={
                "userId": user_id,
                "connectorId": connector_id,
                "displayName": display_name,
                "category": metadata.category.upper(),
                "authType": auth_type_upper,
                "encryptedData": encrypted_data,
                "status": "ACTIVE",
            }
        )

        return {
            "id": integration.id,
            "connector_id": integration.connectorId,
            "display_name": integration.displayName,
            "category": integration.category,
            "auth_type": integration.authType,
            "status": integration.status,
            "created_at": integration.createdAt.isoformat(),
        }

    async def update_integration(
        self,
        integration_id: str,
        user_id: str,
        display_name: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None,
        status: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update an integration."""
        # Verify ownership
        integration = await self.db.integration.find_first(
            where={"id": integration_id, "userId": user_id}
        )

        if not integration:
            raise ValueError(f"Integration '{integration_id}' not found")

        # Build update data
        update_data = {"updatedAt": datetime.utcnow()}

        if display_name is not None:
            update_data["displayName"] = display_name

        if credentials is not None:
            update_data["encryptedData"] = self.encryption.encrypt_credentials(
                credentials)

        if status is not None:
            update_data["status"] = status.upper()

        # Update integration
        updated = await self.db.integration.update(
            where={"id": integration_id},
            data=update_data,
        )

        return {
            "id": updated.id,
            "connector_id": updated.connectorId,
            "display_name": updated.displayName,
            "category": updated.category,
            "status": updated.status,
            "updated_at": updated.updatedAt.isoformat(),
        }

    async def delete_integration(self, integration_id: str, user_id: str) -> bool:
        """Delete an integration."""
        # Verify ownership
        integration = await self.db.integration.find_first(
            where={"id": integration_id, "userId": user_id}
        )

        if not integration:
            return False

        # Check if integration is used in any workflows
        workflows = await self.db.workflow.find_many(
            where={"userId": user_id}
        )

        for workflow in workflows:
            nodes_data = json.loads(workflow.nodes) if isinstance(
                workflow.nodes, str) else workflow.nodes
            for node in nodes_data:
                if node.get("data", {}).get("integrationId") == integration_id:
                    raise ValueError(
                        f"Integration is used in workflow '{workflow.name}'. "
                        "Please remove it from the workflow first."
                    )

        # Delete integration
        await self.db.integration.delete(where={"id": integration_id})
        return True

    async def test_integration(self, integration_id: str, user_id: str) -> Dict[str, Any]:
        """
        Test an integration by executing a simple test action.

        Returns:
            Test result with success status and details
        """
        # Get integration
        integration = await self.db.integration.find_first(
            where={"id": integration_id, "userId": user_id}
        )

        if not integration:
            raise ValueError(f"Integration '{integration_id}' not found")

        # Get connector
        connector = self.registry.get_connector(integration.connectorId)
        if not connector:
            raise ValueError(
                f"Connector '{integration.connectorId}' not found")

        # Decrypt credentials
        credentials = self.encryption.decrypt_credentials(
            integration.encryptedData)

        # Get first action to test
        actions = connector.get_actions()
        if not actions:
            return {
                "success": True,
                "message": "Connector has no actions to test",
                "connector": integration.connectorId,
            }

        test_action = actions[0]

        try:
            # Build minimal parameters for testing
            test_params = {}
            for param in test_action.params:
                if param.required:
                    # Use default or placeholder value
                    if param.default is not None:
                        test_params[param.name] = param.default
                    elif param.type == "string":
                        test_params[param.name] = "test"
                    elif param.type == "number":
                        test_params[param.name] = 1
                    elif param.type == "boolean":
                        test_params[param.name] = True

            # Execute test action
            result = await connector.execute(test_action.id, test_params, credentials)

            # Update last used timestamp
            await self.db.integration.update(
                where={"id": integration_id},
                data={"lastUsed": datetime.utcnow()},
            )

            return {
                "success": result.success,
                "message": "Integration test successful" if result.success else (result.error or "Test failed"),
                "connector": integration.connectorId,
                "action_tested": test_action.name,
                "details": result.data if result.success else None,
                "error": result.error if not result.success else None,
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Integration test failed: {str(e)}",
                "connector": integration.connectorId,
                "error": str(e),
            }

    async def get_integration_credentials(
        self, integration_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Get decrypted credentials for an integration.

        Used internally by workflow execution engine.
        """
        integration = await self.db.integration.find_first(
            where={"id": integration_id, "userId": user_id}
        )

        if not integration:
            raise ValueError(f"Integration '{integration_id}' not found")

        if integration.status != "ACTIVE":
            raise ValueError(f"Integration '{integration_id}' is not active")

        # Decrypt and return credentials
        return self.encryption.decrypt_credentials(integration.encryptedData)

    async def refresh_oauth_token(
        self, integration_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Refresh OAuth token for an integration.

        Returns:
            Updated integration with new tokens
        """
        integration = await self.db.integration.find_first(
            where={"id": integration_id, "userId": user_id}
        )

        if not integration:
            raise ValueError(f"Integration '{integration_id}' not found")

        if integration.authType != "oauth2":
            raise ValueError("Integration does not use OAuth 2.0")

        if not integration.refreshToken:
            raise ValueError("No refresh token available")

        # Get connector metadata for OAuth config
        metadata = self.registry.get_metadata(integration.connectorId)
        if not metadata or not metadata.oauth_config:
            raise ValueError("Connector does not support OAuth 2.0")

        # Use OAuth handler to refresh token
        from ...connectors.oauth_handler import OAuthHandler

        oauth_handler = OAuthHandler()
        credentials = self.encryption.decrypt_credentials(
            integration.encryptedData)

        client_id = credentials.get("client_id")
        client_secret = credentials.get("client_secret")

        if not client_id or not client_secret:
            raise ValueError("OAuth credentials missing")

        # Refresh the token
        token_data = await oauth_handler.refresh_token(
            refresh_token=integration.refreshToken,
            client_id=client_id,
            client_secret=client_secret,
            token_url=metadata.oauth_config["token_url"],
        )

        # Update integration with new tokens
        update_data = {
            "accessToken": token_data["access_token"],
            "updatedAt": datetime.utcnow(),
        }

        if "refresh_token" in token_data:
            update_data["refreshToken"] = token_data["refresh_token"]

        if "expires_in" in token_data:
            expires_at = datetime.utcnow()
            # Add expires_in seconds
            import datetime as dt
            expires_at = expires_at + \
                dt.timedelta(seconds=token_data["expires_in"])
            update_data["tokenExpiresAt"] = expires_at
            update_data["status"] = "ACTIVE"

        updated = await self.db.integration.update(
            where={"id": integration_id},
            data=update_data,
        )

        return {
            "id": updated.id,
            "status": updated.status,
            "token_expires_at": updated.tokenExpiresAt.isoformat() if updated.tokenExpiresAt else None,
            "message": "OAuth token refreshed successfully",
        }


# Global instance
_integration_service: Optional[IntegrationService] = None


def get_integration_service(db: Prisma) -> IntegrationService:
    """Get or create integration service instance."""
    global _integration_service
    if _integration_service is None:
        _integration_service = IntegrationService(db)
    return _integration_service
