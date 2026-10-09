@echo off
REM ChainProof Desktop Local Scanner Agent Launcher
cd /d "%~dp0..\.."
echo Starting ChainProof Desktop Local Scanner Agent on port 8008...
if exist "backend\.venv\Scripts\python.exe" (
    backend\.venv\Scripts\python.exe desktop\agent\local_agent.py 8008
) else (
    python desktop\agent\local_agent.py 8008
)
pause
