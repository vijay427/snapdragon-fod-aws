# Database Quick Start

Quick reference for working with MongoDB in the FOD system.

## Local Development Setup

### 1. Set Environment Variable

```bash
# Windows (PowerShell)
$env:MONGODB_URI="mongodb+srv://fod-user:YOUR_PASSWORD@cluster.mongodb.net/fod-system?retryWrites=true&w=majority"

# Linux/Mac
export MONGODB_URI="mongodb+srv://fod-user:YOUR_PASSWORD@cluster.mongodb.net/fod-system?retryWrites=true&w=majority"
```

### 2. Initialize Database

```bash
npm run db:setup
```

### 3. Test Connection

```bash
npm run db:test
```

## Using Database in Code

### Import Connection

```typescript
import { getDatabase } from '../shared/config/database';
import { COLLECTIONS } from '../shared/config/collections';
```

### Query Examples

```typescript
// Get database instance
const db = await getDatabase();

// Find active subscriptions for a vehicle
const subscriptions = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
  .find({ 
    vehicleId: 'VIN123', 
    status: 'ACTIVE' 
  })
  .toArray();

// Insert a new transaction
await db.collection(COLLECTIONS.TRANSACTIONS).insertOne({
  transactionId: 'txn_123',
  vehicleId: 'VIN123',
  featureId: 'SPORT_MODE',
  amount: 29.99,
  status: 'COMPLETED',
  timestamp: new Date(),
});

// Update subscription status
await db.collection(COLLECTIONS.SUBSCRIPTIONS).updateOne(
  { subscriptionId: 'sub_123' },
  { 
    $set: { 
      status: 'ACTIVE',
      activatedAt: new Date()
    }
  }
);

// Find expired subscriptions
const expired = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
  .find({
    status: 'ACTIVE',
    expiresAt: { $lte: new Date() }
  })
  .toArray();
```

## Collection Names

```typescript
import { COLLECTIONS } from '../shared/config/collections';

COLLECTIONS.FEATURES       // 'features'
COLLECTIONS.SUBSCRIPTIONS  // 'subscriptions'
COLLECTIONS.TRANSACTIONS   // 'transactions'
COLLECTIONS.TELEMETRY      // 'telemetry'
```

## Common Queries

### Get Feature by ID

```typescript
const feature = await db.collection(COLLECTIONS.FEATURES)
  .findOne({ featureId: 'CONNECTIVITY_5G' });
```

### Get Active Subscriptions for Vehicle

```typescript
const activeSubscriptions = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
  .find({ 
    vehicleId: vehicleId,
    status: 'ACTIVE'
  })
  .toArray();
```

### Check if Feature Already Purchased

```typescript
const existing = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
  .findOne({
    vehicleId: vehicleId,
    featureId: featureId,
    status: { $in: ['PENDING', 'ACTIVE'] }
  });

if (existing) {
  throw new Error('Feature already purchased');
}
```

### Record Telemetry Event

```typescript
await db.collection(COLLECTIONS.TELEMETRY).insertOne({
  vehicleId: vehicleId,
  eventType: 'FEATURE_ACTIVATED',
  featureId: featureId,
  timestamp: new Date(),
  metadata: {
    duration: 48,
    mode: 'SPORT'
  }
});
```

### Find Expiring Soon

```typescript
const expiringIn24Hours = await db.collection(COLLECTIONS.SUBSCRIPTIONS)
  .find({
    status: 'ACTIVE',
    expiresAt: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  })
  .toArray();
```

## Error Handling

```typescript
import { getDatabase } from '../shared/config/database';

try {
  const db = await getDatabase();
  const result = await db.collection(COLLECTIONS.FEATURES).findOne({ featureId });
  
  if (!result) {
    throw new Error('Feature not found');
  }
  
  return result;
} catch (error) {
  console.error('Database error:', error);
  throw new Error(`Failed to fetch feature: ${error.message}`);
}
```

## Testing

### Mock Database in Tests

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let mongoServer: MongoMemoryServer;
let client: MongoClient;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  client = new MongoClient(uri);
  await client.connect();
});

afterAll(async () => {
  await client.close();
  await mongoServer.stop();
});

test('should insert subscription', async () => {
  const db = client.db('test');
  const result = await db.collection('subscriptions').insertOne({
    subscriptionId: 'test_123',
    vehicleId: 'VIN123',
    featureId: 'SPORT_MODE',
    status: 'ACTIVE',
    purchasedAt: new Date(),
  });
  
  expect(result.insertedId).toBeDefined();
});
```

## Performance Tips

1. **Use Indexes**: All queries should use indexed fields
2. **Project Fields**: Only fetch fields you need
3. **Batch Operations**: Use `bulkWrite()` for multiple operations
4. **Connection Pooling**: Reuse database connections (handled automatically)

```typescript
// GOOD: Uses index, projects fields
const features = await db.collection(COLLECTIONS.FEATURES)
  .find({ featureType: 'PERFORMANCE_MODE' })
  .project({ featureId: 1, name: 1, price: 1 })
  .toArray();

// BAD: No index, fetches all fields
const features = await db.collection(COLLECTIONS.FEATURES)
  .find({ 'metadata.customField': 'value' })
  .toArray();
```

## Troubleshooting

### Connection Issues

```typescript
import { checkDatabaseHealth } from '../shared/config/database';

const isHealthy = await checkDatabaseHealth();
if (!isHealthy) {
  console.error('Database connection unhealthy');
}
```

### View Logs

```bash
# Check Lambda logs
aws logs tail /aws/lambda/PurchaseHandler --follow

# Check for database errors
aws logs filter-pattern "Database error" --log-group-name /aws/lambda/PurchaseHandler
```

## Next Steps

- See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for full setup guide
- See [coding-standards.md](../.kiro/steering/coding-standards.md) for error handling patterns
- Continue with Task 4: Implement core data models
