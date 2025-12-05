# Quick Test Guide - Execute Your Use Case

This guide walks you through testing the complete FOD system with a real scenario.

## Test Scenario: Purchase Weekend Sport Mode

We'll simulate a complete purchase-to-activation flow for a vehicle.

### Prerequisites

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
$env:MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/fod-system"
$env:AWS_REGION="us-east-1"

# 3. Initialize database
npm run db:setup
```

### Step 1: Verify Feature Catalog

```bash
# Check available features
npx ts-node -e "
import { FeatureRepository } from './src/shared/repositories/FeatureRepository';

async function test() {
  const repo = new FeatureRepository();
  const features = await repo.findAllActive();
  console.log('Available Features:');
  features.forEach(f => {
    console.log(\`- \${f.name}: $\${f.price} (\${f.duration}h)\`);
  });
}

test().catch(console.error);
"
```

**Expected Output:**
```
Available Features:
- 5G Connectivity Upgrade: $99.99 (0h)
- Sport Mode - Weekend Pass: $29.99 (48h)
- Sport Mode - Monthly: $99.99 (720h)
- Eco Mode: $0 (0h)
- Premium Audio System: $199.99 (0h)
```

### Step 2: Simulate Purchase Request

Create a test file: `test-purchase.ts`

```typescript
import { handler } from './src/lambda/purchase-handler';
import { APIGatewayProxyEvent } from 'aws-lambda';

async function testPurchase() {
  const event: Partial<APIGatewayProxyEvent> = {
    body: JSON.stringify({
      vehicleId: 'TEST_VIN_12345',
      featureId: 'SPORT_MODE_WEEKEND',
      paymentMethod: 'credit_card',
      paymentToken: 'tok_test_visa'
    }),
    headers: {},
    httpMethod: 'POST',
    path: '/purchase',
  };

  console.log('🚗 Simulating purchase request...\n');
  
  const result = await handler(event as any);
  
  console.log('📋 Response Status:', result.statusCode);
  console.log('📦 Response Body:');
  console.log(JSON.parse(result.body));
  
  return JSON.parse(result.body);
}

testPurchase().catch(console.error);
```

Run it:
```bash
npx ts-node test-purchase.ts
```

**Expected Output:**
```
🚗 Simulating purchase request...

Processing purchase: {
  vehicleId: 'TEST_VIN_12345',
  featureId: 'SPORT_MODE_WEEKEND',
  paymentMethod: 'credit_card'
}
Transaction created: txn_abc123
Payment processed successfully
Subscription created: sub_xyz789

📋 Response Status: 200
📦 Response Body:
{
  success: true,
  data: {
    transactionId: 'txn_abc123',
    subscriptionId: 'sub_xyz789',
    vehicleId: 'TEST_VIN_12345',
    featureId: 'SPORT_MODE_WEEKEND',
    amount: 29.99,
    status: 'PENDING',
    expiresAt: '2024-12-06T10:00:00Z',
    isPermanent: false
  }
}
```

### Step 3: Verify Database State

```typescript
// test-db-state.ts
import { SubscriptionRepository } from './src/shared/repositories/SubscriptionRepository';
import { TransactionRepository } from './src/shared/repositories/TransactionRepository';

async function checkState() {
  const subRepo = new SubscriptionRepository();
  const txnRepo = new TransactionRepository();
  
  // Check subscription
  const subs = await subRepo.findActiveByVehicle('TEST_VIN_12345');
  console.log('\n📊 Active Subscriptions:');
  subs.forEach(s => {
    console.log(`  - ${s.featureId}: ${s.status}`);
    console.log(`    Purchased: ${s.purchasedAt}`);
    console.log(`    Expires: ${s.expiresAt}`);
  });
  
  // Check transactions
  const txns = await txnRepo.findByVehicle('TEST_VIN_12345');
  console.log('\n💰 Transactions:');
  txns.forEach(t => {
    console.log(`  - ${t.transactionId}: $${t.amount} (${t.status})`);
  });
}

checkState().catch(console.error);
```

Run it:
```bash
npx ts-node test-db-state.ts
```

**Expected Output:**
```
📊 Active Subscriptions:
  - SPORT_MODE_WEEKEND: PENDING
    Purchased: 2024-12-04T10:00:00.000Z
    Expires: 2024-12-06T10:00:00.000Z

💰 Transactions:
  - txn_abc123: $29.99 (COMPLETED)
```

### Step 4: Simulate Activation Message

```typescript
// test-activation.ts
import { handler } from './src/lambda/activation-handler';
import { SQSEvent } from 'aws-lambda';

async function testActivation() {
  // This would normally come from SQS after purchase
  const event: Partial<SQSEvent> = {
    Records: [{
      body: JSON.stringify({
        subscriptionId: 'sub_xyz789',
        vehicleId: 'TEST_VIN_12345',
        featureId: 'SPORT_MODE_WEEKEND'
      }),
      messageId: 'msg-123',
      receiptHandle: 'receipt-123',
    }] as any
  };

  console.log('🚀 Simulating activation...\n');
  
  await handler(event as any);
  
  console.log('✅ Activation message sent to IoT Core');
  console.log('📡 Topic: vehicle/TEST_VIN_12345/feature/activation');
}

testActivation().catch(console.error);
```

**Expected Output:**
```
🚀 Simulating activation...

Processing activation: {
  subscriptionId: 'sub_xyz789',
  vehicleId: 'TEST_VIN_12345',
  featureId: 'SPORT_MODE_WEEKEND'
}
Activation message published to topic: vehicle/TEST_VIN_12345/feature/activation

✅ Activation message sent to IoT Core
📡 Topic: vehicle/TEST_VIN_12345/feature/activation
```

### Step 5: Simulate Vehicle ACK

```typescript
// test-ack.ts
import { handler } from './src/lambda/ack-handler';

async function testAck() {
  // This would normally come from IoT Core after vehicle processes message
  const ackMessage = {
    messageId: 'msg_def456',
    timestamp: new Date().toISOString(),
    vehicleId: 'TEST_VIN_12345',
    messageType: 'FEATURE_ACTIVATION_ACK',
    payload: {
      featureId: 'SPORT_MODE_WEEKEND',
      status: 'SUCCESS',
      activatedAt: new Date().toISOString()
    },
    signature: 'mock-signature-for-testing'
  };

  console.log('📨 Simulating vehicle ACK...\n');
  
  // Note: In real scenario, signature would be verified
  // For testing, we'll mock the verification
  process.env.SKIP_SIGNATURE_VERIFICATION = 'true';
  
  await handler(ackMessage);
  
  console.log('✅ ACK processed successfully');
}

testAck().catch(console.error);
```

**Expected Output:**
```
📨 Simulating vehicle ACK...

Processing activation ACK: {
  vehicleId: 'TEST_VIN_12345',
  payload: { featureId: 'SPORT_MODE_WEEKEND', status: 'SUCCESS' }
}
Subscription activated: sub_xyz789

✅ ACK processed successfully
```

### Step 6: Verify Final State

```bash
npx ts-node test-db-state.ts
```

**Expected Output:**
```
📊 Active Subscriptions:
  - SPORT_MODE_WEEKEND: ACTIVE  ← Status changed!
    Purchased: 2024-12-04T10:00:00.000Z
    Activated: 2024-12-04T10:00:10.000Z  ← New field!
    Expires: 2024-12-06T10:00:00.000Z

💰 Transactions:
  - txn_abc123: $29.99 (COMPLETED)
```

### Step 7: Test with Snapdragon Simulator

Use the MCP Snapdragon Simulator to test the complete flow:

```typescript
// test-with-simulator.ts
import { 
  mcp_snapdragon_simulator_get_vehicle_state,
  mcp_snapdragon_simulator_activate_feature 
} from './mcp-servers/snapdragon-simulator';

async function testWithSimulator() {
  const vehicleId = 'TEST_VIN_12345';
  
  // 1. Check initial state
  console.log('🚗 Initial Vehicle State:');
  let state = await mcp_snapdragon_simulator_get_vehicle_state({ vehicleId });
  console.log(state);
  
  // 2. Activate feature
  console.log('\n🏁 Activating Sport Mode...');
  await mcp_snapdragon_simulator_activate_feature({
    vehicleId,
    featureId: 'SPORT_MODE',
    duration: 48
  });
  
  // 3. Check updated state
  console.log('\n✅ Updated Vehicle State:');
  state = await mcp_snapdragon_simulator_get_vehicle_state({ vehicleId });
  console.log(state);
}

testWithSimulator().catch(console.error);
```

**Expected Output:**
```
🚗 Initial Vehicle State:
{
  vehicleId: 'TEST_VIN_12345',
  activeFeatures: [],
  connectivityTier: 'TIER_4G',
  performanceMode: 'COMFORT'
}

🏁 Activating Sport Mode...

✅ Updated Vehicle State:
{
  vehicleId: 'TEST_VIN_12345',
  activeFeatures: [
    {
      featureId: 'SPORT_MODE',
      activatedAt: '2024-12-04T10:00:00Z',
      expiresAt: '2024-12-06T10:00:00Z'
    }
  ],
  connectivityTier: 'TIER_4G',
  performanceMode: 'SPORT'  ← Changed!
}
```

### Step 8: Test Expiration

```typescript
// test-expiration.ts
import { 
  mcp_snapdragon_simulator_advance_time,
  mcp_snapdragon_simulator_get_vehicle_state 
} from './mcp-servers/snapdragon-simulator';

async function testExpiration() {
  const vehicleId = 'TEST_VIN_12345';
  
  console.log('⏰ Fast-forwarding time by 48 hours...');
  await mcp_snapdragon_simulator_advance_time({
    vehicleId,
    hours: 48
  });
  
  console.log('\n📊 Vehicle State After Expiration:');
  const state = await mcp_snapdragon_simulator_get_vehicle_state({ vehicleId });
  console.log(state);
}

testExpiration().catch(console.error);
```

**Expected Output:**
```
⏰ Fast-forwarding time by 48 hours...

📊 Vehicle State After Expiration:
{
  vehicleId: 'TEST_VIN_12345',
  activeFeatures: [],  ← Feature removed!
  connectivityTier: 'TIER_4G',
  performanceMode: 'COMFORT'  ← Restored to default!
}
```

## Complete End-to-End Test Script

```bash
# Run all tests in sequence
npm run test:e2e
```

Or manually:

```bash
# 1. Setup
npm run db:setup

# 2. Test purchase
npx ts-node test-purchase.ts

# 3. Check database
npx ts-node test-db-state.ts

# 4. Test activation
npx ts-node test-activation.ts

# 5. Test ACK
npx ts-node test-ack.ts

# 6. Verify final state
npx ts-node test-db-state.ts

# 7. Test with simulator
npx ts-node test-with-simulator.ts

# 8. Test expiration
npx ts-node test-expiration.ts
```

## Troubleshooting

### MongoDB Connection Error
```
Error: Failed to connect to MongoDB
```
**Solution:** Check `MONGODB_URI` environment variable

### Payment Failed
```
Error: Payment declined by processor
```
**Solution:** This is simulated - 10% of payments fail randomly for testing

### Signature Verification Failed
```
Error: Message signature verification failed
```
**Solution:** Set `SKIP_SIGNATURE_VERIFICATION=true` for local testing

### Feature Not Found
```
Error: Feature not found: SPORT_MODE_WEEKEND
```
**Solution:** Run `npm run db:setup` to seed features

## Next Steps

1. **Deploy to AWS**: `cd infrastructure && cdk deploy --all`
2. **Configure IoT**: Set up device certificates
3. **Test with Real Vehicle**: Use actual Snapdragon hardware
4. **Monitor**: Check CloudWatch dashboards
5. **Scale**: Adjust Lambda concurrency and database capacity

## Support

- System Overview: `docs/SYSTEM_OVERVIEW.md`
- MongoDB Setup: `docs/MONGODB_SETUP.md`
- API Reference: `.kiro/steering/qualcomm-car-to-cloud-sdk.md`
