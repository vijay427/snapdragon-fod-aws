# Deploy remaining FOD stacks
Write-Host "Deploying remaining FOD stacks..." -ForegroundColor Cyan

$stacks = @("FOD-Compute-dev", "FOD-API-dev", "FOD-IoT-dev", "FOD-Monitoring-dev")

foreach ($stack in $stacks) {
    Write-Host "`nDeploying: $stack" -ForegroundColor Yellow
    npx cdk deploy $stack --require-approval never
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to deploy $stack" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ $stack deployed" -ForegroundColor Green
}

Write-Host "`n✓ All stacks deployed successfully!" -ForegroundColor Green
