# Deploy all FOD stacks in order
# This script deploys each stack sequentially with proper dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FOD System - Sequential Stack Deployment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$stacks = @(
    @{Name="FOD-Network-dev"; Description="Network infrastructure (VPC, Subnets, Security Groups)"},
    @{Name="FOD-Database-dev"; Description="Database configuration (MongoDB secrets)"},
    @{Name="FOD-Compute-dev"; Description="Lambda functions"},
    @{Name="FOD-API-dev"; Description="API Gateway and authentication"},
    @{Name="FOD-IoT-dev"; Description="IoT Core for vehicle communication"},
    @{Name="FOD-Monitoring-dev"; Description="CloudWatch dashboards and alarms"}
)

$successCount = 0
$failedStack = $null

foreach ($stack in $stacks) {
    Write-Host "`n[$($successCount + 1)/$($stacks.Count)] Deploying: $($stack.Name)" -ForegroundColor Yellow
    Write-Host "Description: $($stack.Description)" -ForegroundColor Gray
    Write-Host "-------------------------------------------" -ForegroundColor Gray
    
    # Deploy with auto-approval
    npx cdk deploy $stack.Name --require-approval never
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $($stack.Name) deployed successfully!`n" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "✗ $($stack.Name) deployment failed!`n" -ForegroundColor Red
        $failedStack = $stack.Name
        break
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Successfully deployed: $successCount/$($stacks.Count) stacks" -ForegroundColor $(if ($successCount -eq $stacks.Count) { "Green" } else { "Yellow" })

if ($failedStack) {
    Write-Host "Failed at: $failedStack" -ForegroundColor Red
    Write-Host "`nTo retry, run: npx cdk deploy $failedStack --require-approval never" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`nAll stacks deployed successfully! 🎉" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Check AWS Console for deployed resources" -ForegroundColor White
    Write-Host "2. Configure MongoDB connection string in Secrets Manager" -ForegroundColor White
    Write-Host "3. Test the API endpoints" -ForegroundColor White
    exit 0
}
