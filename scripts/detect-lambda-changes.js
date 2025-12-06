#!/usr/bin/env node

/**
 * Lambda Change Detection Script
 * Detects which Lambda functions have changed and need deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LAMBDA_DIR = path.join(__dirname, '..', 'src', 'lambda');

/**
 * Get all Lambda function directories
 */
function getAllLambdaFunctions() {
  try {
    const entries = fs.readdirSync(LAMBDA_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
  } catch (error) {
    console.error('Error reading Lambda directory:', error.message);
    return [];
  }
}

/**
 * Get changed files from git
 */
function getChangedFiles() {
  try {
    // Get uncommitted changes
    const uncommitted = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    
    // Get staged changes
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    
    // Get last commit changes (for recently committed)
    const lastCommit = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
    
    const allChanges = [...new Set([
      ...uncommitted.split('\n'),
      ...staged.split('\n'),
      ...lastCommit.split('\n')
    ])].filter(Boolean);
    
    return allChanges;
  } catch (error) {
    console.error('Error getting git changes:', error.message);
    return [];
  }
}

/**
 * Detect which Lambda functions have changed
 */
function detectChangedLambdas() {
  const allLambdas = getAllLambdaFunctions();
  const changedFiles = getChangedFiles();
  
  const changedLambdas = new Set();
  
  changedFiles.forEach(file => {
    // Check if file is in src/lambda directory
    if (file.startsWith('src/lambda/')) {
      const parts = file.split('/');
      if (parts.length >= 3) {
        const lambdaName = parts[2];
        if (allLambdas.includes(lambdaName)) {
          changedLambdas.add(lambdaName);
        }
      }
    }
  });
  
  return {
    allLambdas,
    changedLambdas: Array.from(changedLambdas),
    changedFiles: changedFiles.filter(f => f.startsWith('src/lambda/'))
  };
}

/**
 * Check git status
 */
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    const hasUncommitted = status.trim().length > 0;
    
    return {
      hasUncommitted,
      status: status.trim()
    };
  } catch (error) {
    return {
      hasUncommitted: false,
      status: '',
      error: error.message
    };
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Detecting Lambda function changes...\n');
  
  const gitStatus = checkGitStatus();
  const detection = detectChangedLambdas();
  
  // Output results as JSON for programmatic use
  const result = {
    timestamp: new Date().toISOString(),
    gitStatus,
    detection,
    summary: {
      totalLambdas: detection.allLambdas.length,
      changedLambdas: detection.changedLambdas.length,
      hasChanges: detection.changedLambdas.length > 0
    }
  };
  
  // Pretty print for human readability
  console.log('📊 Detection Summary:');
  console.log('─'.repeat(50));
  console.log(`Total Lambda Functions: ${result.summary.totalLambdas}`);
  console.log(`Changed Lambda Functions: ${result.summary.changedLambdas}`);
  console.log('');
  
  if (detection.allLambdas.length > 0) {
    console.log('📦 All Lambda Functions:');
    detection.allLambdas.forEach(lambda => {
      const changed = detection.changedLambdas.includes(lambda);
      console.log(`  ${changed ? '✓' : '○'} ${lambda}`);
    });
    console.log('');
  }
  
  if (detection.changedLambdas.length > 0) {
    console.log('🔄 Changed Lambda Functions:');
    detection.changedLambdas.forEach(lambda => {
      console.log(`  • ${lambda}`);
    });
    console.log('');
    
    console.log('📝 Changed Files:');
    detection.changedFiles.forEach(file => {
      console.log(`  • ${file}`);
    });
    console.log('');
  } else {
    console.log('✅ No Lambda function changes detected\n');
  }
  
  if (gitStatus.hasUncommitted) {
    console.log('⚠️  Warning: You have uncommitted changes');
    console.log('Git Status:');
    console.log(gitStatus.status);
    console.log('');
  }
  
  // Write JSON output for scripts
  const outputPath = path.join(__dirname, '..', '.lambda-changes.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`📄 Detailed results written to: ${outputPath}\n`);
  
  return result;
}

// Run if called directly
if (require.main === module) {
  const result = main();
  process.exit(result.summary.hasChanges ? 0 : 1);
}

module.exports = { detectChangedLambdas, getAllLambdaFunctions, checkGitStatus };
