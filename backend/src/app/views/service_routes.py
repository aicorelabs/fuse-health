"""Service discovery API routes."""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Query

from ..controllers import service_controller

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_services(
    category: Optional[str] = Query(None, description="Filter by category"),
) -> List[Dict[str, Any]]:
    """
    List all available services that can be connected.

    Categories: communication, data, ai, clinical, research
    """
    return await service_controller.list_available_services(category=category)


@router.get("/{service_type}", response_model=Dict[str, Any])
async def get_service_details(service_type: str) -> Dict[str, Any]:
    """Get detailed information about a specific service."""
    return await service_controller.get_service_info(service_type)
