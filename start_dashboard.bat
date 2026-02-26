@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   Social Media Agent Dashboard
echo ========================================
echo.
echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
python serve.py
echo.
echo Server stopped.
pause
