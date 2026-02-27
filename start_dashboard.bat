@echo off
cd /d "%~dp0"
cls
echo.
echo ========================================
echo   Social Media Agent Dashboard v2
echo ========================================
echo.

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Please install Python and add it to PATH.
    pause
    exit /b 1
)

echo Starting server on http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
python serve.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Server failed to start. Check serve.py for details.
)
echo.
echo Server stopped.
pause
