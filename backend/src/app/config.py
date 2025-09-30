"""Application configuration and shared client instances."""
from __future__ import annotations

import logging
import os
import sys
from functools import lru_cache
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastmcp import Client
from google import genai

load_dotenv()

logger = logging.getLogger("fuse_home.app.config")

BASE_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = BASE_DIR / "src"
if SRC_DIR.exists():
    src_path = str(SRC_DIR)
    if src_path not in sys.path:
        sys.path.append(src_path)
        logger.debug("Added src directory to sys.path: %%s", src_path)


GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
MCP_SERVER_URL: str = os.getenv("MCP_SERVER_URL", "http://localhost:8000/mcp")
DEFAULT_HOST: str = os.getenv("DEFAULT_HOST", "0.0.0.0")
DEFAULT_PORT: int = int(os.getenv("DEFAULT_PORT", "8001"))


@lru_cache(maxsize=1)
def get_gemini_client() -> genai.Client:
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set; Gemini requests will fail.")
    return genai.Client(api_key=GEMINI_API_KEY)


def new_mcp_client() -> Client:
    return Client(MCP_SERVER_URL)
