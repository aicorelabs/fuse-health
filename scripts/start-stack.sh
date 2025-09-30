#!/usr/bin/env bash
set -euo pipefail

# Root directories
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Python environment activation (defaults to backend/.venv)
PY_ENV_PATH="${PY_ENV_PATH:-$BACKEND_DIR/.venv}"

activate_python_env() {
  if [[ -n "${UV_ACTIVE:-}" ]]; then
    return
  fi

  if [[ -d "$PY_ENV_PATH" && -f "$PY_ENV_PATH/bin/activate" ]]; then
    echo "🐍 Activating Python environment at $PY_ENV_PATH"
    # shellcheck disable=SC1090
    source "$PY_ENV_PATH/bin/activate"
  else
    echo "Error: Python environment not found at $PY_ENV_PATH" >&2
    echo "Create one with:\n  cd $BACKEND_DIR\n  python3 -m venv .venv\n  source .venv/bin/activate\n  pip install -r requirements.txt (or uv sync)" >&2
    echo "Alternatively, set PY_ENV_PATH to your environment path before running this script." >&2
    exit 1
  fi
}

activate_python_env

# Determine Python executable after activation
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"
if [[ -z "$PYTHON_BIN" ]]; then
  PYTHON_BIN="$(command -v python || true)"
fi

if [[ -z "$PYTHON_BIN" ]]; then
  echo "Error: Python interpreter not found even after activating the virtual environment" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but not found in PATH" >&2
  exit 1
fi

# Load backend environment variables if present
if [[ -f "$BACKEND_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$BACKEND_DIR/.env"
  set +a
fi

export PYTHONPATH="$BACKEND_DIR/src:${PYTHONPATH:-}"

PIDS=()
NAMES=()

cleanup() {
  echo
  echo "🔚 Shutting down services..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT INT TERM

start_process() {
  local name="$1"
  shift
  echo "▶️  Starting $name"
  "$@" &
  local pid=$!
  PIDS+=("$pid")
  NAMES+=("$name")
  sleep 1
}

# Start MCP server
cd "$BACKEND_DIR"
start_process "MCP server" "$PYTHON_BIN" server.py

# Start FastAPI bridge
start_process "FastAPI bridge" "$PYTHON_BIN" client.py

# Start frontend
cd "$FRONTEND_DIR"
start_process "Next.js frontend" npm run dev

cat <<"EOF"

✅ All services started:
  • MCP server (http://localhost:8000/mcp)
  • FastAPI bridge (http://localhost:8001)
  • Next.js frontend (http://localhost:3000)

Press Ctrl+C to stop and clean up all processes.
EOF

# Keep script alive while child processes run
wait
