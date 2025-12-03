# Push to GitHub Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pushing to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$gitPath = "C:\Program Files\Git\bin\git.exe"

# Add all files
Write-Host "Adding files..." -ForegroundColor Yellow
& $gitPath add .
Write-Host "✓ Files staged" -ForegroundColor Green
Write-Host ""

# Show what will be committed
Write-Host "Files to be committed:" -ForegroundColor Yellow
& $gitPath status --short
Write-Host ""

# Commit
Write-Host "Committing..." -ForegroundColor Yellow
& $gitPath commit -m "Initial commit: Snapdragon FOD system with AWS integration

- Requirements document with EARS-compliant acceptance criteria
- Agent steering files (coding standards, AWS security, Qualcomm SDK)
- Agent hooks for automated testing and validation
- Custom MCP servers (Snapdragon simulator, GitHub integration)
- Project setup and documentation"

Write-Host "✓ Changes committed" -ForegroundColor Green
Write-Host ""

# Pull first (in case README was created)
Write-Host "Pulling from GitHub..." -ForegroundColor Yellow
& $gitPath pull origin main --allow-unrelated-histories 2>$null
Write-Host ""

# Push
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
& $gitPath push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Repository: https://github.com/vijay427/snapdragon-fod-aws" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Push failed. You may need to authenticate with GitHub." -ForegroundColor Red
    Write-Host "Try: git push -u origin main" -ForegroundColor Yellow
}
