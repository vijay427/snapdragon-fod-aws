@echo off
REM Tunnel Setup Script for Windows
REM Sets up ngrok tunnel to expose HTTP Bridge to AWS Lambda

echo ========================================
echo HTTP Bridge Tunnel Setup
echo ========================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if errorlevel 1 (
    echo ERROR: ngrok is not installed
    echo.
    echo Please install ngrok from: https://ngrok.com/download
    echo.
    echo After installation:
    echo 1. Extract ngrok.exe to a folder
    echo 2. Add that folder to your PATH
    echo 3. Run: ngrok config add-authtoken YOUR_AUTH_TOKEN
    echo.
    pause
    exit /b 1
)

echo ngrok is installed
echo.
echo Starting ngrok tunnel on port 3001...
echo.
echo IMPORTANT: Keep this window open!
echo Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
echo Set it as HTTP_BRIDGE_URL in your Lambda environment
echo.
echo Press Ctrl+C to stop the tunnel
echo.

REM Start ngrok
ngrok http 3001

pause
