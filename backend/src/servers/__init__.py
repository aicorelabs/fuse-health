"""
Medical MCPs - Collection of medical research and healthcare MCP servers
"""

from .epic_server import epic_server
from .pubmed_server import pubmed_server

__all__ = ["epic_server", "pubmed_server"]
