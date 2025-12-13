#!/usr/bin/env node

/**
 * Snapdragon FOD AWS Deployment Validation Script (Node.js)
 * Validates AWS deployment without requiring AWS CLI
 */

const https = require('https');

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(50));
  log(title, 'blue');
  console.log('='.repeat(50));
}

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const request = https.get(url, (res) => {
      resolve({
        statusCode: res.statusCode,
        success: res.statusCode === 200
      });
    });
    
    request.on('error', (error) => {
      resolve({
        statusCode: 0,
        success: false,
        error: error.message
      });
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        statusCode: 0,
        success: false,
        error: 'Timeout'
      });
    });
  });
}

async function main() {
  header('FOD System Deployment Validation');
  
  console.log('\nThis script will help you validate your AWS deployment.');
  console.log('You can also use the AWS Operations MCP server for validation.\n');
  
  // Check for AWS SDK
  let hasAWSSDK = false;
  try {
    require('@aws-sdk/client-cloudformation');
    hasAWSSDK = true;
    log('✅ AWS SDK found', 'green');
  } catch (e) {
    log('⚠️  AWS SDK not found (install with: npm install @aws-sdk/client-cloudformation)', 'yellow');
  }
  
  header('Manual Validation Steps');
  
  console.log('\n1. Check CloudFormation Stacks:');
  log('   Run this command in Kiro chat:', 'blue');
  console.log('   "List all FOD CloudFormation stacks"');
  console.log('   Expected stacks:');
  const stacks = [
    'FOD-Network-dev',
    'FOD-Database-dev',
    'FOD-Compute-dev',
    'FOD-API-dev',
    'FOD-IoT-dev',
    'FOD-Monitoring-dev'
  ];
  stacks.forEach(stack => console.log(`   - ${stack}`));
  
  console.log('\n2. Get API Gateway URL:');
  log('   Run this command in Kiro chat:', 'blue');
  console.log('   "Get the API Gateway URL from FOD-API-dev stack outputs"');
  
  console.log('\n3. Check Lambda Functions:');
  log('   Run this command in Kiro chat:', 'blue');
  console.log('   "List all Lambda functions with FOD-Compute-dev prefix"');
  console.log('   Expected functions:');
  const lambdas = [
    'CatalogHandler',
    'PurchaseHandler',
    'ActivationHandler',
    'DeactivationHandler',
    'AckHandler',
    'GetVehicleFeaturesHandler',
    'TestActivationHandler'
  ];
  lambdas.forEach(lambda => console.log(`   - FOD-Compute-dev-${lambda}`));
  
  console.log('\n4. Test API Endpoints:');
  log('   Once you have the API URL, test these endpoints:', 'blue');
  console.log('   GET  {API_URL}/features/catalog');
  console.log('   POST {API_URL}/test-activation');
  
  header('Using AWS Operations MCP Server');
  
  console.log('\nYou can use these MCP tools in Kiro chat:');
  console.log('');
  log('1. list_fod_stacks', 'green');
  console.log('   Lists all FOD CloudFormation stacks');
  console.log('   Usage: "List all FOD stacks"');
  console.log('');
  log('2. get_stack_status', 'green');
  console.log('   Get status of a specific stack');
  console.log('   Usage: "Get status of FOD-API-dev stack"');
  console.log('');
  log('3. get_stack_outputs', 'green');
  console.log('   Get outputs from a stack (like API URL)');
  console.log('   Usage: "Get outputs from FOD-API-dev stack"');
  console.log('');
  log('4. list_lambda_functions', 'green');
  console.log('   List all Lambda functions');
  console.log('   Usage: "List all Lambda functions with FOD prefix"');
  console.log('');
  log('5. get_lambda_metrics', 'green');
  console.log('   Get metrics for a Lambda function');
  console.log('   Usage: "Get metrics for FOD-Compute-dev-CatalogHandler"');
  
  header('Quick Test with API URL');
  
  console.log('\nIf you have your API Gateway URL, enter it below to test:');
  console.log('(Press Enter to skip)');
  
  // Simple prompt
  process.stdout.write('\nAPI URL: ');
  
  process.stdin.once('data', async (data) => {
    const apiUrl = data.toString().trim();
    
    if (apiUrl && apiUrl.startsWith('http')) {
      console.log('\nTesting catalog endpoint...');
      const catalogUrl = apiUrl.endsWith('/') ? `${apiUrl}features/catalog` : `${apiUrl}/features/catalog`;
      
      const result = await testEndpoint(catalogUrl);
      
      if (result.success) {
        log(`✅ Catalog endpoint responding (HTTP ${result.statusCode})`, 'green');
      } else {
        log(`❌ Catalog endpoint not responding (${result.error || 'HTTP ' + result.statusCode})`, 'red');
      }
    }
    
    header('Validation Complete');
    
    console.log('\nFor full validation, use the AWS Operations MCP server in Kiro chat.');
    console.log('Example: "Validate my FOD deployment and show me all stack statuses"');
    console.log('');
    
    process.exit(0);
  });
}

main().catch(console.error);
