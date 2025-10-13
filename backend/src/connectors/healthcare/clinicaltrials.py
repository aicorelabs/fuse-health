"""
ClinicalTrials.gov Connector - Search and retrieve clinical trial information.

This connector provides access to ClinicalTrials.gov database for searching
ongoing and completed clinical trials. No API key required.
"""
from typing import Any, Dict, List
import httpx

from ..base import (
    BaseConnector,
    ConnectorMetadata,
    ConnectorAction,
    ActionParameter,
    ConnectorResult,
    AuthType,
    ConnectorCategory,
)


class ClinicalTrialsConnector(BaseConnector):
    """ClinicalTrials.gov connector for clinical trial information."""

    BASE_URL = "https://clinicaltrials.gov/api/v2"

    def get_metadata(self) -> ConnectorMetadata:
        """Return ClinicalTrials.gov connector metadata."""
        return ConnectorMetadata(
            id="clinicaltrials",
            name="ClinicalTrials.gov",
            description="Search and retrieve clinical trial information from ClinicalTrials.gov",
            category=ConnectorCategory.HEALTHCARE,
            auth_type=AuthType.NONE,
            icon="🔬",
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available ClinicalTrials actions."""
        return [
            ConnectorAction(
                id="search_trials",
                name="Search Trials",
                description="Search for clinical trials by query",
                category="query",
                params=[
                    ActionParameter(
                        name="query",
                        type="string",
                        description="Search query (e.g., disease, condition, intervention)",
                        required=True,
                    ),
                    ActionParameter(
                        name="max_results",
                        type="integer",
                        description="Maximum number of results (default: 20, max: 100)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="get_trial_details",
                name="Get Trial Details",
                description="Get detailed information about a specific trial",
                category="query",
                params=[
                    ActionParameter(
                        name="nct_id",
                        type="string",
                        description="NCT ID of the trial (e.g., 'NCT04280705')",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="search_by_condition",
                name="Search by Condition",
                description="Search trials by medical condition",
                category="query",
                params=[
                    ActionParameter(
                        name="condition",
                        type="string",
                        description="Medical condition or disease",
                        required=True,
                    ),
                    ActionParameter(
                        name="status",
                        type="string",
                        description="Trial status (e.g., 'recruiting', 'completed', 'active')",
                        required=False,
                    ),
                    ActionParameter(
                        name="max_results",
                        type="integer",
                        description="Maximum number of results (default: 20)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="search_by_location",
                name="Search by Location",
                description="Search trials by geographic location",
                category="query",
                params=[
                    ActionParameter(
                        name="country",
                        type="string",
                        description="Country name",
                        required=True,
                    ),
                    ActionParameter(
                        name="state",
                        type="string",
                        description="State or province (optional)",
                        required=False,
                    ),
                    ActionParameter(
                        name="city",
                        type="string",
                        description="City name (optional)",
                        required=False,
                    ),
                    ActionParameter(
                        name="max_results",
                        type="integer",
                        description="Maximum number of results (default: 20)",
                        required=False,
                    ),
                ],
            ),
        ]

    async def execute(
        self, action_id: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Execute a ClinicalTrials action."""
        if action_id == "search_trials":
            return await self._search_trials(parameters)
        elif action_id == "get_trial_details":
            return await self._get_trial_details(parameters)
        elif action_id == "search_by_condition":
            return await self._search_by_condition(parameters)
        elif action_id == "search_by_location":
            return await self._search_by_location(parameters)
        else:
            return ConnectorResult(
                success=False,
                error=f"Unknown action: {action_id}",
            )

    async def _search_trials(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Search for clinical trials."""
        query = parameters.get("query")
        if not query:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: query",
            )

        max_results = min(int(parameters.get("max_results", 20)), 100)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/studies",
                    params={
                        "query.term": query,
                        "pageSize": max_results,
                        "format": "json",
                    },
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            studies = result.get("studies", [])
            total_count = result.get("totalCount", 0)

            trials = []
            for study in studies:
                protocol = study.get("protocolSection", {})
                id_module = protocol.get("identificationModule", {})
                status_module = protocol.get("statusModule", {})
                
                trials.append({
                    "nct_id": id_module.get("nctId"),
                    "title": id_module.get("briefTitle"),
                    "status": status_module.get("overallStatus"),
                    "phase": status_module.get("phase"),
                    "start_date": status_module.get("startDateStruct", {}).get("date"),
                })

            return ConnectorResult(
                success=True,
                data={
                    "trials": trials,
                    "count": len(trials),
                    "total_count": total_count,
                },
                message=f"Found {total_count} trial(s) matching '{query}'",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"ClinicalTrials API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to search trials: {str(e)}",
            )

    async def _get_trial_details(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Get detailed information about a trial."""
        nct_id = parameters.get("nct_id")
        if not nct_id:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: nct_id",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/studies/{nct_id}",
                    params={"format": "json"},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            studies = result.get("studies", [])
            if not studies:
                return ConnectorResult(
                    success=False,
                    error=f"Trial not found: {nct_id}",
                )

            protocol = studies[0].get("protocolSection", {})
            id_module = protocol.get("identificationModule", {})
            status_module = protocol.get("statusModule", {})
            description_module = protocol.get("descriptionModule", {})
            conditions_module = protocol.get("conditionsModule", {})
            design_module = protocol.get("designModule", {})
            
            trial_details = {
                "nct_id": id_module.get("nctId"),
                "title": id_module.get("briefTitle"),
                "official_title": id_module.get("officialTitle"),
                "status": status_module.get("overallStatus"),
                "phase": status_module.get("phase"),
                "study_type": design_module.get("studyType"),
                "brief_summary": description_module.get("briefSummary"),
                "detailed_description": description_module.get("detailedDescription"),
                "conditions": conditions_module.get("conditions", []),
                "keywords": conditions_module.get("keywords", []),
                "start_date": status_module.get("startDateStruct", {}).get("date"),
                "completion_date": status_module.get("completionDateStruct", {}).get("date"),
                "enrollment": design_module.get("enrollmentInfo", {}).get("count"),
            }

            return ConnectorResult(
                success=True,
                data=trial_details,
                message=f"Retrieved details for trial {nct_id}",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"ClinicalTrials API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to get trial details: {str(e)}",
            )

    async def _search_by_condition(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Search trials by condition."""
        condition = parameters.get("condition")
        if not condition:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: condition",
            )

        max_results = min(int(parameters.get("max_results", 20)), 100)
        status = parameters.get("status")

        try:
            query_params = {
                "query.cond": condition,
                "pageSize": max_results,
                "format": "json",
            }
            
            if status:
                query_params["filter.overallStatus"] = status

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/studies",
                    params=query_params,
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            studies = result.get("studies", [])
            total_count = result.get("totalCount", 0)

            trials = []
            for study in studies:
                protocol = study.get("protocolSection", {})
                id_module = protocol.get("identificationModule", {})
                status_module = protocol.get("statusModule", {})
                
                trials.append({
                    "nct_id": id_module.get("nctId"),
                    "title": id_module.get("briefTitle"),
                    "status": status_module.get("overallStatus"),
                    "phase": status_module.get("phase"),
                })

            return ConnectorResult(
                success=True,
                data={
                    "trials": trials,
                    "count": len(trials),
                    "total_count": total_count,
                },
                message=f"Found {total_count} trial(s) for condition '{condition}'",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"ClinicalTrials API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to search by condition: {str(e)}",
            )

    async def _search_by_location(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Search trials by location."""
        country = parameters.get("country")
        if not country:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: country",
            )

        max_results = min(int(parameters.get("max_results", 20)), 100)
        state = parameters.get("state")
        city = parameters.get("city")

        try:
            query_params = {
                "query.locn": country,
                "pageSize": max_results,
                "format": "json",
            }
            
            # Add state/city to location query if provided
            location_parts = [country]
            if state:
                location_parts.append(state)
            if city:
                location_parts.append(city)
            query_params["query.locn"] = ", ".join(location_parts)

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/studies",
                    params=query_params,
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            studies = result.get("studies", [])
            total_count = result.get("totalCount", 0)

            trials = []
            for study in studies:
                protocol = study.get("protocolSection", {})
                id_module = protocol.get("identificationModule", {})
                status_module = protocol.get("statusModule", {})
                
                trials.append({
                    "nct_id": id_module.get("nctId"),
                    "title": id_module.get("briefTitle"),
                    "status": status_module.get("overallStatus"),
                })

            return ConnectorResult(
                success=True,
                data={
                    "trials": trials,
                    "count": len(trials),
                    "total_count": total_count,
                },
                message=f"Found {total_count} trial(s) in {', '.join(location_parts)}",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"ClinicalTrials API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to search by location: {str(e)}",
            )
