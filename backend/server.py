#!/usr/bin/env python3
"""Main entry point for the Fuse Home Backend MCP Server."""

from src.servers import epic_server, pubmed_server
from fastmcp.client.sampling import SamplingMessage, SamplingParams, RequestContext
from fastmcp.server.elicitation import AcceptedElicitation
from dataclasses import dataclass
from dotenv import load_dotenv
from fastmcp.server.context import Context
from fastmcp import FastMCP
import google.generativeai as genai
from typing import Dict, Any, Literal, List
import logging
import asyncio
import os
import sys


# Load environment variables
load_dotenv()

# Configure Gemini
if api_key := os.getenv("GEMINI_API_KEY"):
    genai.configure(api_key=api_key)

# Configure logging
logging.basicConfig(level=getattr(
    logging, os.getenv('FASTMCP_LOG_LEVEL', 'INFO')))
logger = logging.getLogger(__name__)

# Main Composition Server - Combines all servers
main_server = FastMCP("FuseHomeBackend")


async def setup_server():
    """Setup the main server by importing all component servers."""
    logger.info("Setting up Fuse Home Backend server...")

    # Import servers with prefixes to avoid conflicts
    await main_server.import_server(pubmed_server, prefix="pubmed")
    await main_server.import_server(epic_server, prefix="epic")

    logger.info(
        "Server composition complete with medical research and clinical capabilities")


@main_server.tool
async def server_overview(context: Context) -> Dict[str, Any]:
    """Get an overview of all available servers and their capabilities."""
    await context.info("Generating server overview")

    return {
        "main_server": "FuseHomeBackend",
        "description": "Multi-MCP server with Google Gen AI integration",
        "component_servers": {
            "pubmed": {
                "name": "PubMedServer",
                "description": "Access to PubMed articles and data",
                "tools": [
                    "pubmed_search_abstracts",
                    "pubmed_get_article_details",
                    "pubmed_search_by_author",
                    "pubmed_search_recent_articles",
                    "pubmed_get_pubmed_capabilities",
                ],
                "prompts": ["pubmed_pubmed_research_prompt"],
                "resources": [],
            },
            "epic": {
                "name": "EpicServer",
                "description": "Epic FHIR access for clinical workflows",
                "tools": [
                    "epic_get_patient_summary",
                    "epic_search_patients",
                    "epic_get_patient_appointments",
                    "epic_get_patient_medications",
                    "epic_get_epic_capabilities",
                ],
                "prompts": ["epic_epic_clinical_assistant_prompt"],
                "resources": [],
            },
        },
        "integration": {
            "gemini_ready": bool(os.getenv("GEMINI_API_KEY") and
                                 os.getenv("GEMINI_API_KEY") != "your-gemini-api-key-here"),
            "total_tools": 10,
            "total_resources": 0,
            "total_prompts": 2
        }
    }


def start_server():
    async def setup_and_serve():
        await setup_server()

        # Get configuration
        port = int(os.getenv("DEFAULT_PORT", 8000))
        host = os.getenv("DEFAULT_HOST", "localhost")

        logger.info(f"Starting Fuse Home Backend server on {host}:{port}")
        logger.info("Available endpoints:")
        logger.info(f"  - MCP: http://{host}:{port}/mcp")
        logger.info(f"  - Health: http://{host}:{port}/health")

    # Run the setup
    asyncio.run(setup_and_serve())

    # Get configuration
    port = int(os.getenv("DEFAULT_PORT", 8000))
    host = os.getenv("DEFAULT_HOST", "localhost")

    # Run with HTTP transport for remote access
    main_server.run(transport="http", port=port, host=host)



def main():
    """Main function to start the server."""
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Server error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
