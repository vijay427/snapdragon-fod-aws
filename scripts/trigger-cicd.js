#!/usr/bin/env node

/**
 * CI/CD Pipeline Trigger Script
 * Triggers GitHub Actions workflow for Lambda deployment
 */

const { execSync } = require('child_process');

// Import detection utilities
const { detectChangedLambdas, checkGitStatus } = require('./detect-lambda-changes');

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
    // Parse GitHub repo from URL
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
 * Trigger GitHub Actions workflow
 */
function triggerWorkflow(environment = 'dev') {
  console.log(`\n🚀 Triggering GitHub Actions workflow for environment: ${environment}\n`);
  
  try {
    const result = execSync(
      `gh workflow run lambda-cicd.yml -f environment=${environment}`,
      { encoding: 'utf-8', stdio: 'inherit' }
    );
    
    console.log('\n✅ Workflow triggered successfully!');
    console.log('\nTo view the workflow run:');
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
function displaySummary(detection, gitStatus, repoInfo, branch) {
  console.log('\n📋 Pre-Deployment Summary');
  console.log('═'.repeat(60));
  
  // Repository info
  if (repoInfo) {
    console.log(`\n📦 Repository: ${repoInfo.owner}/${repoInfo.repo}`);
  }
  console.log(`🌿 Branch: ${branch}`);
  
  // Git status
  if (gitStatus.hasUncommitted) {
    console.log('\n⚠️  Warning: Uncommitted changes detected!');
    console.log('   Please commit your changes before deploying.');
    console.log('\nUncommitted files:');
    gitStatus.status.split('\n').forEach(line => {
      if (line.trim()) console.log(`   ${line}`);
    });
  } else {
    console.log('\n✅ All changes committed');
  }
  
  // Lambda changes
  console.log(`\n📊 Lambda Functions:`);
  console.log(`   Total: ${detection.allLambdas.length}`);
  console.log(`   Changed: ${detection.changedLambdas.length}`);
  
  if (detection.changedLambdas.length > 0) {
    console.log('\n🔄 Functions to deploy:');
    detection.changedLambdas.forEach(lambda => {
      console.log(`   • ${lambda}`);
    });
  } else {
    console.log('\n📝 No changes detected. All functions will be deployed.');
  }
  
  console.log('\n' + '═'.repeat(60));
}

/**
 * Interactive confirmation
 */
function confirmDeployment() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('\n❓ Proceed with deployment? (yes/no): ', (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 FOD CI/CD Pipeline Trigger');
  console.log('═'.repeat(60));
  
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
    console.error('Or run: winget install GitHub.cli');
    process.exit(1);
  }
  console.log('✓ GitHub CLI available');
  
  // Get repository info
  const repoInfo = getRepoInfo();
  const branch = getCurrentBranch();
  
  // Detect changes
  console.log('\n🔍 Detecting Lambda changes...');
  const detection = detectChangedLambdas();
  const gitStatus = checkGitStatus();
  
  // Display summary
  displaySummary(detection, gitStatus, repoInfo, branch);
  
  // Check for uncommitted changes
  if (gitStatus.hasUncommitted) {
    console.log('\n⚠️  Cannot deploy with uncommitted changes!');
    console.log('Please commit your changes first:');
    console.log('  git add .');
    console.log('  git commit -m "Your commit message"');
    console.log('  git push');
    process.exit(1);
  }
  
  // Get environment from command line or default to dev
  const args = process.argv.slice(2);
  const environment = args[0] || 'dev';
  
  if (!['dev', 'staging', 'prod'].includes(environment)) {
    console.error(`\n❌ Invalid environment: ${environment}`);
    console.error('Valid options: dev, staging, prod');
    process.exit(1);
  }
  
  console.log(`\n🎯 Target environment: ${environment}`);
  
  // Confirm deployment
  const confirmed = await confirmDeployment();
  
  if (!confirmed) {
    console.log('\n❌ Deployment cancelled by user');
    process.exit(0);
  }
  
  // Trigger workflow
  const success = triggerWorkflow(environment);
  
  if (success) {
    console.log('\n🎉 Pipeline triggered successfully!');
    console.log('\nMonitor the deployment:');
    console.log('  1. GitHub Actions: https://github.com/' + (repoInfo ? `${repoInfo.owner}/${repoInfo.repo}/actions` : 'your-repo/actions'));
    console.log('  2. AWS Console: https://console.aws.amazon.com/lambda');
    console.log('  3. CLI: gh run watch');
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
