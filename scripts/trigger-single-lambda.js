#!/usr/bin/env node

/**
 * Single Lambda CI/CD Pipeline Trigger Script
 * Triggers GitHub Actions workflow for specific Lambda deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Check if GitHub CLI is installed
 */
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if we're in a git repository
 */
function checkGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current branch name
 */
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get remote repository info
 */
function getRepoInfo() {
  try {
    const remote = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
    const match = remote.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        url: remote
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if specific Lambda function exists and has changes
 */
function checkLambdaFunction(lambdaName) {
  const lambdaPath = path.join('src', 'lambda', lambdaName);
  
  if (!fs.existsSync(lambdaPath)) {
    return {
      exists: false,
      hasChanges: false,
      files: []
    };
  }
  
  // Check for changes in the Lambda directory
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
    const changedFiles = gitStatus
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3)) // Remove git status prefix
      .filter(file => file.startsWith(lambdaPath));
    
    return {
      exists: true,
      hasChanges: changedFiles.length > 0,
      files: changedFiles
    };
  } catch (error) {
    return {
      exists: true,
      hasChanges: false,
      files: []
    };
  }
}

/**
 * Check git status
 */
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return {
      hasUncommitted: status.trim().length > 0,
      status: status
    };
  } catch (error) {
    return {
      hasUncommitted: false,
      status: ''
    };
  }
}

/**
 * Trigger GitHub Actions workflow for specific Lambda
 */
function triggerWorkflow(lambdaName, environment = 'dev') {
  console.log(`\n🚀 Triggering GitHub Actions workflow for Lambda: ${lambdaName}`);
  console.log(`🎯 Environment: ${environment}\n`);
  
  try {
    const result = execSync(
      `gh workflow run lambda-cicd.yml -f environment=${environment} -f lambda_function=${lambdaName}`,
      { encoding: 'utf-8', stdio: 'inherit' }
    );
    
    console.log('\n✅ Workflow triggered successfully!');
    console.log('\nTo monitor the deployment:');
    console.log('  gh run list --workflow=lambda-cicd.yml');
    console.log('  gh run watch');
    
    return true;
  } catch (error) {
    console.error('\n❌ Failed to trigger workflow:', error.message);
    return false;
  }
}

/**
 * Display pre-deployment summary
 */
function displaySummary(lambdaName, lambdaInfo, gitStatus, repoInfo, branch) {
  console.log('\n📋 Single Lambda Deployment Summary');
  console.log('═'.repeat(60));
  
  // Repository info
  if (repoInfo) {
    console.log(`\n📦 Repository: ${repoInfo.owner}/${repoInfo.repo}`);
  }
  console.log(`🌿 Branch: ${branch}`);
  
  // Lambda info
  console.log(`\n🔧 Target Lambda: ${lambdaName}`);
  if (lambdaInfo.exists) {
    console.log('✅ Lambda function exists');
    if (lambdaInfo.hasChanges) {
      console.log('🔄 Changes detected:');
      lambdaInfo.files.forEach(file => {
        console.log(`   • ${file}`);
      });
    } else {
      console.log('📝 No changes detected (will deploy current version)');
    }
  } else {
    console.log('❌ Lambda function does not exist!');
  }
  
  // Git status
  if (gitStatus.hasUncommitted) {
    console.log('\n⚠️  Warning: Uncommitted changes detected!');
    console.log('   Please commit your changes before deploying.');
  } else {
    console.log('\n✅ All changes committed');
  }
  
  console.log('\n' + '═'.repeat(60));
}

/**
 * Interactive confirmation
 */
function confirmDeployment(lambdaName, environment) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question(`\n❓ Deploy ${lambdaName} to ${environment}? (yes/no): `, (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 FOD Single Lambda CI/CD Pipeline Trigger');
  console.log('═'.repeat(60));
  
  // Get Lambda name from command line
  const args = process.argv.slice(2);
  const lambdaName = args[0];
  const environment = args[1] || 'dev';
  
  if (!lambdaName) {
    console.error('❌ Lambda function name is required!');
    console.error('\nUsage: node scripts/trigger-single-lambda.js <lambda-name> [environment]');
    console.error('Example: node scripts/trigger-single-lambda.js test-activation-handler dev');
    process.exit(1);
  }
  
  if (!['dev', 'staging', 'prod'].includes(environment)) {
    console.error(`\n❌ Invalid environment: ${environment}`);
    console.error('Valid options: dev, staging, prod');
    process.exit(1);
  }
  
  // Check prerequisites
  console.log('\n🔍 Checking prerequisites...');
  
  if (!checkGitRepo()) {
    console.error('❌ Not a git repository!');
    process.exit(1);
  }
  console.log('✓ Git repository detected');
  
  if (!checkGitHubCLI()) {
    console.error('❌ GitHub CLI (gh) not installed!');
    console.error('\nInstall it from: https://cli.github.com/');
    process.exit(1);
  }
  console.log('✓ GitHub CLI available');
  
  // Get repository info
  const repoInfo = getRepoInfo();
  const branch = getCurrentBranch();
  
  // Check Lambda function
  console.log(`\n🔍 Checking Lambda function: ${lambdaName}...`);
  const lambdaInfo = checkLambdaFunction(lambdaName);
  const gitStatus = checkGitStatus();
  
  if (!lambdaInfo.exists) {
    console.error(`\n❌ Lambda function '${lambdaName}' not found!`);
    console.error(`Expected path: src/lambda/${lambdaName}/`);
    process.exit(1);
  }
  
  // Display summary
  displaySummary(lambdaName, lambdaInfo, gitStatus, repoInfo, branch);
  
  // Check for uncommitted changes
  if (gitStatus.hasUncommitted) {
    console.log('\n⚠️  Warning: You have uncommitted changes!');
    console.log('The pipeline will deploy the last committed version.');
    console.log('\nTo include current changes:');
    console.log('  git add .');
    console.log('  git commit -m "Update Lambda function"');
    console.log('  git push');
  }
  
  // Confirm deployment
  const confirmed = await confirmDeployment(lambdaName, environment);
  
  if (!confirmed) {
    console.log('\n❌ Deployment cancelled by user');
    process.exit(0);
  }
  
  // Trigger workflow
  const success = triggerWorkflow(lambdaName, environment);
  
  if (success) {
    console.log('\n🎉 Pipeline triggered successfully!');
    console.log(`\n📊 Deployment Details:`);
    console.log(`   Lambda: ${lambdaName}`);
    console.log(`   Environment: ${environment}`);
    console.log(`   Branch: ${branch}`);
    console.log('\nMonitor the deployment:');
    console.log('  1. GitHub Actions: https://github.com/' + (repoInfo ? `${repoInfo.owner}/${repoInfo.repo}/actions` : 'your-repo/actions'));
    console.log('  2. AWS Console: https://console.aws.amazon.com/lambda');
    console.log('  3. CLI: gh run watch');
    
    console.log('\n⏱️  Expected deployment time: ~3-5 minutes');
    console.log('\n🔍 The pipeline will:');
    console.log('   1. Build and test the Lambda function');
    console.log('   2. Package the deployment artifact');
    console.log('   3. Deploy to AWS Lambda');
    console.log('   4. Update function configuration');
    console.log('   5. Run post-deployment verification');
    
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { triggerWorkflow, checkGitHubCLI };