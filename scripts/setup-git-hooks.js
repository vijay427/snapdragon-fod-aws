#!/usr/bin/env node

/**
 * Git Hooks Setup Script
 * Sets up Git hooks for automatic deployment triggers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOOKS_DIR = '.git/hooks';
const HOOKS_TO_CREATE = {
  'pre-push': {
    description: 'Validates code before push and optionally triggers deployment',
    script: `#!/bin/bash

# Pre-push hook for FOD system
# Validates code and optionally triggers auto-deployment

echo "🔍 FOD Pre-push validation..."

# Run linting
echo "📝 Running linter..."
if ! npm run lint; then
  echo "❌ Linting failed. Push aborted."
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
if ! npm test; then
  echo "❌ Tests failed. Push aborted."
  exit 1
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
if ! npm run build; then
  echo "❌ Build failed. Push aborted."
  exit 1
fi

echo "✅ Pre-push validation completed successfully!"

# Optional: Ask if user wants to trigger deployment after push
read -p "🚀 Trigger deployment after push? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📝 Deployment will be triggered automatically by GitHub Actions"
fi

exit 0`
  },
  
  'post-commit': {
    description: 'Runs after each commit to provide deployment guidance',
    script: `#!/bin/bash

# Post-commit hook for FOD system
# Provides guidance after commits

echo ""
echo "✅ Commit successful!"

# Check if there are Lambda changes
LAMBDA_CHANGES=$(git diff --name-only HEAD~1 HEAD | grep -E "^src/(lambda|shared)/" | wc -l)

if [ "$LAMBDA_CHANGES" -gt 0 ]; then
  echo "🔄 Lambda function changes detected!"
  echo ""
  echo "📋 Next steps:"
  echo "   1. Push changes: git push"
  echo "   2. Monitor deployment: GitHub Actions will trigger automatically"
  echo "   3. Or use auto-deploy: node scripts/auto-deploy.js"
  echo ""
  echo "🚀 Quick deploy: node scripts/auto-deploy.js"
fi

exit 0`
  }
};

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
 * Create a git hook
 */
function createHook(hookName, hookConfig) {
  const hookPath = path.join(HOOKS_DIR, hookName);
  
  try {
    // Write hook script
    fs.writeFileSync(hookPath, hookConfig.script);
    
    // Make executable
    fs.chmodSync(hookPath, '755');
    
    console.log(`✅ Created ${hookName} hook`);
    console.log(`   📝 ${hookConfig.description}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to create ${hookName} hook:`, error.message);
    return false;
  }
}

/**
 * Setup all git hooks
 */
function setupGitHooks() {
  console.log('🔧 Setting up Git hooks for FOD system');
  console.log('═'.repeat(50));
  
  // Check if we're in a git repository
  if (!checkGitRepo()) {
    console.error('❌ Not a git repository!');
    console.error('   Run this script from the project root directory');
    process.exit(1);
  }
  
  // Check if hooks directory exists
  if (!fs.existsSync(HOOKS_DIR)) {
    console.error('❌ Git hooks directory not found!');
    console.error('   This should not happen in a valid git repository');
    process.exit(1);
  }
  
  console.log(`📁 Git hooks directory: ${HOOKS_DIR}`);
  
  // Create each hook
  let successCount = 0;
  for (const [hookName, hookConfig] of Object.entries(HOOKS_TO_CREATE)) {
    if (createHook(hookName, hookConfig)) {
      successCount++;
    }
  }
  
  console.log('');
  console.log(`🎉 Setup completed! Created ${successCount}/${Object.keys(HOOKS_TO_CREATE).length} hooks`);
  
  if (successCount === Object.keys(HOOKS_TO_CREATE).length) {
    console.log('');
    console.log('📋 Git hooks are now active:');
    console.log('   • pre-push: Validates code before pushing');
    console.log('   • post-commit: Provides deployment guidance');
    console.log('');
    console.log('🚀 Usage:');
    console.log('   • Make code changes');
    console.log('   • git add . && git commit -m "your message"');
    console.log('   • git push (hooks will run automatically)');
    console.log('   • Or use: node scripts/auto-deploy.js');
  }
}

/**
 * Remove git hooks
 */
function removeGitHooks() {
  console.log('🗑️ Removing Git hooks...');
  
  let removedCount = 0;
  for (const hookName of Object.keys(HOOKS_TO_CREATE)) {
    const hookPath = path.join(HOOKS_DIR, hookName);
    
    try {
      if (fs.existsSync(hookPath)) {
        fs.unlinkSync(hookPath);
        console.log(`✅ Removed ${hookName} hook`);
        removedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to remove ${hookName} hook:`, error.message);
    }
  }
  
  console.log(`🎉 Removed ${removedCount} hooks`);
}

/**
 * List existing hooks
 */
function listHooks() {
  console.log('📋 Git hooks status:');
  console.log('═'.repeat(30));
  
  for (const hookName of Object.keys(HOOKS_TO_CREATE)) {
    const hookPath = path.join(HOOKS_DIR, hookName);
    const exists = fs.existsSync(hookPath);
    const status = exists ? '✅ Installed' : '❌ Not installed';
    console.log(`   ${hookName}: ${status}`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--remove')) {
    removeGitHooks();
  } else if (args.includes('--list')) {
    listHooks();
  } else if (args.includes('--help')) {
    console.log(`
🔧 Git Hooks Setup Script

Usage:
  node scripts/setup-git-hooks.js [options]

Options:
  --remove    Remove all FOD git hooks
  --list      List current hook status
  --help      Show this help message

Examples:
  node scripts/setup-git-hooks.js          # Install hooks
  node scripts/setup-git-hooks.js --list   # Check status
  node scripts/setup-git-hooks.js --remove # Remove hooks
`);
  } else {
    setupGitHooks();
  }
}

module.exports = { setupGitHooks, removeGitHooks, listHooks };