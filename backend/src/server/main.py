"""
Main MCP Server - Combines all servers into a unified system
"""

import os
import asyncio
import logging
from typing import Dict, Any, Literal, List

import google.generativeai as genai
from fastmcp import FastMCP
from fastmcp.server.context import Context
from dotenv import load_dotenv
from dataclasses import dataclass

from fastmcp.server.elicitation import AcceptedElicitation
from fastmcp.client.sampling import SamplingMessage, SamplingParams, RequestContext

from .task_server import task_server
from ..medical_mcps.pubmed_server import pubmed_server

# Load environment variables
load_dotenv()

# Configure Gemini
if api_key := os.getenv("GEMINI_API_KEY"):
    genai.configure(api_key=api_key)

# Configure logging
logging.basicConfig(level=getattr(logging, os.getenv('FASTMCP_LOG_LEVEL', 'INFO')))
logger = logging.getLogger(__name__)

# Main Composition Server - Combines all servers
main_server = FastMCP("FuseHomeBackend")

async def gemini_sampling_handler(
    messages: list[SamplingMessage],
    params: SamplingParams,
    context: RequestContext
) -> str:
    """A fallback sampling handler using the Gemini API."""

    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # Convert SamplingMessage to the format Gemini expects
    gemini_messages = [m.content.text for m in messages if hasattr(m.content, 'text')]
    
    response = await model.generate_content_async(gemini_messages)
    return response.text

main_server.sampling_handler = gemini_sampling_handler

async def setup_server():
    """Setup the main server by importing all component servers."""
    logger.info("Setting up Fuse Home Backend server...")

    # Import servers with prefixes to avoid conflicts
    await main_server.import_server(task_server, prefix="task")
    await main_server.import_server(pubmed_server, prefix="pubmed")

    # Disable the simple create_task tool to force use of the intelligent one
    # We get the tool from the main_server's registry after it's been imported
    simple_create_task_tool = await main_server.get_tool("task_create_task")
    simple_create_task_tool.disable()
    logger.info("Disabled simple 'task_create_task' to favor 'task_intelligent_create_task'.")

    logger.info("Server composition complete with medical research capabilities")


@main_server.tool
async def server_overview(context: Context) -> Dict[str, Any]:
    """Get an overview of all available servers and their capabilities."""
    await context.info("Generating server overview")
    
    return {
        "main_server": "FuseHomeBackend",
        "description": "Multi-MCP server with Google Gen AI integration",
        "component_servers": {
            "task": {
                "name": "TaskServer",
                "description": "Task management and tracking",
                "tools": ["create_task", "list_tasks", "update_task_status"],
                "resources": ["tasks://all", "tasks://{task_id}"]
            },
            "pubmed": {
                "name": "PubMedServer",
                "description": "Access to PubMed articles and data",
                "tools": [
                    "pubmed_search_abstracts",
                    "pubmed_get_article_details",
                    "pubmed_search_by_author",
                    "pubmed_get_pubmed_capabilities",
                ],
                "prompts": ["pubmed_pubmed_research_prompt"],
                "resources": [],
            }
        },
        "integration": {
            "gemini_ready": bool(os.getenv("GEMINI_API_KEY") and 
                                os.getenv("GEMINI_API_KEY") != "your-gemini-api-key-here"),
            "total_tools": 10,
            "total_resources": 4,
            "total_prompts": 1
        }
    }


@dataclass
class TaskConfirmation:
    """Dataclass for the elicitation step."""
    description: str
    priority: Literal["low", "medium", "high"] = "medium"
    tags: str = ""


@main_server.tool(name="task_intelligent_create_task")
async def intelligent_create_task(description: str, ctx: Context) -> dict:
    """
    Creates a new task by first analyzing the description, suggesting tags, and asking for user confirmation. Use this for interactive task creation.
    """
    # 1. THINK: Use the client's LLM to suggest tags
    await ctx.info("Analyzing task to suggest tags...")
    suggestion_prompt = (
        "Based on the following task description, suggest 3 relevant, one-word, lowercase tags. "
        "Return them as a comma-separated list. For example: 'work,coding,urgent'\n\n"
        f"Description: {description}"
    )
    response = await ctx.sample(suggestion_prompt)
    suggested_tags = [tag.strip() for tag in response.text.split(',')]

    # 2. CONFIRM: Ask the user to confirm the details using elicitation
    await ctx.info("Please confirm the task details.")
    confirmation_request = TaskConfirmation(
        description=description,
        priority="medium",  # A default priority
        tags=", ".join(suggested_tags)
    )

    result = await ctx.elicit("Please review and confirm the new task:", response_type=TaskConfirmation)

    if not isinstance(result, AcceptedElicitation):
        return {"status": "cancelled", "message": "Task creation was cancelled by the user."}

    # 3. EXECUTE: Use the confirmed data to call the original `create_task` tool
    final_details = result.data
    task_args = final_details.__dict__
    # Convert the tags string back to a list for the final tool call
    task_args['tags'] = [tag.strip() for tag in task_args.get('tags', '').split(',') if tag.strip()]

    created_task = await ctx.fastmcp.tools.call_tool("task_create_task", task_args)

    return created_task.structured_content


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
