#!/usr/bin/env node

/**
 * Lambda Build Script
 * Compiles TypeScript to JavaScript for specific Lambda functions
 * Outputs only the essential index.js file for deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Build specific Lambda function
 */
function buildLambda(lambdaName) {
  const srcPath = path.join('src', 'lambda', lambdaName);
  const tsFile = path.join(srcPath, 'index.ts');
  const jsFile = path.join(srcPath, 'index.js');
  
  console.log(`🔨 Building Lambda: ${lambdaName}`);
  
  // Check if source exists
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Lambda source not found: ${srcPath}`);
  }
  
  // If it's already JavaScript, no build needed
  if (fs.existsSync(jsFile) && !fs.existsSync(tsFile)) {
    console.log(`✓ JavaScript file already exists: ${jsFile}`);
    return jsFile;
  }
  
  // If TypeScript file exists, compile it
  if (fs.existsSync(tsFile)) {
    console.log(`📝 Compiling TypeScript: ${tsFile}`);
    
    try {
      // Compile TypeScript to JavaScript in the same directory
      execSync(`npx tsc ${tsFile} --outDir ${srcPath} --target ES2020 --module commonjs --esModuleInterop --skipLibCheck`, {
        stdio: 'inherit'
      });
      
      console.log(`✅ Compiled successfully: ${jsFile}`);
      return jsFile;
    } catch (error) {
      throw new Error(`TypeScript compilation failed: ${error.message}`);
    }
  }
  
  throw new Error(`No source file found: ${tsFile} or ${jsFile}`);
}

/**
 * Clean build artifacts (keep only index.js)
 */
function cleanBuildArtifacts(lambdaName) {
  const srcPath = path.join('src', 'lambda', lambdaName);
  const distPath = path.join('dist', 'lambda', lambdaName);
  
  console.log(`🧹 Cleaning build artifacts for ${lambdaName}...`);
  
  // Clean dist directory artifacts
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    files.forEach(file => {
      if (file.endsWith('.d.ts') || file.endsWith('.js.map') || file.endsWith('.d.ts.map')) {
        const filePath = path.join(distPath, file);
        fs.unlinkSync(filePath);
        console.log(`   Removed: ${filePath}`);
      }
    });
  }
  
  // Clean source directory artifacts (if any)
  if (fs.existsSync(srcPath)) {
    const files = fs.readdirSync(srcPath);
    files.forEach(file => {
      if (file.endsWith('.d.ts') || file.endsWith('.js.map')) {
        const filePath = path.join(srcPath, file);
        fs.unlinkSync(filePath);
        console.log(`   Removed: ${filePath}`);
      }
    });
  }
  
  console.log('✅ Build artifacts cleaned');
}

/**
 * Validate JavaScript file
 */
function validateJavaScript(jsFile) {
  console.log(`🔍 Validating JavaScript: ${jsFile}`);
  
  try {
    const content = fs.readFileSync(jsFile, 'utf-8');
    
    // Basic validation
    if (content.length === 0) {
      throw new Error('JavaScript file is empty');
    }
    
    if (!content.includes('exports.handler') && !content.includes('module.exports')) {
      console.warn('⚠️  Warning: No exports.handler found in JavaScript file');
    }
    
    // Check for common issues
    if (content.includes('import ') && !content.includes('require(')) {
      console.warn('⚠️  Warning: ES6 imports detected, ensure they are compiled to CommonJS');
    }
    
    console.log('✅ JavaScript validation passed');
    return true;
  } catch (error) {
    throw new Error(`JavaScript validation failed: ${error.message}`);
  }
}

/**
 * Get file size in KB
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return Math.round(stats.size / 1024);
}

/**
 * Main execution
 */
async function main() {
  console.log('🔨 Lambda Build Tool');
  console.log('═'.repeat(40));
  
  const args = process.argv.slice(2);
  const lambdaName = args[0] || 'test-activation-handler';
  
  console.log(`\n🎯 Target Lambda: ${lambdaName}`);
  
  try {
    // Build the Lambda
    const jsFile = buildLambda(lambdaName);
    
    // Validate the output
    validateJavaScript(jsFile);
    
    // Clean unnecessary artifacts
    cleanBuildArtifacts(lambdaName);
    
    // Show results
    const fileSize = getFileSize(jsFile);
    console.log(`\n📊 Build Results:`);
    console.log(`   Output: ${jsFile}`);
    console.log(`   Size: ${fileSize}KB`);
    console.log(`   Status: Ready for deployment`);
    
    console.log('\n✅ Build completed successfully!');
    console.log('\nNext steps:');
    console.log(`   node scripts/deploy-single-lambda.js ${lambdaName} dev`);
    
  } catch (error) {
    console.error(`\n❌ Build failed: ${error.message}`);
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

module.exports = { buildLambda, cleanBuildArtifacts, validateJavaScript };