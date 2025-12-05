# Deploy Network Stack
Write-Host "Deploying FOD Network Stack..." -ForegroundColor Cyan

# Run CDK deploy with auto-approval
npx cdk deploy FOD-Network-dev --require-approval never

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nNetwork Stack deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nNetwork Stack deployment failed!" -ForegroundColor Red
    exit 1
}
