#!/usr/bin/env python3
"""
Main entry point for the Fuse Home Backend MCP Server
"""

import sys
from src.server.main import start_server


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
