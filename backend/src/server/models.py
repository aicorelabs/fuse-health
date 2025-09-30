"""
Core models and types for the MCP server
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel


class SystemInfo(BaseModel):
    """System information model"""
    timestamp: datetime
    server_name: str
    version: str
    status: str


class Task(BaseModel):
    """Task model"""
    id: str
    description: str
    priority: str = "medium"
    tags: List[str] = []
    status: str = "open"
    created_at: datetime = datetime.now()
