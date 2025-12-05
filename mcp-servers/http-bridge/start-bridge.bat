@echo off
REM HTTP Bridge Startup Script for Windows
REM Starts the HTTP Bridge server

echo ========================================
echo Starting HTTP Bridge Server
echo ========================================
echo.

REM Change to bridge directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if dist exists, if not build
if not exist "dist" (
    echo Building TypeScript...
    call npm run build
    if errorlevel 1 (
        echo ERROR: Failed to build TypeScript
        pause
        exit /b 1
    )
)

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found
    echo Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo Please edit .env file with your configuration
    echo Press any key to continue...
    pause >nul
)

echo.
echo Starting HTTP Bridge on port 3001...
echo Press Ctrl+C to stop
echo.

REM Start the server
call npm start

pause
