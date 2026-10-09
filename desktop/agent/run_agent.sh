#!/usr/bin/env bash
# ChainProof Desktop Local Scanner Agent Launcher for Linux/macOS
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/../.."

echo "Starting ChainProof Desktop Local Scanner Agent on port 8008..."
if [ -f "backend/.venv/bin/python" ]; then
    backend/.venv/bin/python desktop/agent/local_agent.py 8008
else
    python3 desktop/agent/local_agent.py 8008
fi
