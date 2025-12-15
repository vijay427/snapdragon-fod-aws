#!/usr/bin/env node

/**
 * Auto-Deploy Script for Activation Handler Only
 * Monitors and deploys only the activation handler Lambda function
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Configuration - Focus only on activation handler
const CONFIG = {
  targetLambda: 'activation-handler',
  watchPaths: [
    'src/lambda/activation-handler',
    'src/shared'
  ],
  commitMessageTemplate: 'feat(activation-handler): {changes}',
  branch: 'recovered', // Current branch
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
 * Check if changes affect activation handler
 */
function hasActivationHandlerChanges(changedFiles) {
  return changedFiles.some(file => 
    file.startsWith('src/lambda/activation-handler/') ||
    file.startsWith('src/shared/') ||
    file === 'package.json' ||
    file === 'tsconfig.json'
  );
}

/**
 * Generate commit message based on changes
 */
function generateCommitMessage(changedFiles) {
  const changes = [];
  
  const hasActivationChanges = changedFiles.some(file => 
    file.startsWith('src/lambda/activation-handler/')
  );
  
  const hasSharedChanges = changedFiles.some(file => 
    file.startsWith('src/shared/') || 
    file === 'package.json' || 
    file === 'tsconfig.json'
  );
  
  if (hasActivationChanges) {
    changes.push('update activation logic');
  }
  
  if (hasSharedChanges) {
    changes.push('update shared dependencies');
  }
  
  if (changes.length === 0) {
    changes.push('miscellaneous updates');
  }
  
  return CONFIG.commitMessageTemplate.replace('{changes}', changes.join(', '));
}

/**
 * Run git commands
 */
function runGitCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

/**
 * Build and validate activation handler
 */
function buildAndValidate() {
  console.log('🔨 Building and validating activation handler...');
  
  try {
    // Build TypeScript
    console.log('📦 Building TypeScript...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Run linter on activation handler specifically
    console.log('📝 Linting activation handler...');
    execSync('npx eslint src/lambda/activation-handler/**/*.ts src/shared/**/*.ts', { stdio: 'inherit' });
    
    // Run tests
    console.log('🧪 Running tests...');
    execSync('npm test', { stdio: 'inherit' });
    
    console.log('✅ Build and validation completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Build or validation failed:', error.message);
    return false;
  }
}

/**
 * Main auto-deploy function for activation handler
 */
async function autoDeployActivationHandler(options = {}) {
  console.log('🚀 Activation Handler Auto-Deploy');
  console.log('═'.repeat(50));
  console.log(`🎯 Target: ${CONFIG.targetLambda}`);
  console.log(`🌿 Branch: ${CONFIG.branch}`);
  
  // Check if we're in a git repository
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not a git repository!');
    process.exit(1);
  }
  
  // Check for changes
  if (isGitClean()) {
    console.log('ℹ️ No changes detected. Repository is clean.');
    return;
  }
  
  // Get changed files
  const changedFiles = getChangedFiles();
  console.log(`📝 Changed files (${changedFiles.length}):`);
  changedFiles.forEach(file => console.log(`   • ${file}`));
  
  // Check if changes affect activation handler
  if (!hasActivationHandlerChanges(changedFiles)) {
    console.log('ℹ️ No activation handler changes detected. Skipping deployment.');
    return;
  }
  
  console.log('🎯 Activation handler changes detected!');
  
  // Generate commit message
  const commitMessage = generateCommitMessage(changedFiles);
  console.log(`💬 Commit message: "${commitMessage}"`);
  
  // Confirm deployment
  if (!options.autoConfirm) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const confirmed = await new Promise((resolve) => {
      readline.question('\n❓ Deploy activation handler? (yes/no): ', (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
    
    if (!confirmed) {
      console.log('❌ Deployment cancelled by user');
      return;
    }
  }
  
  console.log('\n🔄 Starting activation handler deployment...');
  
  // Build and validate
  if (!buildAndValidate()) {
    console.error('❌ Build/validation failed. Deployment aborted.');
    process.exit(1);
  }
  
  // Stage all changes
  if (!runGitCommand('git add .', 'Staging changes')) {
    process.exit(1);
  }
  
  // Commit changes
  if (!runGitCommand(`git commit -m "${commitMessage}"`, 'Committing changes')) {
    process.exit(1);
  }
  
  // Push to remote (this will trigger GitHub Actions)
  if (!runGitCommand(`git push ${CONFIG.remote} ${CONFIG.branch}`, 'Pushing to remote')) {
    process.exit(1);
  }
  
  console.log('\n🎉 Activation handler deployment triggered!');
  console.log(`📊 Environment: dev (based on ${CONFIG.branch} branch)`);
  console.log(`📝 Commit: ${commitMessage}`);
  console.log('\n📈 Monitor deployment:');
  console.log('   • GitHub Actions: Check your repository actions tab');
  console.log('   • AWS Console: https://console.aws.amazon.com/lambda');
  console.log(`   • Function: FOD-Compute-dev-ActivationHandler`);
  
  // Wait a moment then check deployment status
  console.log('\n⏳ Waiting 10 seconds before checking deployment status...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Check if deployment was triggered
  console.log('\n🔍 Checking deployment status...');
  try {
    execSync('npm run lambda:health', { stdio: 'inherit' });
  } catch (error) {
    console.log('ℹ️ Could not check deployment status automatically');
  }
}

/**
 * Watch mode for activation handler
 */
function watchActivationHandler() {
  console.log('👀 Watching Activation Handler...');
  console.log('📁 Monitoring:', CONFIG.watchPaths.join(', '));
  console.log('⏰ Checking for changes every 10 seconds');
  console.log('🛑 Press Ctrl+C to stop\n');
  
  const checkForChanges = async () => {
    if (!isGitClean()) {
      const changedFiles = getChangedFiles();
      if (hasActivationHandlerChanges(changedFiles)) {
        console.log(`🔔 Activation handler changes detected at ${new Date().toLocaleTimeString()}`);
        await autoDeployActivationHandler({ autoConfirm: true });
      }
    }
  };
  
  // Check every 10 seconds
  const interval = setInterval(checkForChanges, 10000);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping activation handler watcher...');
    clearInterval(interval);
    process.exit(0);
  });
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--watch')) {
    watchActivationHandler();
  } else if (args.includes('--help')) {
    console.log(`
🎯 Activation Handler Auto-Deploy Script

Usage:
  node scripts/auto-deploy-activation.js [options]

Options:
  --watch     Start watch mode (continuous monitoring)
  --help      Show this help message

Examples:
  node scripts/auto-deploy-activation.js           # One-time deploy
  node scripts/auto-deploy-activation.js --watch   # Continuous monitoring

Focus:
  • Only monitors src/lambda/activation-handler/
  • Only monitors src/shared/ (affects activation handler)
  • Triggers GitHub Actions on push
  • Deploys to FOD-Compute-dev-ActivationHandler
`);
  } else {
    autoDeployActivationHandler().catch(console.error);
  }
}

module.exports = { autoDeployActivationHandler, watchActivationHandler };