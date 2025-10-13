"""
RxNorm Connector - Drug nomenclature and normalization using NLM RxNorm API.

This connector provides access to the National Library of Medicine's RxNorm API
for standardizing drug names and getting drug information. No API key required.
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


class RxNormConnector(BaseConnector):
    """RxNorm connector for drug name normalization."""

    BASE_URL = "https://rxnav.nlm.nih.gov/REST"

    def get_metadata(self) -> ConnectorMetadata:
        """Return RxNorm connector metadata."""
        return ConnectorMetadata(
            id="rxnorm",
            name="RxNorm",
            description="Standardize drug names and get drug information using NLM RxNorm API",
            category=ConnectorCategory.HEALTHCARE,
            auth_type=AuthType.NONE,
            icon="💊",
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available RxNorm actions."""
        return [
            ConnectorAction(
                id="find_drugs",
                name="Find Drugs by Name",
                description="Search for drugs by approximate name match",
                category="query",
                params=[
                    ActionParameter(
                        name="name",
                        type="string",
                        description="Drug name to search for",
                        required=True,
                    ),
                    ActionParameter(
                        name="max_entries",
                        type="integer",
                        description="Maximum number of results (default: 20)",
                        required=False,
                    ),
                ],
            ),
            ConnectorAction(
                id="get_rxcui",
                name="Get RxCUI",
                description="Get the RxNorm Concept Unique Identifier (RxCUI) for a drug name",
                category="query",
                params=[
                    ActionParameter(
                        name="name",
                        type="string",
                        description="Drug name to get RxCUI for",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="get_drug_properties",
                name="Get Drug Properties",
                description="Get properties of a drug by RxCUI",
                category="query",
                params=[
                    ActionParameter(
                        name="rxcui",
                        type="string",
                        description="RxNorm Concept Unique Identifier",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="get_related_drugs",
                name="Get Related Drugs",
                description="Get related drugs (generic, brand names, etc.) by RxCUI",
                category="query",
                params=[
                    ActionParameter(
                        name="rxcui",
                        type="string",
                        description="RxNorm Concept Unique Identifier",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="get_spelling_suggestions",
                name="Get Spelling Suggestions",
                description="Get spelling suggestions for a drug name",
                category="query",
                params=[
                    ActionParameter(
                        name="name",
                        type="string",
                        description="Drug name to get suggestions for",
                        required=True,
                    ),
                ],
            ),
        ]

    async def execute(
        self, action_id: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Execute an RxNorm action."""
        if action_id == "find_drugs":
            return await self._find_drugs(parameters)
        elif action_id == "get_rxcui":
            return await self._get_rxcui(parameters)
        elif action_id == "get_drug_properties":
            return await self._get_drug_properties(parameters)
        elif action_id == "get_related_drugs":
            return await self._get_related_drugs(parameters)
        elif action_id == "get_spelling_suggestions":
            return await self._get_spelling_suggestions(parameters)
        else:
            return ConnectorResult(
                success=False,
                error=f"Unknown action: {action_id}",
            )

    async def _find_drugs(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Search for drugs by name."""
        name = parameters.get("name")
        if not name:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: name",
            )

        max_entries = parameters.get("max_entries", 20)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/approximateTerm.json",
                    params={"term": name, "maxEntries": max_entries},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            candidates = result.get("approximateGroup", {}).get("candidate", [])
            if not candidates:
                return ConnectorResult(
                    success=True,
                    data={"drugs": [], "count": 0},
                    message=f"No drugs found matching '{name}'",
                )

            # Ensure candidates is a list
            if isinstance(candidates, dict):
                candidates = [candidates]

            drugs = [
                {
                    "rxcui": c.get("rxcui"),
                    "name": c.get("name"),
                    "score": c.get("score"),
                    "rank": c.get("rank"),
                }
                for c in candidates
            ]

            return ConnectorResult(
                success=True,
                data={"drugs": drugs, "count": len(drugs)},
                message=f"Found {len(drugs)} drug(s) matching '{name}'",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"RxNorm API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to search drugs: {str(e)}",
            )

    async def _get_rxcui(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Get RxCUI for a drug name."""
        name = parameters.get("name")
        if not name:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: name",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/rxcui.json",
                    params={"name": name},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            rxcui_list = result.get("idGroup", {}).get("rxnormId", [])
            
            if not rxcui_list:
                return ConnectorResult(
                    success=False,
                    error=f"No RxCUI found for drug: {name}",
                )

            # Get first RxCUI
            rxcui = rxcui_list[0] if isinstance(rxcui_list, list) else rxcui_list

            return ConnectorResult(
                success=True,
                data={"rxcui": rxcui, "name": name},
                message=f"Found RxCUI {rxcui} for '{name}'",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"RxNorm API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to get RxCUI: {str(e)}",
            )

    async def _get_drug_properties(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Get properties of a drug by RxCUI."""
        rxcui = parameters.get("rxcui")
        if not rxcui:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: rxcui",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/rxcui/{rxcui}/properties.json",
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            properties = result.get("properties", {})
            
            if not properties:
                return ConnectorResult(
                    success=False,
                    error=f"No properties found for RxCUI: {rxcui}",
                )

            return ConnectorResult(
                success=True,
                data={
                    "rxcui": properties.get("rxcui"),
                    "name": properties.get("name"),
                    "synonym": properties.get("synonym"),
                    "tty": properties.get("tty"),
                    "language": properties.get("language"),
                    "suppress": properties.get("suppress"),
                },
                message=f"Retrieved properties for {properties.get('name')}",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"RxNorm API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to get drug properties: {str(e)}",
            )

    async def _get_related_drugs(self, parameters: Dict[str, Any]) -> ConnectorResult:
        """Get related drugs (generic, brand names, etc.)."""
        rxcui = parameters.get("rxcui")
        if not rxcui:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: rxcui",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/rxcui/{rxcui}/related.json",
                    params={"tty": "BN+IN+PIN+SBD+SCD"},  # Brand, ingredient, etc.
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            related_group = result.get("relatedGroup", {})
            concept_group = related_group.get("conceptGroup", [])

            related_drugs = {}
            for group in concept_group:
                tty = group.get("tty")
                concepts = group.get("conceptProperties", [])
                if concepts:
                    related_drugs[tty] = [
                        {"rxcui": c.get("rxcui"), "name": c.get("name")}
                        for c in concepts
                    ]

            return ConnectorResult(
                success=True,
                data={"related_drugs": related_drugs},
                message=f"Found {len(related_drugs)} type(s) of related drugs",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"RxNorm API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to get related drugs: {str(e)}",
            )

    async def _get_spelling_suggestions(
        self, parameters: Dict[str, Any]
    ) -> ConnectorResult:
        """Get spelling suggestions for a drug name."""
        name = parameters.get("name")
        if not name:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: name",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/spellingsuggestions.json",
                    params={"name": name},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            suggestions = result.get("suggestionGroup", {}).get("suggestionList", {}).get("suggestion", [])
            
            if not suggestions:
                return ConnectorResult(
                    success=True,
                    data={"suggestions": [], "count": 0},
                    message=f"No spelling suggestions for '{name}'",
                )

            # Ensure suggestions is a list
            if isinstance(suggestions, str):
                suggestions = [suggestions]

            return ConnectorResult(
                success=True,
                data={"suggestions": suggestions, "count": len(suggestions)},
                message=f"Found {len(suggestions)} spelling suggestion(s)",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"RxNorm API error: {e.response.status_code}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to get spelling suggestions: {str(e)}",
            )
