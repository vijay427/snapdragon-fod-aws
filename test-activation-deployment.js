#!/usr/bin/env node

/**
 * Quick test to verify activation handler deployment
 */

const { execSync } = require('child_process');

async function testActivationHandlerDeployment() {
  console.log('🧪 Testing Activation Handler Deployment');
  console.log('═'.repeat(50));
  
  try {
    // Create a test event for the activation handler
    const testEvent = {
      Records: [
        {
          body: JSON.stringify({
            subscriptionId: 'test-sub-123',
            vehicleId: 'TEST-VIN-001',
            featureId: 'SPORT_MODE'
          })
        }
      ]
    };
    
    console.log('📝 Test payload:', JSON.stringify(testEvent, null, 2));
    
    // Invoke the Lambda function
    console.log('\n🚀 Invoking FOD-Compute-dev-ActivationHandler...');
    
    const result = execSync(
      `aws lambda invoke --function-name FOD-Compute-dev-ActivationHandler --payload '${JSON.stringify(testEvent)}' --region us-east-1 response.json && cat response.json`,
      { encoding: 'utf-8' }
    );
    
    console.log('\n✅ Lambda Response:');
    console.log(result);
    
    // Check CloudWatch logs for our version message
    console.log('\n📝 Checking recent logs for version info...');
    
    const logs = execSync(
      `aws logs tail /aws/lambda/FOD-Compute-dev-ActivationHandler --region us-east-1 --since 2m --format short`,
      { encoding: 'utf-8' }
    );
    
    console.log('\n📋 Recent Logs:');
    console.log(logs);
    
    // Look for our version message
    if (logs.includes('Activation Handler v1.0.1')) {
      console.log('\n🎉 SUCCESS: New version deployed successfully!');
      console.log('✅ Found version message: "Activation Handler v1.0.1"');
    } else {
      console.log('\n⚠️ Version message not found in logs yet');
      console.log('💡 The deployment may still be in progress');
    }
    
    // Clean up
    execSync('rm -f response.json', { stdio: 'ignore' });
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Clean up on error
    execSync('rm -f response.json', { stdio: 'ignore' });
  }
}

testActivationHandlerDeployment();