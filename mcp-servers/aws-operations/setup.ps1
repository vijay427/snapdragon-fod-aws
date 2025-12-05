# Setup AWS Operations MCP Server
Write-Host "Setting up AWS Operations MCP Server..." -ForegroundColor Cyan

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install

# Build TypeScript
Write-Host "`nBuilding TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ AWS Operations MCP Server setup complete!" -ForegroundColor Green
    Write-Host "`nThe server provides these tools:" -ForegroundColor Cyan
    Write-Host "  - get_stack_status: Check CloudFormation stack status" -ForegroundColor White
    Write-Host "  - list_fod_stacks: List all FOD stacks" -ForegroundColor White
    Write-Host "  - get_stack_outputs: Get stack outputs (API URLs, etc.)" -ForegroundColor White
    Write-Host "  - get_lambda_metrics: Get Lambda function metrics" -ForegroundColor White
    Write-Host "  - list_lambda_functions: List all FOD Lambda functions" -ForegroundColor White
    Write-Host "  - get_deployment_events: Get recent deployment events" -ForegroundColor White
} else {
    Write-Host "`n✗ Setup failed!" -ForegroundColor Red
    exit 1
}
