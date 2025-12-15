#!/usr/bin/env node

/**
 * Lambda Status Checker
 * Comprehensive tool to check Lambda function status in AWS
 */

const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  functionPrefix: 'FOD-',
  environment: process.env.ENVIRONMENT || 'dev'
};

/**
 * Execute AWS CLI command safely
 */
function executeAWSCommand(command, description) {
  try {
    console.log(`🔍 ${description}...`);
    const result = execSync(command, { encoding: 'utf-8' });
    return result.trim();
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return null;
  }
}

/**
 * List all FOD Lambda functions
 */
function listFODFunctions() {
  console.log('📋 FOD Lambda Functions');
  console.log('═'.repeat(60));
  
  const command = `aws lambda list-functions --region ${CONFIG.region} --query "Functions[?starts_with(FunctionName, '${CONFIG.functionPrefix}')].{Name:FunctionName,Runtime:Runtime,LastModified:LastModified,State:State}" --output table`;
  
  const result = executeAWSCommand(command, 'Listing FOD Lambda functions');
  
  if (result) {
    console.log(result);
    return true;
  }
  return false;
}

/**
 * Get detailed function information
 */
function getFunctionDetails(functionName) {
  console.log(`\n📊 Details for: ${functionName}`);
  console.log('─'.repeat(50));
  
  // Get function configuration
  const configCommand = `aws lambda get-function-configuration --function-name "${functionName}" --region ${CONFIG.region} --query "{Runtime:Runtime,Handler:Handler,Timeout:Timeout,MemorySize:MemorySize,LastModified:LastModified,State:State,Version:Version}" --output table`;
  
  const configResult = executeAWSCommand(configCommand, `Getting configuration for ${functionName}`);
  if (configResult) {
    console.log(configResult);
  }
  
  // Get recent invocations (last 5 minutes)
  const metricsCommand = `aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Invocations --dimensions Name=FunctionName,Value="${functionName}" --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Sum --region ${CONFIG.region} --query 'Datapoints[0].Sum' --output text`;
  
  const invocations = executeAWSCommand(metricsCommand, `Getting invocation count for ${functionName}`);
  console.log(`📈 Recent Invocations (5 min): ${invocations || 'None'}`);
  
  // Get recent errors
  const errorsCommand = `aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value="${functionName}" --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Sum --region ${CONFIG.region} --query 'Datapoints[0].Sum' --output text`;
  
  const errors = executeAWSCommand(errorsCommand, `Getting error count for ${functionName}`);
  console.log(`❌ Recent Errors (5 min): ${errors || 'None'}`);
}

/**
 * Test a Lambda function
 */
function testFunction(functionName, testPayload = {}) {
  console.log(`\n🧪 Testing: ${functionName}`);
  console.log('─'.repeat(50));
  
  const payload = JSON.stringify(testPayload);
  const command = `aws lambda invoke --function-name "${functionName}" --payload '${payload}' --region ${CONFIG.region} response.json && cat response.json && rm response.json`;
  
  const result = executeAWSCommand(command, `Testing ${functionName}`);
  if (result) {
    console.log('✅ Function test completed');
  }
}

/**
 * Get Lambda function logs
 */
function getFunctionLogs(functionName, lines = 10) {
  console.log(`\n📝 Recent logs for: ${functionName}`);
  console.log('─'.repeat(50));
  
  const logGroup = `/aws/lambda/${functionName}`;
  const command = `aws logs tail "${logGroup}" --region ${CONFIG.region} --since 5m --format short`;
  
  const result = executeAWSCommand(command, `Getting logs for ${functionName}`);
  if (result) {
    console.log(result);
  } else {
    console.log('ℹ️ No recent logs found or log group does not exist');
  }
}

/**
 * Check API Gateway endpoints
 */
function checkAPIGateway() {
  console.log('\n🌐 API Gateway Information');
  console.log('═'.repeat(60));
  
  // List REST APIs
  const command = `aws apigateway get-rest-apis --region ${CONFIG.region} --query "items[?contains(name, 'FOD')].{Name:name,Id:id,CreatedDate:createdDate}" --output table`;
  
  const result = executeAWSCommand(command, 'Listing FOD API Gateways');
  if (result) {
    console.log(result);
    
    // Get API URL
    const urlCommand = `aws apigateway get-rest-apis --region ${CONFIG.region} --query "items[?contains(name, 'FOD')].id" --output text`;
    const apiId = executeAWSCommand(urlCommand, 'Getting API ID');
    
    if (apiId) {
      const apiUrl = `https://${apiId}.execute-api.${CONFIG.region}.amazonaws.com/v1`;
      console.log(`\n🔗 API Base URL: ${apiUrl}`);
      console.log('\n📋 Available Endpoints:');
      console.log('   • GET  /features/catalog');
      console.log('   • POST /features/purchase');
      console.log('   • POST /features/activate');
      console.log('   • GET  /vehicles/{vehicleId}/features');
      console.log('   • POST /test-activation');
    }
  }
}

/**
 * Comprehensive health check
 */
function healthCheck() {
  console.log('🏥 FOD System Health Check');
  console.log('═'.repeat(60));
  
  // Get all FOD functions
  const functionsCommand = `aws lambda list-functions --region ${CONFIG.region} --query "Functions[?starts_with(FunctionName, '${CONFIG.functionPrefix}')].FunctionName" --output text`;
  
  const functions = executeAWSCommand(functionsCommand, 'Getting FOD function list');
  
  if (functions) {
    const functionList = functions.split('\t').filter(f => f.trim());
    
    console.log(`\n📊 Found ${functionList.length} FOD Lambda functions\n`);
    
    functionList.forEach((functionName, index) => {
      console.log(`${index + 1}. ${functionName}`);
      
      // Check function state
      const stateCommand = `aws lambda get-function-configuration --function-name "${functionName}" --region ${CONFIG.region} --query 'State' --output text`;
      const state = executeAWSCommand(stateCommand, `Checking state of ${functionName}`);
      
      if (state === 'Active') {
        console.log('   ✅ Status: Active');
      } else {
        console.log(`   ⚠️ Status: ${state || 'Unknown'}`);
      }
      
      // Check recent errors
      const errorsCommand = `aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value="${functionName}" --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 3600 --statistics Sum --region ${CONFIG.region} --query 'Datapoints[0].Sum' --output text`;
      
      const errors = executeAWSCommand(errorsCommand, `Checking errors for ${functionName}`);
      const errorCount = errors && errors !== 'None' ? errors : '0';
      
      if (errorCount === '0') {
        console.log('   ✅ Errors: None');
      } else {
        console.log(`   ❌ Errors: ${errorCount} in last hour`);
      }
      
      console.log('');
    });
  }
}

/**
 * Generate AWS Console URLs
 */
function generateConsoleURLs() {
  console.log('\n🔗 AWS Console URLs');
  console.log('═'.repeat(60));
  
  console.log(`📋 Lambda Console:`);
  console.log(`   https://console.aws.amazon.com/lambda/home?region=${CONFIG.region}#/functions`);
  
  console.log(`\n📊 CloudWatch Logs:`);
  console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${CONFIG.region}#logsV2:log-groups`);
  
  console.log(`\n🌐 API Gateway Console:`);
  console.log(`   https://console.aws.amazon.com/apigateway/home?region=${CONFIG.region}#/apis`);
  
  console.log(`\n📈 CloudWatch Metrics:`);
  console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${CONFIG.region}#metricsV2:graph=~();namespace=AWS/Lambda`);
}

/**
 * Main CLI interface
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🚀 FOD Lambda Status Checker');
  console.log(`📍 Region: ${CONFIG.region}`);
  console.log(`🏷️ Environment: ${CONFIG.environment}\n`);
  
  switch (command) {
    case 'list':
      listFODFunctions();
      break;
      
    case 'details':
      const functionName = args[1];
      if (!functionName) {
        console.error('❌ Please provide function name: npm run lambda:details <function-name>');
        process.exit(1);
      }
      getFunctionDetails(functionName);
      break;
      
    case 'test':
      const testFunctionName = args[1];
      if (!testFunctionName) {
        console.error('❌ Please provide function name: npm run lambda:test <function-name>');
        process.exit(1);
      }
      testFunction(testFunctionName);
      break;
      
    case 'logs':
      const logFunctionName = args[1];
      if (!logFunctionName) {
        console.error('❌ Please provide function name: npm run lambda:logs <function-name>');
        process.exit(1);
      }
      getFunctionLogs(logFunctionName);
      break;
      
    case 'api':
      checkAPIGateway();
      break;
      
    case 'health':
      healthCheck();
      break;
      
    case 'urls':
      generateConsoleURLs();
      break;
      
    case 'all':
      listFODFunctions();
      checkAPIGateway();
      healthCheck();
      generateConsoleURLs();
      break;
      
    default:
      console.log(`
📋 Available Commands:

Basic Commands:
  list              List all FOD Lambda functions
  health            Comprehensive health check
  api               Check API Gateway information
  urls              Generate AWS Console URLs
  all               Run all checks

Detailed Commands:
  details <name>    Get detailed function information
  test <name>       Test a specific function
  logs <name>       Get recent logs for a function

Examples:
  node scripts/check-lambda-status.js list
  node scripts/check-lambda-status.js health
  node scripts/check-lambda-status.js details FOD-Compute-dev-CatalogHandler
  node scripts/check-lambda-status.js logs FOD-Compute-dev-PurchaseHandler
  node scripts/check-lambda-status.js all
`);
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  listFODFunctions,
  getFunctionDetails,
  testFunction,
  getFunctionLogs,
  checkAPIGateway,
  healthCheck,
  generateConsoleURLs
};