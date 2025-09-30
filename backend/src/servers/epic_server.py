"""
Epic MCP Server - Interact with Epic FHIR APIs for clinical workflows.
"""
from __future__ import annotations

import os
import time
from typing import Any, Callable, Dict, Optional

from dotenv import load_dotenv

load_dotenv()

import aiohttp
from fastmcp import FastMCP
from pydantic import BaseModel, Field, model_validator


EPIC_BASE_URL: str = os.getenv(
    "EPIC_BASE_URL",
    "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4",
)
EPIC_AUTH_URL: str = os.getenv(
    "EPIC_AUTH_URL",
    "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token",
)
EPIC_CLIENT_ID: Optional[str] = os.getenv("EPIC_CLIENT_ID")
EPIC_CLIENT_SECRET: Optional[str] = os.getenv("EPIC_CLIENT_SECRET")
EPIC_DEFAULT_SCOPE: str = os.getenv(
    "EPIC_SCOPE",
    "system/Patient.read system/Appointment.read system/MedicationRequest.read",
)

TOKEN_SAFETY_BUFFER_SECONDS = 30
_TOKEN_CACHE: Dict[str, Any] = {"token": None, "expires_at": 0.0}


epic_server = FastMCP("EpicMCP")


class PatientSearchRequest(BaseModel):
    """Parameters accepted by Epic's FHIR /Patient search endpoint."""

    given: Optional[str] = Field(None, description="Given name (first name) to search for")
    family: Optional[str] = Field(None, description="Family name (surname) to search for")
    birthdate: Optional[str] = Field(
        None,
        description="Birthdate filter in YYYY-MM-DD format; supports prefixes like ge, le",
    )
    identifier: Optional[str] = Field(
        None,
        description="Patient identifier (MRN, etc.) in system|value format",
    )
    page_size: int = Field(
        20,
        ge=1,
        le=100,
        description="Number of records to return per page (_count parameter)",
    )

    @model_validator(mode="after")
    def _ensure_search_params(self) -> "PatientSearchRequest":
        if not any([self.given, self.family, self.birthdate, self.identifier]):
            raise ValueError(
                "At least one of given, family, birthdate, or identifier must be provided",
            )
        return self


class AppointmentSearchRequest(BaseModel):
    """Parameters for querying Epic FHIR /Appointment endpoint."""

    patient_id: str = Field(..., description="FHIR Patient ID (e.g., 12345)")
    status: Optional[str] = Field(
        None,
        description="Optional appointment status filter (e.g., booked, fulfilled)",
    )
    min_start: Optional[str] = Field(
        None,
        description="Filter for appointments starting on or after this datetime (ISO 8601)",
    )
    max_start: Optional[str] = Field(
        None,
        description="Filter for appointments starting on or before this datetime",
    )
    page_size: int = Field(
        10,
        ge=1,
        le=100,
        description="Number of appointments to return (_count parameter)",
    )


async def _get_access_token(session: aiohttp.ClientSession) -> Optional[str]:
    """Return a cached OAuth token or request a new one from Epic."""

    now = time.time()
    token = _TOKEN_CACHE["token"]
    expires_at = _TOKEN_CACHE["expires_at"]
    if token and expires_at - TOKEN_SAFETY_BUFFER_SECONDS > now:
        return token

    if not (EPIC_CLIENT_ID and EPIC_CLIENT_SECRET):
        return None

    payload = {
        "grant_type": "client_credentials",
        "client_id": EPIC_CLIENT_ID,
        "client_secret": EPIC_CLIENT_SECRET,
        "scope": EPIC_DEFAULT_SCOPE,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    async with session.post(EPIC_AUTH_URL, data=payload, headers=headers) as response:
        if response.status != 200:
            _TOKEN_CACHE.update({"token": None, "expires_at": 0.0})
            return None

        data = await response.json()
        access_token = data.get("access_token")
        expires_in = data.get("expires_in", 0)
        if not access_token:
            return None

        _TOKEN_CACHE.update(
            {
                "token": access_token,
                "expires_at": now + float(expires_in),
            }
        )
        return access_token


async def _epic_get(resource_path: str, *, params: Optional[Dict[str, Any]] = None) -> Any:
    """Helper to perform a GET against Epic's FHIR API."""

    url = f"{EPIC_BASE_URL.rstrip('/')}/{resource_path.lstrip('/')}"

    async with aiohttp.ClientSession() as session:
        token = await _get_access_token(session)
        headers = {
            "Accept": "application/fhir+json",
        }

        if EPIC_CLIENT_ID and EPIC_CLIENT_SECRET:
            if not token:
                return (
                    "Error: Unable to acquire Epic access token. Check EPIC_CLIENT_ID and "
                    "EPIC_CLIENT_SECRET environment variables."
                )
            headers["Authorization"] = f"Bearer {token}"
        else:
            # Some sandbox endpoints allow unauthenticated requests; warn user.
            headers["Epic-Sandbox-Mode"] = "true"

        async with session.get(url, params=params, headers=headers) as response:
            if response.status != 200:
                error_body = await response.text()
                return (
                    f"Error: Epic API request to {resource_path} failed with status "
                    f"{response.status}. Response: {error_body}"
                )
            content_type = response.headers.get("Content-Type", "")
            if "json" not in content_type:
                return await response.text()
            return await response.json()


def _format_patient(resource: Dict[str, Any]) -> str:
    """Convert a FHIR Patient resource into a readable summary."""

    names = []
    for name in resource.get("name", []):
        given = " ".join(name.get("given", []))
        family = name.get("family", "")
        full_name = " ".join(part for part in [given, family] if part)
        if full_name:
            names.append(full_name)
    display_name = names[0] if names else "Unknown"

    identifiers = []
    for identifier in resource.get("identifier", []):
        system = identifier.get("system", "")
        value = identifier.get("value", "")
        if value:
            identifiers.append(f"{system}: {value}" if system else value)

    telecoms = []
    for telecom in resource.get("telecom", []):
        number = telecom.get("value")
        use = telecom.get("use")
        if number:
            telecoms.append(f"{use}: {number}" if use else number)

    gender = resource.get("gender", "unknown").title()
    birth_date = resource.get("birthDate", "Unknown")

    lines = [
        f"Patient: {display_name} (ID: {resource.get('id', 'Unknown')})",
        f"Gender: {gender}",
        f"Birth Date: {birth_date}",
    ]

    if identifiers:
        lines.append("Identifiers: " + "; ".join(identifiers))
    if telecoms:
        lines.append("Contact: " + "; ".join(telecoms))

    addresses = resource.get("address", [])
    if addresses:
        formatted_addresses = []
        for address in addresses:
            parts = address.get("line", []) + [
                address.get("city"),
                address.get("state"),
                address.get("postalCode"),
            ]
            formatted_addresses.append(
                ", ".join(part for part in parts if part)
            )
        lines.append("Addresses: " + " | ".join(formatted_addresses))

    return "\n".join(lines)


def _format_bundle(
    bundle: Dict[str, Any], *, resource_formatter: Callable[[Dict[str, Any]], str]
) -> str:
    entries = bundle.get("entry", [])
    if not entries:
        return "No records found."

    formatted_entries = []
    for entry in entries:
        resource = entry.get("resource", {})
        formatted_entries.append(resource_formatter(resource))

    return "\n\n".join(formatted_entries)


def _format_appointment(resource: Dict[str, Any]) -> str:
    status = resource.get("status", "unknown")
    start = resource.get("start", "Unknown start")
    end = resource.get("end", "Unknown end")

    reasons = []
    for reason in resource.get("reasonCode", []):
        for coding in reason.get("coding", []):
            display = coding.get("display")
            if display:
                reasons.append(display)

    participants = []
    for participant in resource.get("participant", []):
        role_codes = []
        for type_info in participant.get("type", []):
            for coding in type_info.get("coding", []):
                if coding.get("display"):
                    role_codes.append(coding["display"])
        actor = participant.get("actor", {})
        actor_display = actor.get("display") or actor.get("reference", "Unknown")
        participants.append(
            f"{actor_display} ({', '.join(role_codes)})" if role_codes else actor_display
        )

    lines = [
        f"Appointment ID: {resource.get('id', 'Unknown')} - Status: {status}",
        f"Start: {start}",
        f"End: {end}",
    ]
    if reasons:
        lines.append("Reasons: " + ", ".join(reasons))
    if participants:
        lines.append("Participants: " + "; ".join(participants))

    return "\n".join(lines)


async def _require_patient_resource(patient_id: str) -> Any:
    data = await _epic_get(f"Patient/{patient_id}")
    if isinstance(data, str):
        return data
    if data.get("resourceType") == "Patient":
        return data
    return "Error: Unexpected response when retrieving Patient resource."


@epic_server.tool()
async def get_patient_summary(patient_id: str) -> str:
    """Retrieve demographics and contact details for a patient."""

    data = await _require_patient_resource(patient_id)
    if isinstance(data, str):
        return data
    summary = _format_patient(data)
    return summary


@epic_server.tool()
async def search_patients(request: PatientSearchRequest) -> str:
    """Search for patients using Epic FHIR parameters."""

    params = {"_count": request.page_size}
    if request.given:
        params["given"] = request.given
    if request.family:
        params["family"] = request.family
    if request.birthdate:
        params["birthdate"] = request.birthdate
    if request.identifier:
        params["identifier"] = request.identifier

    data = await _epic_get("Patient", params=params)
    if isinstance(data, str):
        return data
    if data.get("resourceType") != "Bundle":
        return "Error: Unexpected response from Epic when searching patients."

    return _format_bundle(data, resource_formatter=_format_patient)


@epic_server.tool()
async def get_patient_appointments(request: AppointmentSearchRequest) -> str:
    """Fetch upcoming appointments for a patient."""

    params = {
        "patient": request.patient_id,
        "_count": request.page_size,
        "_sort": "date",
    }
    if request.status:
        params["status"] = request.status
    date_filters = []
    if request.min_start:
        date_filters.append(f"ge{request.min_start}")
    if request.max_start:
        date_filters.append(f"le{request.max_start}")
    if date_filters:
        params["date"] = date_filters if len(date_filters) > 1 else date_filters[0]

    data = await _epic_get("Appointment", params=params)
    if isinstance(data, str):
        return data
    if data.get("resourceType") != "Bundle":
        return "Error: Unexpected response from Epic when fetching appointments."

    return _format_bundle(data, resource_formatter=_format_appointment)


@epic_server.tool()
async def get_patient_medications(patient_id: str, page_size: int = 20) -> str:
    """Retrieve active medication statements for a patient."""

    params = {
        "patient": patient_id,
        "status": "active",
        "_count": page_size,
    }
    data = await _epic_get("MedicationRequest", params=params)
    if isinstance(data, str):
        return data
    if data.get("resourceType") != "Bundle":
        return "Error: Unexpected response from Epic when fetching medications."

    lines = []
    for entry in data.get("entry", []):
        resource = entry.get("resource", {})
        med = resource.get("medicationCodeableConcept", {})
        med_text = med.get("text")
        coding_display = next(
            (
                coding.get("display")
                for coding in med.get("coding", [])
                if coding.get("display")
            ),
            None,
        )
        display_value = med_text or coding_display or "Unknown medication"

        requester = resource.get("requester", {}).get("display", "Unknown prescriber")
        authored_on = resource.get("authoredOn", "Unknown date")
        dosage = []
        for instruction in resource.get("dosageInstruction", []):
            text = instruction.get("text")
            if text:
                dosage.append(text)
        status = resource.get("status", "unknown")

        lines.append(
            "\n".join(
                filter(
                    None,
                    [
                        f"Medication: {display_value}",
                        f"Status: {status}",
                        f"Prescriber: {requester}",
                        f"Authored On: {authored_on}",
                        "Dosage: " + " | ".join(dosage) if dosage else None,
                    ],
                )
            )
        )

    if not lines:
        return "No active medications found."

    return "\n\n".join(lines)


@epic_server.prompt()
def epic_clinical_assistant_prompt(topic: str = "clinical decision support") -> str:
    """Prompt template for agents leveraging Epic MCP capabilities."""

    return (
        "You are an Epic EHR clinical assistant with secure access to Epic FHIR APIs.\n\n"
        f"Clinical Focus: {topic}\n\n"
        "Available Epic Tools:\n"
        "- search_patients: Locate patients within the organization.\n"
        "- get_patient_summary: Summarize patient demographics and contact details.\n"
        "- get_patient_medications: Review active medication orders.\n"
        "- get_patient_appointments: Retrieve scheduled encounters.\n\n"
        "Guidelines:\n"
        "1. Respect access controls; only request data necessary for the task.\n"
        "2. Confirm patient identity with multiple identifiers when possible.\n"
        "3. Note medication statuses, prescribers, and instructions in clinical summaries.\n"
        "4. Highlight gaps in care, follow-up requirements, or abnormal findings.\n"
        "5. Document data provenance with Epic resource IDs or links.\n\n"
        "Respond with structured, clinician-friendly narratives and include actionable next steps."
    )


@epic_server.tool()
async def get_epic_capabilities() -> Dict[str, Any]:
    """Return metadata about the Epic MCP server."""

    return {
        "server_name": "EpicMCP",
        "description": "Epic FHIR integration server for MCP agents",
        "capabilities": [
            "Patient demographic retrieval",
            "Patient search",
            "Medication review",
            "Appointment lookups",
        ],
        "fhir_base_url": EPIC_BASE_URL,
        "requires_auth": bool(EPIC_CLIENT_ID and EPIC_CLIENT_SECRET),
        "default_scope": EPIC_DEFAULT_SCOPE,
        "resources": [
            "Patient",
            "Appointment",
            "MedicationRequest",
        ],
        "environment_variables": [
            "EPIC_BASE_URL",
            "EPIC_AUTH_URL",
            "EPIC_CLIENT_ID",
            "EPIC_CLIENT_SECRET",
            "EPIC_SCOPE",
        ],
        "sandbox_notice": (
            "Epic sandbox endpoints may return synthetic data and require sandbox keys."
        ),
    }


if __name__ == "__main__":
    epic_server.run()
