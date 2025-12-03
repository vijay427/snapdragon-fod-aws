# Kiro Features Setup Script for Windows
# Run this in PowerShell to set up all Kiro features

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kiro Features Setup for FOD Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if uv is installed
Write-Host "Step 1: Checking for uv/uvx installation..." -ForegroundColor Yellow
try {
    $uvVersion = uv --version 2>$null
    Write-Host "✓ uv is installed: $uvVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ uv is not installed" -ForegroundColor Red
    Write-Host "Installing uv..." -ForegroundColor Yellow
    try {
        powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
        Write-Host "✓ uv installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to install uv automatically" -ForegroundColor Red
        Write-Host "Please install manually from: https://docs.astral.sh/uv/getting-started/installation/" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Step 2: Verify directory structure
Write-Host "Step 2: Verifying directory structure..." -ForegroundColor Yellow

$directories = @(
    ".kiro",
    ".kiro/hooks",
    ".kiro/settings",
    ".kiro/steering",
    ".kiro/specs"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "✓ $dir exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $dir missing - creating..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Created $dir" -ForegroundColor Green
    }
}

Write-Host ""

# Step 3: Verify hook files
Write-Host "Step 3: Verifying agent hooks..." -ForegroundColor Yellow

$hooks = @(
    ".kiro/hooks/test-lambda-functions.json",
    ".kiro/hooks/validate-feature-logic.json",
    ".kiro/hooks/restart-simulator.json",
    ".kiro/hooks/auto-push-to-github.json"
)

foreach ($hook in $hooks) {
    if (Test-Path $hook) {
        Write-Host "✓ $hook exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $hook missing" -ForegroundColor Red
    }
}

Write-Host ""

# Step 4: Verify steering files
Write-Host "Step 4: Verifying steering files..." -ForegroundColor Yellow

$steeringFiles = @(
    ".kiro/steering/coding-standards.md",
    ".kiro/steering/aws-security-standards.md",
    ".kiro/steering/qualcomm-car-to-cloud-sdk.md"
)

foreach ($file in $steeringFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
    }
}

Write-Host ""

# Step 5: Check MCP configuration
Write-Host "Step 5: Checking MCP configuration..." -ForegroundColor Yellow

if (Test-Path ".kiro/settings/mcp.json") {
    Write-Host "✓ MCP configuration exists" -ForegroundColor Green
    $mcpConfig = Get-Content ".kiro/settings/mcp.json" -Raw | ConvertFrom-Json
    Write-Host "  Configured servers:" -ForegroundColor Cyan
    foreach ($server in $mcpConfig.mcpServers.PSObject.Properties) {
        Write-Host "    - $($server.Name)" -ForegroundColor White
    }
} else {
    Write-Host "✗ MCP configuration missing" -ForegroundColor Red
}

Write-Host ""

# Step 6: Environment variables check
Write-Host "Step 6: Checking environment variables..." -ForegroundColor Yellow

$envVars = @{
    "GITHUB_TOKEN" = "GitHub Personal Access Token"
    "MONGODB_CONNECTION_STRING" = "MongoDB connection string"
}

foreach ($var in $envVars.GetEnumerator()) {
    $value = [Environment]::GetEnvironmentVariable($var.Key)
    if ($value) {
        Write-Host "✓ $($var.Key) is set" -ForegroundColor Green
    } else {
        Write-Host "✗ $($var.Key) is not set ($($var.Value))" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 7: Test MCP server
Write-Host "Step 7: Testing MCP server availability..." -ForegroundColor Yellow

try {
    Write-Host "  Testing filesystem MCP server..." -ForegroundColor Cyan
    $testResult = uvx mcp-server-filesystem --help 2>&1
    Write-Host "✓ Filesystem MCP server is available" -ForegroundColor Green
} catch {
    Write-Host "✗ MCP server test failed" -ForegroundColor Red
    Write-Host "  This is normal on first run - uvx will download on first use" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart Kiro IDE completely" -ForegroundColor White
Write-Host "2. Open Command Palette (Ctrl+Shift+P)" -ForegroundColor White
Write-Host "3. Run: 'Kiro: Reconnect MCP Servers'" -ForegroundColor White
Write-Host "4. Check Kiro sidebar for:" -ForegroundColor White
Write-Host "   - Agent Steering (should show 3 files)" -ForegroundColor White
Write-Host "   - MCP Servers (should show filesystem)" -ForegroundColor White
Write-Host "   - Agent Hooks (access via Command Palette)" -ForegroundColor White
Write-Host ""

Write-Host "To set environment variables:" -ForegroundColor Yellow
Write-Host '  $env:GITHUB_TOKEN = "your_token_here"' -ForegroundColor White
Write-Host '  $env:MONGODB_CONNECTION_STRING = "your_connection_string"' -ForegroundColor White
Write-Host ""

Write-Host "For detailed troubleshooting, see: TROUBLESHOOTING.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Setup script completed!" -ForegroundColor Green
