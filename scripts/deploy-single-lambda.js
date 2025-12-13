#!/usr/bin/env node

/**
 * Single Lambda Deployment Script
 * Deploys only the compiled JavaScript file for a specific Lambda function
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Clean and prepare Lambda deployment package
 */
function prepareLambdaPackage(lambdaName) {
  const srcPath = path.join('src', 'lambda', lambdaName);
  const distPath = path.join('dist', 'lambda', lambdaName);
  const deployPath = path.join('deploy', lambdaName);
  
  console.log(`📦 Preparing deployment package for ${lambdaName}...`);
  
  // Check if source exists
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Lambda source not found: ${srcPath}`);
  }
  
  // Create deploy directory
  if (fs.existsSync(deployPath)) {
    fs.rmSync(deployPath, { recursive: true, force: true });
  }
  fs.mkdirSync(deployPath, { recursive: true });
  
  // Copy only the JavaScript file
  const jsFile = path.join(srcPath, 'index.js');
  const distJsFile = path.join(distPath, 'index.js');
  
  let sourceFile;
  if (fs.existsSync(jsFile)) {
    // Use source JavaScript file
    sourceFile = jsFile;
    console.log(`✓ Using source file: ${jsFile}`);
  } else if (fs.existsSync(distJsFile)) {
    // Use compiled JavaScript file
    sourceFile = distJsFile;
    console.log(`✓ Using compiled file: ${distJsFile}`);
  } else {
    throw new Error(`No JavaScript file found for ${lambdaName}`);
  }
  
  // Copy the JavaScript file
  const targetFile = path.join(deployPath, 'index.js');
  fs.copyFileSync(sourceFile, targetFile);
  
  // Copy package.json if it exists (for dependencies)
  const packageJsonPath = path.join(srcPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    fs.copyFileSync(packageJsonPath, path.join(deployPath, 'package.json'));
    console.log('✓ Copied package.json');
  }
  
  console.log(`✅ Deployment package ready: ${deployPath}`);
  return deployPath;
}

/**
 * Get Lambda function info
 */
function getLambdaInfo(lambdaName) {
  const srcPath = path.join('src', 'lambda', lambdaName);
  const jsFile = path.join(srcPath, 'index.js');
  const tsFile = path.join(srcPath, 'index.ts');
  
  return {
    name: lambdaName,
    srcPath,
    hasJs: fs.existsSync(jsFile),
    hasTs: fs.existsSync(tsFile),
    language: fs.existsSync(tsFile) ? 'TypeScript' : 'JavaScript'
  };
}

/**
 * Check if Lambda has uncommitted changes
 */
function checkLambdaChanges(lambdaName) {
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
    const lambdaPath = path.join('src', 'lambda', lambdaName);
    
    const changedFiles = gitStatus
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3))
      .filter(file => file.startsWith(lambdaPath));
    
    return {
      hasChanges: changedFiles.length > 0,
      files: changedFiles
    };
  } catch (error) {
    return { hasChanges: false, files: [] };
  }
}

/**
 * Commit and push Lambda changes
 */
function commitLambdaChanges(lambdaName) {
  const lambdaPath = path.join('src', 'lambda', lambdaName);
  
  console.log(`\n📝 Committing changes for ${lambdaName}...`);
  
  try {
    // Add only the Lambda files
    execSync(`git add "${lambdaPath}/*"`, { stdio: 'inherit' });
    
    // Commit with descriptive message
    const commitMessage = `Update ${lambdaName} Lambda function for deployment`;
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    // Push to remote
    execSync('git push', { stdio: 'inherit' });
    
    console.log('✅ Changes committed and pushed');
    return true;
  } catch (error) {
    console.error('❌ Failed to commit changes:', error.message);
    return false;
  }
}

/**
 * Trigger GitHub Actions workflow
 */
function triggerDeployment(lambdaName, environment) {
  console.log(`\n🚀 Triggering deployment for ${lambdaName} to ${environment}...`);
  
  try {
    execSync(
      `gh workflow run lambda-cicd.yml -f environment=${environment} -f lambda_function=${lambdaName}`,
      { stdio: 'inherit' }
    );
    
    console.log('✅ GitHub Actions workflow triggered');
    return true;
  } catch (error) {
    console.error('❌ Failed to trigger workflow:', error.message);
    return false;
  }
}

/**
 * Monitor deployment
 */
function monitorDeployment() {
  console.log('\n📊 Monitoring deployment...');
  console.log('Run one of these commands to monitor:');
  console.log('  gh run list --workflow=lambda-cicd.yml');
  console.log('  gh run watch');
  console.log('  gh run view --web');
}

/**
 * Interactive confirmation
 */
function confirm(message) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question(`${message} (y/n): `, (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Single Lambda Deployment Tool');
  console.log('═'.repeat(50));
  
  // Get arguments
  const args = process.argv.slice(2);
  const lambdaName = args[0] || 'test-activation-handler';
  const environment = args[1] || 'dev';
  
  console.log(`\n🎯 Target: ${lambdaName}`);
  console.log(`🌍 Environment: ${environment}`);
  
  // Validate environment
  if (!['dev', 'staging', 'prod'].includes(environment)) {
    console.error(`❌ Invalid environment: ${environment}`);
    console.error('Valid options: dev, staging, prod');
    process.exit(1);
  }
  
  // Get Lambda info
  const lambdaInfo = getLambdaInfo(lambdaName);
  if (!lambdaInfo.hasJs && !lambdaInfo.hasTs) {
    console.error(`❌ Lambda function not found: ${lambdaName}`);
    console.error(`Expected path: src/lambda/${lambdaName}/index.js or index.ts`);
    process.exit(1);
  }
  
  console.log(`\n📋 Lambda Info:`);
  console.log(`   Name: ${lambdaInfo.name}`);
  console.log(`   Language: ${lambdaInfo.language}`);
  console.log(`   Path: ${lambdaInfo.srcPath}`);
  
  // Check for changes
  const changes = checkLambdaChanges(lambdaName);
  if (changes.hasChanges) {
    console.log(`\n🔄 Uncommitted changes detected:`);
    changes.files.forEach(file => console.log(`   • ${file}`));
    
    const shouldCommit = await confirm('\n📝 Commit these changes before deployment?');
    if (shouldCommit) {
      const committed = commitLambdaChanges(lambdaName);
      if (!committed) {
        console.log('❌ Deployment cancelled due to commit failure');
        process.exit(1);
      }
    } else {
      console.log('⚠️  Deploying last committed version...');
    }
  } else {
    console.log('\n✅ No uncommitted changes');
  }
  
  // Prepare deployment package
  try {
    const deployPath = prepareLambdaPackage(lambdaName);
    console.log(`\n📦 Deployment package contents:`);
    const files = fs.readdirSync(deployPath);
    files.forEach(file => {
      const filePath = path.join(deployPath, file);
      const stats = fs.statSync(filePath);
      console.log(`   • ${file} (${Math.round(stats.size / 1024)}KB)`);
    });
  } catch (error) {
    console.error(`❌ Failed to prepare package: ${error.message}`);
    process.exit(1);
  }
  
  // Final confirmation
  const shouldDeploy = await confirm(`\n🚀 Deploy ${lambdaName} to ${environment}?`);
  if (!shouldDeploy) {
    console.log('❌ Deployment cancelled');
    process.exit(0);
  }
  
  // Trigger deployment
  const success = triggerDeployment(lambdaName, environment);
  if (success) {
    console.log('\n🎉 Deployment initiated successfully!');
    console.log('\n📊 What happens next:');
    console.log('   1. GitHub Actions builds the Lambda');
    console.log('   2. Packages only the JavaScript file');
    console.log('   3. Deploys to AWS Lambda');
    console.log('   4. Updates function configuration');
    console.log('   5. Runs verification tests');
    console.log('\n⏱️  Expected time: ~3-5 minutes');
    
    monitorDeployment();
  } else {
    console.log('❌ Deployment failed to start');
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

module.exports = { prepareLambdaPackage, getLambdaInfo };