"""Base connector class and core types."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class ConnectorCategory(str, Enum):
    """Categories for organizing connectors."""
    HEALTHCARE = "healthcare"
    COMMUNICATION = "communication"
    AI = "ai"
    DATA = "data"
    PRODUCTIVITY = "productivity"
    STORAGE = "storage"
    WEB = "web"
    OTHER = "other"


class AuthType(str, Enum):
    """Authentication types supported by connectors."""
    OAUTH2 = "oauth2"
    API_KEY = "api_key"
    BASIC_AUTH = "basic_auth"
    BEARER_TOKEN = "bearer_token"
    CLIENT_CREDENTIALS = "client_credentials"
    SSH_KEY = "ssh_key"
    NONE = "none"  # For public APIs


class ConnectorMetadata(BaseModel):
    """
    Metadata describing a connector.

    This information is used to display the connector in the UI
    and configure its integration.
    """
    id: str = Field(...,
                    description="Unique connector identifier (e.g., 'openfda')")
    name: str = Field(..., description="Display name (e.g., 'openFDA')")
    description: str = Field(...,
                             description="Brief description of what the connector does")
    category: ConnectorCategory = Field(...,
                                        description="Category for organization")
    auth_type: AuthType = Field(...,
                                description="Authentication method required")

    # Visual presentation
    icon: Optional[str] = Field(None, description="Emoji or icon URL")
    color: Optional[str] = Field(None, description="Hex color for UI theming")

    # Documentation
    docs_url: Optional[str] = Field(
        None, description="Link to connector documentation")
    homepage: Optional[str] = Field(
        None, description="Link to service homepage")

    # Configuration
    requires_credentials: bool = Field(
        True, description="Whether credentials are required")
    supports_oauth: bool = Field(
        False, description="Whether OAuth is supported")
    oauth_config: Optional[Dict[str, Any]] = Field(
        None, description="OAuth configuration")

    # Rate limiting info (informational)
    rate_limit: Optional[Dict[str, Any]] = Field(
        None, description="Rate limit information")

    # Versioning
    version: str = Field("1.0.0", description="Connector version")

    class Config:
        use_enum_values = True


class ActionParameter(BaseModel):
    """Definition for an action parameter."""
    name: str = Field(..., description="Parameter name")
    type: str = Field(...,
                      description="Parameter type (string, number, boolean, object, array)")
    description: str = Field(..., description="Parameter description")
    required: bool = Field(False, description="Whether parameter is required")
    default: Optional[Any] = Field(None, description="Default value")
    options: Optional[List[str]] = Field(
        None, description="Allowed values (for enum-like params)")
    validation: Optional[Dict[str, Any]] = Field(
        None, description="JSON schema validation rules")
    placeholder: Optional[str] = Field(
        None, description="Placeholder text for UI")


class ConnectorAction(BaseModel):
    """
    Action that can be performed by a connector.

    Actions represent the operations available in the workflow builder.
    """
    id: str = Field(...,
                    description="Unique action identifier (e.g., 'search_drugs')")
    name: str = Field(..., description="Display name (e.g., 'Search Drugs')")
    description: str = Field(..., description="What the action does")
    category: str = Field(...,
                          description="Action category (query, write, transform)")

    # Parameters
    params: List[ActionParameter] = Field(
        default_factory=list, description="Action parameters")

    # Output
    output_schema: Optional[Dict[str, Any]] = Field(
        None, description="JSON schema for output")

    # Execution configuration
    async_execution: bool = Field(
        False, description="Whether action runs asynchronously")
    timeout: int = Field(30, description="Timeout in seconds")
    retry_config: Optional[Dict[str, Any]] = Field(
        None, description="Retry configuration")


class ConnectorResult(BaseModel):
    """Result from connector execution."""
    success: bool = Field(..., description="Whether execution succeeded")
    data: Optional[Any] = Field(None, description="Result data")
    error: Optional[str] = Field(None, description="Error message if failed")
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata")
    execution_time_ms: Optional[int] = Field(
        None, description="Execution time in milliseconds")


class BaseConnector(ABC):
    """
    Base class for all connectors.

    To create a new connector:
    1. Subclass BaseConnector
    2. Implement get_metadata() to return connector info
    3. Implement get_actions() to define available actions
    4. Implement execute() to handle action execution
    5. Optionally override validate_credentials() for credential testing
    """

    @abstractmethod
    def get_metadata(self) -> ConnectorMetadata:
        """
        Return connector metadata.

        This information is used to display the connector in the UI
        and configure authentication.

        Returns:
            ConnectorMetadata with connector information
        """
        pass

    @abstractmethod
    def get_actions(self) -> List[ConnectorAction]:
        """
        Return list of available actions.

        Each action represents an operation that can be used
        in the workflow builder.

        Returns:
            List of ConnectorAction objects
        """
        pass

    @abstractmethod
    async def execute(
        self,
        action_id: str,
        credentials: Dict[str, Any],
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> ConnectorResult:
        """
        Execute an action.

        Args:
            action_id: ID of the action to execute
            credentials: Decrypted credentials (API keys, tokens, etc.)
            parameters: Action parameters from workflow node
            context: Execution context (workflow_id, execution_id, etc.)

        Returns:
            ConnectorResult with success status and data/error

        Raises:
            ValueError: If action_id is invalid
            Exception: For execution errors (should be caught and returned in result)
        """
        pass

    async def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        """
        Validate credentials by testing API connectivity.

        Default implementation returns True. Override this method
        to test credentials against the actual API.

        Args:
            credentials: Decrypted credentials to validate

        Returns:
            True if credentials are valid, False otherwise
        """
        return True

    async def refresh_credentials(
        self,
        credentials: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Refresh credentials if applicable (e.g., OAuth token refresh).

        Default implementation returns None (no refresh needed).
        Override for OAuth connectors.

        Args:
            credentials: Current credentials including refresh token

        Returns:
            New credentials dict with refreshed tokens, or None if not applicable
        """
        return None

    def get_action(self, action_id: str) -> Optional[ConnectorAction]:
        """
        Get action definition by ID.

        Args:
            action_id: Action identifier

        Returns:
            ConnectorAction if found, None otherwise
        """
        for action in self.get_actions():
            if action.id == action_id:
                return action
        return None

    def validate_parameters(
        self,
        action_id: str,
        parameters: Dict[str, Any]
    ) -> tuple[bool, Optional[str]]:
        """
        Validate parameters against action schema.

        Args:
            action_id: Action identifier
            parameters: Parameters to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        action = self.get_action(action_id)
        if not action:
            return False, f"Action '{action_id}' not found"

        # Check required parameters
        for param in action.params:
            if param.required and param.name not in parameters:
                return False, f"Missing required parameter: {param.name}"

        # Check parameter types (basic validation)
        for param_name, param_value in parameters.items():
            param_def = next(
                (p for p in action.params if p.name == param_name),
                None
            )
            if not param_def:
                continue  # Unknown parameter, allow it

            # Type validation
            expected_type = param_def.type
            if expected_type == "string" and not isinstance(param_value, str):
                return False, f"Parameter '{param_name}' must be a string"
            elif expected_type == "number" and not isinstance(param_value, (int, float)):
                return False, f"Parameter '{param_name}' must be a number"
            elif expected_type == "boolean" and not isinstance(param_value, bool):
                return False, f"Parameter '{param_name}' must be a boolean"
            elif expected_type == "array" and not isinstance(param_value, list):
                return False, f"Parameter '{param_name}' must be an array"
            elif expected_type == "object" and not isinstance(param_value, dict):
                return False, f"Parameter '{param_name}' must be an object"

            # Enum validation
            if param_def.options and param_value not in param_def.options:
                return False, f"Parameter '{param_name}' must be one of: {', '.join(param_def.options)}"

        return True, None

    def __str__(self) -> str:
        """String representation."""
        metadata = self.get_metadata()
        return f"{metadata.name} ({metadata.id})"

    def __repr__(self) -> str:
        """Detailed representation."""
        metadata = self.get_metadata()
        return f"<{self.__class__.__name__} id={metadata.id} category={metadata.category}>"
