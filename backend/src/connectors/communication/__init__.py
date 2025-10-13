"""Communication connectors for email, messaging, etc."""

from .gmail import GmailConnector
from .slack import SlackConnector

__all__ = ["GmailConnector", "SlackConnector"]
