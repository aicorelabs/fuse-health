#!/bin/bash

# Setup and Test Script for Template Engine
# This script installs dependencies and runs tests

set -e  # Exit on error

echo "=================================================="
echo "Template Engine Setup and Test"
echo "=================================================="

# Change to backend directory
cd "$(dirname "$0")"

echo ""
echo "Step 1: Installing dependencies..."
echo "--------------------------------------------------"

# Check if uv is available
if command -v uv &> /dev/null; then
    echo "Using uv for dependency management..."
    uv pip install jsonpath-ng
else
    echo "Using pip for dependency management..."
    pip install jsonpath-ng
fi

echo "✓ Dependencies installed"

echo ""
echo "Step 2: Running template engine tests..."
echo "--------------------------------------------------"

# Run tests
pytest tests/test_template_engine.py -v --tb=short

echo ""
echo "=================================================="
echo "✓ Setup and tests complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "  1. Review the documentation:"
echo "     - backend/docs/template-engine-guide.md"
echo "     - EXECUTION-ENGINE-TEMPLATE-FUNCTIONS.md"
echo ""
echo "  2. Try the examples:"
echo "     python backend/docs/workflow_examples_with_templates.py"
echo ""
echo "  3. Start the server and test workflows:"
echo "     python backend/server.py"
echo ""
echo "=================================================="
