"""
DICOM MCP Server - Handle medical imaging DICOM files and metadata.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv

load_dotenv()

from pydantic import BaseModel, Field

from fastmcp import FastMCP

try:
    import pydicom
    from pydicom.dataset import Dataset
except ImportError:
    pydicom = None
    Dataset = None

DICOM_STORAGE_PATH: str = os.getenv("DICOM_STORAGE_PATH", "/var/dicom/storage")

logger = logging.getLogger("fuse_home.servers.dicom")

dicom_server = FastMCP("DICOMMCP")


class GetDICOMMetadataRequest(BaseModel):
    """Request to get metadata from a DICOM file."""

    file_path: str = Field(..., description="Path to the DICOM file relative to storage root")


class QueryImagingRequest(BaseModel):
    """Request to query imaging data."""

    patient_id: Optional[str] = Field(None, description="Patient ID to filter by")
    study_uid: Optional[str] = Field(None, description="Study Instance UID")
    series_uid: Optional[str] = Field(None, description="Series Instance UID")


def _sanitize_arg(value: Any, *, max_chars: int = 120) -> Any:
    if value is None:
        return None
    if isinstance(value, (int, float, bool)):
        return value
    if isinstance(value, (list, tuple)):
        return [_sanitize_arg(item, max_chars=max_chars) for item in value[:5]]
    if isinstance(value, dict):
        return {
            str(key): _sanitize_arg(val, max_chars=max_chars)
            for key, val in list(value.items())[:10]
        }
    text = str(value)
    if len(text) > max_chars:
        return text[:max_chars] + "…"
    return text


def _log_tool_call(tool_name: str, **kwargs: Any) -> None:
    safe_kwargs = {key: _sanitize_arg(val) for key, val in kwargs.items() if key != "self"}
    logger.info("DICOM tool '%s' invoked", tool_name, extra={"tool_args": safe_kwargs})


def _get_full_path(relative_path: str) -> Path:
    """Get full path within storage directory."""
    storage = Path(DICOM_STORAGE_PATH)
    full_path = (storage / relative_path).resolve()
    # Ensure it's within storage directory
    if not str(full_path).startswith(str(storage)):
        raise ValueError("Access denied: path outside storage directory")
    return full_path


def _extract_metadata(ds: Dataset) -> Dict[str, Any]:
    """Extract key metadata from DICOM dataset."""
    metadata = {}
    key_fields = [
        (0x0008, 0x0005),  # SpecificCharacterSet
        (0x0008, 0x0008),  # ImageType
        (0x0008, 0x0016),  # SOPClassUID
        (0x0008, 0x0018),  # SOPInstanceUID
        (0x0008, 0x0020),  # StudyDate
        (0x0008, 0x0030),  # StudyTime
        (0x0008, 0x0050),  # AccessionNumber
        (0x0008, 0x0060),  # Modality
        (0x0008, 0x0070),  # Manufacturer
        (0x0008, 0x1090),  # ManufacturerModelName
        (0x0010, 0x0010),  # PatientName
        (0x0010, 0x0020),  # PatientID
        (0x0010, 0x0030),  # PatientBirthDate
        (0x0010, 0x0040),  # PatientSex
        (0x0018, 0x1000),  # DeviceSerialNumber
        (0x0018, 0x1020),  # SoftwareVersions
        (0x0020, 0x000D),  # StudyInstanceUID
        (0x0020, 0x000E),  # SeriesInstanceUID
        (0x0020, 0x0010),  # StudyID
        (0x0020, 0x0011),  # SeriesNumber
        (0x0028, 0x0010),  # Rows
        (0x0028, 0x0011),  # Columns
        (0x0028, 0x0030),  # PixelSpacing
    ]

    for group, element in key_fields:
        try:
            tag = (group, element)
            if tag in ds:
                value = ds[tag]
                metadata[f"({group:04X},{element:04X})"] = str(value)
        except Exception:
            pass

    return metadata


@dicom_server.tool()
async def get_dicom_metadata(request: GetDICOMMetadataRequest) -> str:
    """Get metadata from a DICOM file."""
    _log_tool_call("get_dicom_metadata", file_path=request.file_path)

    if pydicom is None:
        return "Error: pydicom library not installed"

    try:
        full_path = _get_full_path(request.file_path)
        if not full_path.exists():
            return f"Error: DICOM file not found at {full_path}"

        ds = pydicom.dcmread(str(full_path))
        metadata = _extract_metadata(ds)
        return f"DICOM Metadata for {request.file_path}:\n" + "\n".join(f"{k}: {v}" for k, v in metadata.items())
    except Exception as e:
        return f"Error reading DICOM file: {str(e)}"


@dicom_server.tool()
async def query_imaging(request: QueryImagingRequest) -> str:
    """Query imaging data based on patient or study criteria."""
    _log_tool_call(
        "query_imaging",
        patient_id=request.patient_id,
        study_uid=request.study_uid,
        series_uid=request.series_uid,
    )

    if pydicom is None:
        return "Error: pydicom library not installed"

    try:
        storage = Path(DICOM_STORAGE_PATH)
        if not storage.exists():
            return f"Error: Storage directory {storage} does not exist"

        results = []
        for dcm_file in storage.rglob("*.dcm"):
            try:
                ds = pydicom.dcmread(str(dcm_file), stop_before_pixels=True)
                match = True

                if request.patient_id and str(ds.get((0x0010, 0x0020), "")) != request.patient_id:
                    match = False
                if request.study_uid and str(ds.get((0x0020, 0x000D), "")) != request.study_uid:
                    match = False
                if request.series_uid and str(ds.get((0x0020, 0x000E), "")) != request.series_uid:
                    match = False

                if match:
                    relative_path = str(dcm_file.relative_to(storage))
                    results.append({
                        "file": relative_path,
                        "patient_id": str(ds.get((0x0010, 0x0020), "")),
                        "study_uid": str(ds.get((0x0020, 0x000D), "")),
                        "series_uid": str(ds.get((0x0020, 0x000E), "")),
                        "modality": str(ds.get((0x0008, 0x0060), "")),
                        "study_date": str(ds.get((0x0008, 0x0020), "")),
                    })
            except Exception:
                continue

        if not results:
            return "No matching DICOM files found"

        output = "Matching DICOM Files:\n"
        for result in results[:20]:  # Limit to 20 results
            output += f"- File: {result['file']}\n"
            output += f"  Patient ID: {result['patient_id']}\n"
            output += f"  Study UID: {result['study_uid']}\n"
            output += f"  Series UID: {result['series_uid']}\n"
            output += f"  Modality: {result['modality']}\n"
            output += f"  Study Date: {result['study_date']}\n\n"

        return output
    except Exception as e:
        return f"Error querying imaging data: {str(e)}"


@dicom_server.tool()
async def test_connectivity() -> str:
    """Test connectivity to DICOM storage."""
    _log_tool_call("test_connectivity")

    try:
        storage = Path(DICOM_STORAGE_PATH)
        if not storage.exists():
            return f"Error: Storage directory {storage} does not exist"

        if not storage.is_dir():
            return f"Error: {storage} is not a directory"

        # Check permissions
        try:
            test_file = storage / ".connectivity_test"
            test_file.write_text("test")
            test_file.unlink()
        except Exception as e:
            return f"Error: Cannot write to storage directory: {str(e)}"

        # Count DICOM files
        dcm_count = len(list(storage.rglob("*.dcm")))
        return f"DICOM Storage Connectivity Test Passed\nStorage Path: {storage}\nDICOM Files Found: {dcm_count}\nPermissions: OK"
    except Exception as e:
        return f"Error testing connectivity: {str(e)}"


@dicom_server.tool()
async def get_dicom_capabilities() -> Dict[str, Any]:
    """Get information about DICOM MCP server capabilities."""
    _log_tool_call("get_dicom_capabilities")
    return {
        "server_name": "DICOMMCP",
        "description": "DICOM medical imaging server for MCP agents",
        "capabilities": [
            "DICOM metadata extraction",
            "Imaging data queries",
            "Storage connectivity testing",
        ],
        "storage_path": DICOM_STORAGE_PATH,
        "supported_formats": ["DICOM (.dcm)"],
        "requires_pydicom": bool(pydicom is not None),
        "environment_variables": [
            "DICOM_STORAGE_PATH",
        ],
        "note": "Ensure pydicom is installed and storage directory is accessible.",
    }


if __name__ == "__main__":
    dicom_server.run()