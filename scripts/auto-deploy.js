#!/usr/bin/env node

/**
 * Auto-Deploy Script
 * Automatically detects code changes, commits, pushes to GitHub, and triggers CI/CD
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  watchPaths: [
    'src/lambda',
    'src/shared',
    'infrastructure/lib',
    'package.json',
    'tsconfig.json'
  ],
  excludePatterns: [
    'node_modules',
    'dist',
    'cdk.out',
    '.git',
    '*.log',
    '*.tmp'
  ],
  commitMessageTemplate: 'Auto-deploy: {changes}',
  branch: 'main',
  remote: 'origin'
};

/**
 * Check if git repository is clean
 */
function isGitClean() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim() === '';
  } catch (error) {
    console.error('❌ Error checking git status:', error.message);
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
    console.error('❌ Error getting current branch:', error.message);
    return null;
  }
}

/**
 * Get changed files
 */
function getChangedFiles() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    const files = status
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3)); // Remove git status prefix
    
    return files;
  } catch (error) {
    console.error('❌ Error getting changed files:', error.message);
    return [];
  }
}

/**
 * Detect Lambda function changes
 */
function detectLambdaChanges(changedFiles) {
  const lambdaChanges = new Set();
  
  changedFiles.forEach(file => {
    // Check for Lambda function changes
    const lambdaMatch = file.match(/^src\/lambda\/([^\/]+)\//);
    if (lambdaMatch) {
      lambdaChanges.add(lambdaMatch[1]);
    }
    
    // Check for shared code changes (affects all Lambdas)
    if (file.startsWith('src/shared/') || 
        file === 'package.json' || 
        file === 'tsconfig.json' ||
        file.startsWith('infrastructure/')) {
      lambdaChanges.add('shared-dependencies');
    }
  });
  
  return Array.from(lambdaChanges);
}

/**
 * Generate commit message based on changes
 */
function generateCommitMessage(changedFiles, lambdaChanges) {
  const changes = [];
  
  if (lambdaChanges.includes('shared-dependencies')) {
    changes.push('shared code/infrastructure');
  }
  
  const specificLambdas = lambdaChanges.filter(change => change !== 'shared-dependencies');
  if (specificLambdas.length > 0) {
    changes.push(`Lambda functions: ${specificLambdas.join(', ')}`);
  }
  
  if (changes.length === 0) {
    changes.push('miscellaneous files');
  }
  
  return CONFIG.commitMessageTemplate.replace('{changes}', changes.join(', '));
}

/**
 * Run git commands
 */
function runGitCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const result = execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

/**
 * Trigger GitHub Actions workflow
 */
function triggerWorkflow(environment = 'dev') {
  try {
    console.log(`🚀 Triggering GitHub Actions workflow for environment: ${environment}`);
    
    // Check if GitHub CLI is available
    execSync('gh --version', { stdio: 'ignore' });
    
    const result = execSync(
      `gh workflow run lambda-cicd.yml -f environment=${environment}`,
      { encoding: 'utf-8' }
    );
    
    console.log('✅ Workflow triggered successfully!');
    console.log('📊 Monitor progress: gh run list --workflow=lambda-cicd.yml');
    return true;
  } catch (error) {
    console.log('⚠️ GitHub CLI not available or workflow trigger failed');
    console.log('💡 Workflow will be triggered automatically by the push');
    return false;
  }
}

/**
 * Main auto-deploy function
 */
async function autoDeploy(options = {}) {
  console.log('🚀 FOD Auto-Deploy Script');
  console.log('═'.repeat(50));
  
  // Check if we're in a git repository
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not a git repository!');
    process.exit(1);
  }
  
  // Get current branch
  const currentBranch = getCurrentBranch();
  if (!currentBranch) {
    console.error('❌ Could not determine current branch');
    process.exit(1);
  }
  
  console.log(`📍 Current branch: ${currentBranch}`);
  
  // Check for changes
  if (isGitClean()) {
    console.log('ℹ️ No changes detected. Repository is clean.');
    return;
  }
  
  // Get changed files
  const changedFiles = getChangedFiles();
  console.log(`📝 Changed files (${changedFiles.length}):`);
  changedFiles.forEach(file => console.log(`   • ${file}`));
  
  // Detect Lambda changes
  const lambdaChanges = detectLambdaChanges(changedFiles);
  if (lambdaChanges.length > 0) {
    console.log(`🔄 Lambda changes detected:`);
    lambdaChanges.forEach(change => console.log(`   • ${change}`));
  }
  
  // Generate commit message
  const commitMessage = generateCommitMessage(changedFiles, lambdaChanges);
  console.log(`💬 Commit message: "${commitMessage}"`);
  
  // Confirm deployment
  if (!options.autoConfirm) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirmed = await new Promise((resolve) => {
      readline.question('\n❓ Proceed with auto-deploy? (yes/no): ', (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
    
    if (!confirmed) {
      console.log('❌ Auto-deploy cancelled by user');
      return;
    }
  }
  
  console.log('\n🔄 Starting auto-deploy process...');
  
  // Stage all changes
  if (!runGitCommand('git add .', 'Staging changes')) {
    process.exit(1);
  }
  
  // Commit changes
  if (!runGitCommand(`git commit -m "${commitMessage}"`, 'Committing changes')) {
    process.exit(1);
  }
  
  // Push to remote
  if (!runGitCommand(`git push ${CONFIG.remote} ${currentBranch}`, 'Pushing to remote')) {
    process.exit(1);
  }
  
  // Determine environment based on branch
  let environment = 'dev';
  if (currentBranch === 'main') {
    environment = 'prod';
  } else if (currentBranch === 'develop') {
    environment = 'staging';
  }
  
  // Trigger workflow (optional, as push will trigger it automatically)
  triggerWorkflow(environment);
  
  console.log('\n🎉 Auto-deploy completed successfully!');
  console.log(`📊 Environment: ${environment}`);
  console.log(`🌿 Branch: ${currentBranch}`);
  console.log(`📝 Commit: ${commitMessage}`);
  console.log('\n📈 Monitor deployment:');
  console.log('   • GitHub Actions: https://github.com/your-repo/actions');
  console.log('   • AWS Console: https://console.aws.amazon.com/lambda');
}

/**
 * Watch mode - continuously monitor for changes
 */
function watchMode() {
  console.log('👀 Starting watch mode...');
  console.log('📁 Watching paths:', CONFIG.watchPaths.join(', '));
  console.log('⏰ Checking for changes every 30 seconds');
  console.log('🛑 Press Ctrl+C to stop\n');
  
  let lastCheck = Date.now();
  
  const checkForChanges = () => {
    if (!isGitClean()) {
      console.log(`🔔 Changes detected at ${new Date().toLocaleTimeString()}`);
      autoDeploy({ autoConfirm: true }).catch(console.error);
    }
  };
  
  // Check every 30 seconds
  const interval = setInterval(checkForChanges, 30000);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping watch mode...');
    clearInterval(interval);
    process.exit(0);
  });
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--watch')) {
    watchMode();
  } else if (args.includes('--help')) {
    console.log(`
🚀 FOD Auto-Deploy Script

Usage:
  node scripts/auto-deploy.js [options]

Options:
  --watch     Start watch mode (continuous monitoring)
  --help      Show this help message

Examples:
  node scripts/auto-deploy.js           # One-time deploy
  node scripts/auto-deploy.js --watch   # Continuous monitoring
`);
  } else {
    autoDeploy().catch(console.error);
  }
}

module.exports = { autoDeploy, watchMode };