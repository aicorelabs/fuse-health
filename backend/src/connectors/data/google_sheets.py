"""
Google Sheets Connector - Read and write data to Google Sheets.

This connector provides spreadsheet operations using OAuth 2.0 authentication.
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


class GoogleSheetsConnector(BaseConnector):
    """Google Sheets connector for spreadsheet operations."""

    def get_metadata(self) -> ConnectorMetadata:
        """Return Google Sheets connector metadata."""
        return ConnectorMetadata(
            id="google_sheets",
            name="Google Sheets",
            description="Read and write data to Google Sheets spreadsheets",
            category=ConnectorCategory.DATA,
            auth_type=AuthType.OAUTH2,
            icon="📊",
            oauth_config={
                "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "scopes": [
                    "https://www.googleapis.com/auth/spreadsheets",
                    "https://www.googleapis.com/auth/drive.readonly",
                ],
            },
        )

    def get_actions(self) -> List[ConnectorAction]:
        """Return available Google Sheets actions."""
        return [
            ConnectorAction(
                id="read_range",
                name="Read Range",
                description="Read values from a spreadsheet range",
                category="query",
                params=[
                    ActionParameter(
                        name="spreadsheet_id",
                        type="string",
                        description="Spreadsheet ID (from URL)",
                        required=True,
                    ),
                    ActionParameter(
                        name="range",
                        type="string",
                        description="Range in A1 notation (e.g., 'Sheet1!A1:D10')",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="write_range",
                name="Write Range",
                description="Write values to a spreadsheet range",
                category="query",
                params=[
                    ActionParameter(
                        name="spreadsheet_id",
                        type="string",
                        description="Spreadsheet ID",
                        required=True,
                    ),
                    ActionParameter(
                        name="range",
                        type="string",
                        description="Range in A1 notation",
                        required=True,
                    ),
                    ActionParameter(
                        name="values",
                        type="array",
                        description="2D array of values to write",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="append_rows",
                name="Append Rows",
                description="Append rows to the end of a spreadsheet",
                category="query",
                params=[
                    ActionParameter(
                        name="spreadsheet_id",
                        type="string",
                        description="Spreadsheet ID",
                        required=True,
                    ),
                    ActionParameter(
                        name="range",
                        type="string",
                        description="Range (e.g., 'Sheet1!A:D')",
                        required=True,
                    ),
                    ActionParameter(
                        name="values",
                        type="array",
                        description="2D array of values to append",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="create_spreadsheet",
                name="Create Spreadsheet",
                description="Create a new spreadsheet",
                category="query",
                params=[
                    ActionParameter(
                        name="title",
                        type="string",
                        description="Spreadsheet title",
                        required=True,
                    ),
                ],
            ),
            ConnectorAction(
                id="get_spreadsheet_info",
                name="Get Spreadsheet Info",
                description="Get metadata about a spreadsheet",
                category="query",
                params=[
                    ActionParameter(
                        name="spreadsheet_id",
                        type="string",
                        description="Spreadsheet ID",
                        required=True,
                    ),
                ],
            ),
        ]

    async def execute(
        self, action_id: str, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Execute a Google Sheets action."""
        if action_id == "read_range":
            return await self._read_range(parameters, credentials)
        elif action_id == "write_range":
            return await self._write_range(parameters, credentials)
        elif action_id == "append_rows":
            return await self._append_rows(parameters, credentials)
        elif action_id == "create_spreadsheet":
            return await self._create_spreadsheet(parameters, credentials)
        elif action_id == "get_spreadsheet_info":
            return await self._get_spreadsheet_info(parameters, credentials)
        else:
            return ConnectorResult(
                success=False,
                error=f"Unknown action: {action_id}",
            )

    async def _read_range(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Read values from a spreadsheet range."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        spreadsheet_id = parameters.get("spreadsheet_id")
        range_notation = parameters.get("range")

        if not spreadsheet_id or not range_notation:
            return ConnectorResult(
                success=False,
                error="Missing required parameters: spreadsheet_id, range",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range_notation}",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            values = result.get("values", [])
            return ConnectorResult(
                success=True,
                data={
                    "range": result.get("range"),
                    "values": values,
                    "rows": len(values),
                    "columns": len(values[0]) if values else 0,
                },
                message=f"Read {len(values)} row(s) from {range_notation}",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Google Sheets API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to read range: {str(e)}",
            )

    async def _write_range(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Write values to a spreadsheet range."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        spreadsheet_id = parameters.get("spreadsheet_id")
        range_notation = parameters.get("range")
        values = parameters.get("values")

        if not spreadsheet_id or not range_notation or not values:
            return ConnectorResult(
                success=False,
                error="Missing required parameters: spreadsheet_id, range, values",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range_notation}",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    params={"valueInputOption": "USER_ENTERED"},
                    json={"values": values},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            return ConnectorResult(
                success=True,
                data={
                    "updated_range": result.get("updatedRange"),
                    "updated_rows": result.get("updatedRows"),
                    "updated_columns": result.get("updatedColumns"),
                    "updated_cells": result.get("updatedCells"),
                },
                message=f"Wrote {result.get('updatedCells', 0)} cell(s) to {range_notation}",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Google Sheets API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to write range: {str(e)}",
            )

    async def _append_rows(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Append rows to a spreadsheet."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        spreadsheet_id = parameters.get("spreadsheet_id")
        range_notation = parameters.get("range")
        values = parameters.get("values")

        if not spreadsheet_id or not range_notation or not values:
            return ConnectorResult(
                success=False,
                error="Missing required parameters: spreadsheet_id, range, values",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range_notation}:append",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    params={
                        "valueInputOption": "USER_ENTERED",
                        "insertDataOption": "INSERT_ROWS",
                    },
                    json={"values": values},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            updates = result.get("updates", {})
            return ConnectorResult(
                success=True,
                data={
                    "updated_range": updates.get("updatedRange"),
                    "updated_rows": updates.get("updatedRows"),
                    "updated_cells": updates.get("updatedCells"),
                },
                message=f"Appended {updates.get('updatedRows', 0)} row(s)",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Google Sheets API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to append rows: {str(e)}",
            )

    async def _create_spreadsheet(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Create a new spreadsheet."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        title = parameters.get("title")
        if not title:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: title",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://sheets.googleapis.com/v4/spreadsheets",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json={"properties": {"title": title}},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            return ConnectorResult(
                success=True,
                data={
                    "spreadsheet_id": result.get("spreadsheetId"),
                    "spreadsheet_url": result.get("spreadsheetUrl"),
                    "title": result.get("properties", {}).get("title"),
                },
                message=f"Created spreadsheet '{title}'",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Google Sheets API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to create spreadsheet: {str(e)}",
            )

    async def _get_spreadsheet_info(
        self, parameters: Dict[str, Any], credentials: Dict[str, Any]
    ) -> ConnectorResult:
        """Get spreadsheet metadata."""
        access_token = credentials.get("access_token")
        if not access_token:
            return ConnectorResult(
                success=False,
                error="Missing access_token in credentials",
            )

        spreadsheet_id = parameters.get("spreadsheet_id")
        if not spreadsheet_id:
            return ConnectorResult(
                success=False,
                error="Missing required parameter: spreadsheet_id",
            )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"fields": "properties,sheets.properties"},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            properties = result.get("properties", {})
            sheets = result.get("sheets", [])

            return ConnectorResult(
                success=True,
                data={
                    "spreadsheet_id": properties.get("spreadsheetId"),
                    "title": properties.get("title"),
                    "locale": properties.get("locale"),
                    "time_zone": properties.get("timeZone"),
                    "sheets": [
                        {
                            "sheet_id": s.get("properties", {}).get("sheetId"),
                            "title": s.get("properties", {}).get("title"),
                            "index": s.get("properties", {}).get("index"),
                        }
                        for s in sheets
                    ],
                    "sheet_count": len(sheets),
                },
                message=f"Retrieved info for '{properties.get('title')}'",
            )

        except httpx.HTTPStatusError as e:
            return ConnectorResult(
                success=False,
                error=f"Google Sheets API error: {e.response.status_code} - {e.response.text}",
            )
        except Exception as e:
            return ConnectorResult(
                success=False,
                error=f"Failed to get spreadsheet info: {str(e)}",
            )
