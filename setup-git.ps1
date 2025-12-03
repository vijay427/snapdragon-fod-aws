# Git Setup Script
$gitPath = "C:\Program Files\Git\bin\git.exe"

Write-Host "Git Setup for Snapdragon FOD Project" -ForegroundColor Cyan

# Configure git
& $gitPath config user.name "vijay427"
& $gitPath config user.email "vijay427@users.noreply.github.com"

# Add remote
$remoteExists = & $gitPath remote get-url origin 2>$null
if ($remoteExists) {
    & $gitPath remote remove origin
}
& $gitPath remote add origin https://github.com/vijay427/snapdragon-fod-aws.git

Write-Host "Git configured successfully!" -ForegroundColor Green
Write-Host "Remote: https://github.com/vijay427/snapdragon-fod-aws.git" -ForegroundColor Cyan
