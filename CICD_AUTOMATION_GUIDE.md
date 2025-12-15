# 🚀 CI/CD Automation Guide

Complete guide for setting up automatic code deployment for the Snapdragon FOD AWS system.

## 📋 Overview

This automation system provides multiple ways to trigger deployments when code changes:

1. **Automatic GitHub Actions** - Triggers on push/PR
2. **Manual Auto-Deploy Script** - One-time deployment
3. **File Watcher** - Continuous monitoring and deployment
4. **Git Hooks** - Validation and guidance during git operations

## 🎯 Quick Start

### 1. Setup Git Hooks (Recommended)
```bash
# Install git hooks for validation and guidance
npm run hooks:setup

# Check hook status
npm run hooks:list
```

### 2. One-Time Auto Deploy
```bash
# Deploy current changes
npm run deploy

# Or directly
node scripts/auto-deploy.js
```

### 3. Continuous Monitoring
```bash
# Start file watcher (monitors and auto-deploys)
npm run deploy:watch

# Or directly
node scripts/watch-and-deploy.js
```

## 🔧 Detailed Setup

### GitHub Actions Configuration

The workflow (`.github/workflows/lambda-cicd.yml`) now supports:

**Automatic Triggers:**
- ✅ Push to `main` branch → Production deployment
- ✅ Push to `develop` branch → Staging deployment  
- ✅ Push to other branches → Development deployment
- ✅ Pull requests → Build and test only

**Manual Triggers:**
- ✅ Workflow dispatch with environment selection
- ✅ Force deploy all functions option

**Smart Change Detection:**
- ✅ Detects specific Lambda function changes
- ✅ Detects shared code changes (deploys all functions)
- ✅ Detects infrastructure changes

### Environment Mapping

| Branch | Environment | Auto-Deploy |
|--------|-------------|-------------|
| `main` | `prod` | ✅ Yes |
| `develop` | `staging` | ✅ Yes |
| Others | `dev` | ✅ Yes |

## 🛠️ Available Scripts

### Deployment Scripts

```bash
# One-time deployment
npm run deploy                    # Interactive deployment
node scripts/auto-deploy.js      # Same as above

# Continuous monitoring
npm run deploy:watch              # Start file watcher
node scripts/watch-and-deploy.js # Same as above
```

### Git Hooks Management

```bash
# Setup hooks
npm run hooks:setup               # Install git hooks
node scripts/setup-git-hooks.js  # Same as above

# Manage hooks
npm run hooks:list                # Check hook status
npm run hooks:remove              # Remove all hooks
```

### CI/CD Management

```bash
# Trigger pipeline manually
npm run cicd:trigger              # Trigger GitHub Actions
node scripts/trigger-cicd.js     # Same as above
```

## 📊 Workflow Details

### Auto-Deploy Script Features

**Smart Change Detection:**
- Detects Lambda function changes
- Detects shared code changes
- Generates descriptive commit messages
- Shows deployment preview

**Git Integration:**
- Stages all changes
- Creates meaningful commits
- Pushes to remote repository
- Triggers GitHub Actions automatically

**Environment Detection:**
- `main` branch → Production
- `develop` branch → Staging  
- Other branches → Development

### File Watcher Features

**Real-time Monitoring:**
- Watches `src/lambda/`, `src/shared/`, `infrastructure/lib/`
- Excludes build artifacts and dependencies
- Debounces changes (2-second delay)
- Batches multiple changes

**Smart Deployment:**
- Only deploys when Lambda-affecting changes detected
- Prevents deployment loops
- Provides detailed change summaries

### Git Hooks Features

**Pre-push Hook:**
- Runs linting (`npm run lint`)
- Runs tests (`npm test`)
- Builds TypeScript (`npm run build`)
- Prevents push if validation fails

**Post-commit Hook:**
- Detects Lambda changes
- Provides deployment guidance
- Suggests next steps

## 🎯 Usage Scenarios

### Scenario 1: Development Workflow
```bash
# 1. Setup hooks (one-time)
npm run hooks:setup

# 2. Make code changes
# ... edit files ...

# 3. Commit (hooks run automatically)
git add .
git commit -m "Add new feature"

# 4. Push (triggers deployment)
git push
```

### Scenario 2: Continuous Development
```bash
# Start file watcher
npm run deploy:watch

# Make changes - deployment happens automatically
# ... edit files ...
# Watcher detects changes and deploys
```

### Scenario 3: Manual Deployment
```bash
# Make changes
# ... edit files ...

# Deploy manually
npm run deploy
```

### Scenario 4: Emergency Deployment
```bash
# Force deploy all functions
node scripts/auto-deploy.js --force

# Or via GitHub Actions
gh workflow run lambda-cicd.yml -f environment=prod -f force_deploy=true
```

## 🔍 Monitoring Deployments

### GitHub Actions
```bash
# View workflow runs
gh run list --workflow=lambda-cicd.yml

# Watch current run
gh run watch

# View specific run
gh run view <run-id>
```

### AWS Console
- **Lambda Console**: https://console.aws.amazon.com/lambda
- **CloudWatch Logs**: Monitor function execution
- **API Gateway**: Test endpoints

### Local Monitoring
```bash
# Check deployment status
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'FOD-')].FunctionName"

# Check function health
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=FOD-Compute-dev-CatalogHandler \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## 🚨 Troubleshooting

### Common Issues

**1. Git Hooks Not Running**
```bash
# Check if hooks are installed
npm run hooks:list

# Reinstall hooks
npm run hooks:remove
npm run hooks:setup
```

**2. GitHub Actions Not Triggering**
```bash
# Check if push triggered workflow
gh run list --workflow=lambda-cicd.yml

# Manually trigger workflow
gh workflow run lambda-cicd.yml -f environment=dev
```

**3. File Watcher Not Detecting Changes**
```bash
# Check if files are in watched paths
# Watched: src/lambda/, src/shared/, infrastructure/lib/
# Excluded: node_modules/, dist/, cdk.out/

# Restart watcher
# Ctrl+C to stop, then npm run deploy:watch
```

**4. Deployment Failures**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check CDK status
cd infrastructure
cdk diff

# Check Lambda function logs
aws logs tail /aws/lambda/FOD-Compute-dev-CatalogHandler --follow
```

### Debug Mode

**Enable verbose logging:**
```bash
# Auto-deploy with debug
DEBUG=1 node scripts/auto-deploy.js

# File watcher with debug
DEBUG=1 node scripts/watch-and-deploy.js
```

## 🔐 Security Considerations

### GitHub Secrets Required
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

### IAM Permissions Required
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:ListFunctions",
        "cloudformation:DescribeStacks",
        "cloudformation:UpdateStack",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

### Best Practices
- ✅ Use separate AWS accounts for dev/staging/prod
- ✅ Rotate AWS credentials regularly
- ✅ Use least-privilege IAM policies
- ✅ Enable CloudTrail for audit logging
- ✅ Review deployment changes before production

## 📈 Advanced Configuration

### Custom File Watcher Config
```javascript
// scripts/watch-and-deploy.js
const customConfig = {
  paths: ['src/lambda', 'src/shared', 'custom-path'],
  debounceMs: 5000, // 5 second delay
  excludePatterns: [/\.test\./, /\.spec\./]
};

startWatching(customConfig);
```

### Custom Auto-Deploy Config
```javascript
// scripts/auto-deploy.js
const CONFIG = {
  commitMessageTemplate: 'feat: {changes}',
  branch: 'main',
  remote: 'origin'
};
```

## 🎉 Summary

This automation system provides:

✅ **Automatic deployment** on code changes  
✅ **Smart change detection** for Lambda functions  
✅ **Multiple trigger mechanisms** (push, manual, file watcher)  
✅ **Environment-based deployment** (dev/staging/prod)  
✅ **Code validation** before deployment  
✅ **Comprehensive monitoring** and logging  

Choose the approach that best fits your development workflow!