"""
Connector system for workflow integrations.

This package provides a plugin-based architecture for integrating
third-party services into workflows.
"""

from .base import (
    BaseConnector,
    ConnectorMetadata,
    ConnectorAction,
    ActionParameter,
    ConnectorResult,
    ConnectorCategory,
    AuthType,
)
from .registry import ConnectorRegistry, registry
from .encryption import encryption_service
from .oauth_handler import oauth_handler

# Import all connectors for auto-discovery
from .healthcare.openfda import OpenFDAConnector
from .healthcare.rxnorm import RxNormConnector
from .healthcare.clinicaltrials import ClinicalTrialsConnector
from .healthcare.pubmed import PubMedConnector
from .communication.gmail import GmailConnector
from .communication.slack import SlackConnector
from .ai.openai import OpenAIConnector
from .ai.anthropic import AnthropicConnector
from .data.google_sheets import GoogleSheetsConnector
from .web.http import HTTPConnector

# Alias for compatibility
IntegrationCategory = ConnectorCategory

__all__ = [
    "BaseConnector",
    "ConnectorMetadata",
    "ConnectorAction",
    "ActionParameter",
    "ConnectorResult",
    "ConnectorCategory",
    "IntegrationCategory",
    "AuthType",
    "ConnectorRegistry",
    "registry",
    "encryption_service",
    "oauth_handler",
    # Connectors
    "OpenFDAConnector",
    "RxNormConnector",
    "ClinicalTrialsConnector",
    "PubMedConnector",
    "GmailConnector",
    "SlackConnector",
    "OpenAIConnector",
    "AnthropicConnector",
    "GoogleSheetsConnector",
    "HTTPConnector",
]
