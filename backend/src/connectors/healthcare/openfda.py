"""
OpenFDA Connector - Access FDA drug information, adverse events, and recalls.

The openFDA API provides access to FDA data on drugs, devices, and food.
No API key required for basic usage, but recommended for higher rate limits.

API Documentation: https://open.fda.gov/apis/
"""

import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime

from ..base import (
    BaseConnector,
    ConnectorMetadata,
    ConnectorAction,
    ActionParameter,
    ConnectorResult,
    ConnectorCategory,
    AuthType,
)


class OpenFDAConnector(BaseConnector):
    """
    Connector for openFDA drug information API.

    Features:
    - Search drug labels
    - Get adverse event reports
    - Check drug recalls
    - Access drug enforcement data

    Rate Limits (without API key):
    - 40 requests per minute
    - 1000 requests per day

    With API key:
    - 240 requests per minute
    - 120,000 requests per day
    """

    BASE_URL = "https://api.fda.gov"

    def get_metadata(self) -> ConnectorMetadata:
        """Return connector metadata."""
        return ConnectorMetadata(
            id="openfda",
            name="openFDA",
            description="FDA drug labels, adverse events, and recalls database",
            category=ConnectorCategory.HEALTHCARE,
            auth_type=AuthType.API_KEY,
            icon="💊",
            color="#0066CC",
            docs_url="https://open.fda.gov/apis/",
            homepage="https://open.fda.gov",
            requires_credentials=False,  # API key is optional
            supports_oauth=False,
            rate_limit={
                "without_key": "40/min, 1000/day",
                "with_key": "240/min, 120000/day"
            },
            version="1.0.0"
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available actions."""
        return [
            ConnectorAction(
                id="search_drugs",
                name="Search Drugs",
                description="Search FDA drug labels database",
                category="query",
                params=[
                    ActionParameter(
                        name="search",
                        type="string",
                        description="Search query (e.g., 'aspirin', 'generic_name:ibuprofen')",
                        required=True,
                        placeholder="aspirin"
                    ),
                    ActionParameter(
                        name="limit",
                        type="number",
                        description="Maximum number of results to return",
                        required=False,
                        default=10,
                        validation={"min": 1, "max": 100}
                    ),
                ],
                output_schema={
                    "type": "object",
                    "properties": {
                        "results": {"type": "array"},
                        "total": {"type": "number"},
                    }
                }
            ),
            ConnectorAction(
                id="get_adverse_events",
                name="Get Adverse Events",
                description="Get adverse event reports for a drug",
                category="query",
                params=[
                    ActionParameter(
                        name="drug_name",
                        type="string",
                        description="Drug name to search",
                        required=True,
                        placeholder="aspirin"
                    ),
                    ActionParameter(
                        name="limit",
                        type="number",
                        description="Maximum number of results",
                        required=False,
                        default=10,
                        validation={"min": 1, "max": 100}
                    ),
                ],
                output_schema={
                    "type": "object",
                    "properties": {
                        "results": {"type": "array"},
                        "total": {"type": "number"},
                    }
                }
            ),
            ConnectorAction(
                id="check_recalls",
                name="Check Drug Recalls",
                description="Check for drug recalls and safety alerts",
                category="query",
                params=[
                    ActionParameter(
                        name="drug_name",
                        type="string",
                        description="Drug name to check",
                        required=True,
                        placeholder="aspirin"
                    ),
                    ActionParameter(
                        name="limit",
                        type="number",
                        description="Maximum number of results",
                        required=False,
                        default=10,
                        validation={"min": 1, "max": 100}
                    ),
                ],
                output_schema={
                    "type": "object",
                    "properties": {
                        "results": {"type": "array"},
                        "total": {"type": "number"},
                    }
                }
            ),
            ConnectorAction(
                id="get_drug_label",
                name="Get Drug Label",
                description="Get detailed drug label information",
                category="query",
                params=[
                    ActionParameter(
                        name="drug_name",
                        type="string",
                        description="Drug name",
                        required=True,
                        placeholder="aspirin"
                    ),
                ],
                output_schema={
                    "type": "object",
                    "properties": {
                        "brand_name": {"type": "string"},
                        "generic_name": {"type": "string"},
                        "purpose": {"type": "string"},
                        "warnings": {"type": "array"},
                        "indications": {"type": "array"},
                    }
                }
            ),
        ]

    async def execute(
        self,
        action_id: str,
        credentials: Dict[str, Any],
        parameters: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> ConnectorResult:
        """Execute an action."""
        start_time = datetime.now()

        try:
            # Validate parameters
            is_valid, error = self.validate_parameters(action_id, parameters)
            if not is_valid:
                return ConnectorResult(
                    success=False,
                    error=error
                )

            # Route to appropriate handler
            if action_id == "search_drugs":
                result = await self._search_drugs(credentials, parameters)
            elif action_id == "get_adverse_events":
                result = await self._get_adverse_events(credentials, parameters)
            elif action_id == "check_recalls":
                result = await self._check_recalls(credentials, parameters)
            elif action_id == "get_drug_label":
                result = await self._get_drug_label(credentials, parameters)
            else:
                return ConnectorResult(
                    success=False,
                    error=f"Unknown action: {action_id}"
                )

            # Calculate execution time
            execution_time = int(
                (datetime.now() - start_time).total_seconds() * 1000)

            return ConnectorResult(
                success=True,
                data=result,
                execution_time_ms=execution_time
            )

        except Exception as e:
            execution_time = int(
                (datetime.now() - start_time).total_seconds() * 1000)
            return ConnectorResult(
                success=False,
                error=str(e),
                execution_time_ms=execution_time
            )

    async def _search_drugs(
        self,
        credentials: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Search drug labels."""
        search_query = parameters["search"]
        limit = parameters.get("limit", 10)
        api_key = credentials.get("api_key")

        # Build URL
        url = f"{self.BASE_URL}/drug/label.json"
        params = {
            "search": search_query,
            "limit": limit
        }
        if api_key:
            params["api_key"] = api_key

        # Make request
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        return {
            "results": data.get("results", []),
            "total": len(data.get("results", [])),
            "meta": data.get("meta", {})
        }

    async def _get_adverse_events(
        self,
        credentials: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get adverse event reports."""
        drug_name = parameters["drug_name"]
        limit = parameters.get("limit", 10)
        api_key = credentials.get("api_key")

        # Build search query for drug name in adverse events
        search_query = f'patient.drug.openfda.brand_name:"{drug_name}"'

        url = f"{self.BASE_URL}/drug/event.json"
        params = {
            "search": search_query,
            "limit": limit
        }
        if api_key:
            params["api_key"] = api_key

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        return {
            "results": data.get("results", []),
            "total": len(data.get("results", [])),
            "meta": data.get("meta", {})
        }

    async def _check_recalls(
        self,
        credentials: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Check drug recalls."""
        drug_name = parameters["drug_name"]
        limit = parameters.get("limit", 10)
        api_key = credentials.get("api_key")

        # Build search query
        search_query = f'openfda.brand_name:"{drug_name}"'

        url = f"{self.BASE_URL}/drug/enforcement.json"
        params = {
            "search": search_query,
            "limit": limit
        }
        if api_key:
            params["api_key"] = api_key

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        return {
            "results": data.get("results", []),
            "total": len(data.get("results", [])),
            "meta": data.get("meta", {})
        }

    async def _get_drug_label(
        self,
        credentials: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get detailed drug label."""
        drug_name = parameters["drug_name"]
        api_key = credentials.get("api_key")

        url = f"{self.BASE_URL}/drug/label.json"
        params = {
            "search": f'openfda.brand_name:"{drug_name}"',
            "limit": 1
        }
        if api_key:
            params["api_key"] = api_key

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        results = data.get("results", [])
        if not results:
            return {"error": "Drug not found"}

        label = results[0]

        # Extract key information
        return {
            "brand_name": label.get("openfda", {}).get("brand_name", ["Unknown"])[0],
            "generic_name": label.get("openfda", {}).get("generic_name", ["Unknown"])[0],
            "manufacturer": label.get("openfda", {}).get("manufacturer_name", ["Unknown"])[0],
            "purpose": label.get("purpose", ["Not specified"]),
            "warnings": label.get("warnings", []),
            "indications_and_usage": label.get("indications_and_usage", []),
            "dosage_and_administration": label.get("dosage_and_administration", []),
            "adverse_reactions": label.get("adverse_reactions", []),
            "drug_interactions": label.get("drug_interactions", []),
        }

    async def validate_credentials(self, credentials: Dict[str, Any]) -> bool:
        """Validate API key by making a test request."""
        if not credentials or not credentials.get("api_key"):
            # No API key is valid (public access)
            return True

        try:
            api_key = credentials["api_key"]
            url = f"{self.BASE_URL}/drug/label.json"

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    params={"api_key": api_key, "limit": 1}
                )
                return response.status_code == 200

        except Exception:
            return False
