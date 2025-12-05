# MongoDB Atlas Setup Guide

This guide walks you through setting up MongoDB Atlas for the Feature on Demand (FOD) system.

## Prerequisites

- MongoDB Atlas account (free tier available at https://www.mongodb.com/cloud/atlas)
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed

## Step 1: Create MongoDB Atlas Cluster

1. **Sign up/Login to MongoDB Atlas**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free account or log in

2. **Create a New Cluster**
   - Click "Build a Database"
   - Select **M10** tier (recommended for production)
     - For development: M0 (free tier) is acceptable
   - Choose **AWS** as cloud provider
   - Select region closest to your AWS deployment (e.g., `us-east-1`)
   - Name your cluster: `fod-cluster`

3. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your AWS VPC CIDR block or use VPC Peering

4. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Username: `fod-user`
   - Password: Generate a strong password (save this!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

## Step 2: Get Connection String

1. Click "Connect" on your cluster
2. Select "Connect your application"
3. Choose Driver: **Node.js** and Version: **4.1 or later**
4. Copy the connection string, it will look like:
   ```
   mongodb+srv://fod-user:<password>@fod-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add the database name: `fod-system`
   ```
   mongodb+srv://fod-user:YOUR_PASSWORD@fod-cluster.xxxxx.mongodb.net/fod-system?retryWrites=true&w=majority
   ```

## Step 3: Store Connection String in AWS Secrets Manager

### Option A: Using AWS Console

1. Go to AWS Secrets Manager console
2. Find the secret named `DatabaseStack/mongodb-connection`
3. Click "Retrieve secret value"
4. Click "Edit"
5. Update the JSON with your actual connection string:
   ```json
   {
     "connectionString": "mongodb+srv://fod-user:YOUR_PASSWORD@fod-cluster.xxxxx.mongodb.net/fod-system?retryWrites=true&w=majority",
     "database": "fod-system",
     "username": "fod-user"
   }
   ```
6. Click "Save"

### Option B: Using AWS CLI

```bash
# Update the secret with your connection string
aws secretsmanager update-secret \
  --secret-id DatabaseStack/mongodb-connection \
  --secret-string '{
    "connectionString": "mongodb+srv://fod-user:YOUR_PASSWORD@fod-cluster.xxxxx.mongodb.net/fod-system?retryWrites=true&w=majority",
    "database": "fod-system",
    "username": "fod-user"
  }'
```

## Step 4: Initialize Database Schema

Run the database setup script to create collections, indexes, and seed data:

```bash
# Set environment variable for local testing
export MONGODB_URI="mongodb+srv://fod-user:YOUR_PASSWORD@fod-cluster.xxxxx.mongodb.net/fod-system?retryWrites=true&w=majority"

# Run setup script
npm run db:setup
```

Or using the TypeScript file directly:

```bash
npx ts-node src/shared/config/database-setup.ts
```

This will:
- Create 4 collections: `features`, `subscriptions`, `transactions`, `telemetry`
- Apply validation schemas to each collection
- Create performance indexes
- Seed initial feature catalog

## Step 5: Verify Setup

### Check Collections

```bash
# Using MongoDB Compass (GUI)
# Download from: https://www.mongodb.com/products/compass
# Connect using your connection string
# You should see 4 collections with data in 'features'

# Or using MongoDB Shell
mongosh "mongodb+srv://fod-user:YOUR_PASSWORD@fod-cluster.xxxxx.mongodb.net/fod-system"

# List collections
show collections

# Check features
db.features.find().pretty()

# Check indexes
db.subscriptions.getIndexes()
```

### Test Connection from Lambda

```bash
# Test locally
npm test -- database.test.ts
```

## Database Schema

### Collections

#### 1. **features**
Stores the feature catalog available for purchase.

```typescript
{
  featureId: string;        // Unique identifier (e.g., "CONNECTIVITY_5G")
  name: string;             // Display name
  description: string;      // Feature description
  featureType: string;      // "CONNECTIVITY_TIER" | "PERFORMANCE_MODE" | "INFOTAINMENT"
  price: number;            // Price in USD
  duration: number;         // Duration in hours (0 = permanent)
  isActive: boolean;        // Available for purchase
  metadata: object;         // Feature-specific configuration
}
```

**Indexes:**
- `featureId` (unique)
- `featureType`

#### 2. **subscriptions**
Tracks active and historical feature subscriptions per vehicle.

```typescript
{
  subscriptionId: string;   // Unique identifier
  vehicleId: string;        // Vehicle VIN
  featureId: string;        // Feature identifier
  status: string;           // "PENDING" | "ACTIVE" | "EXPIRED" | "DEACTIVATED" | "FAILED"
  purchasedAt: Date;        // Purchase timestamp
  activatedAt?: Date;       // Activation timestamp
  expiresAt?: Date;         // Expiration timestamp (null for permanent)
  deactivatedAt?: Date;     // Deactivation timestamp
  isPermanent: boolean;     // Whether subscription is permanent
}
```

**Indexes:**
- `subscriptionId` (unique)
- `vehicleId + featureId`
- `vehicleId + status`
- `expiresAt` (for expiration checks)
- `status + expiresAt` (compound for efficient queries)

#### 3. **transactions**
Records all purchase transactions.

```typescript
{
  transactionId: string;    // Unique identifier
  vehicleId: string;        // Vehicle VIN
  featureId: string;        // Feature identifier
  subscriptionId: string;   // Associated subscription
  amount: number;           // Transaction amount in USD
  status: string;           // "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
  paymentMethod: string;    // Payment method used
  timestamp: Date;          // Transaction timestamp
}
```

**Indexes:**
- `transactionId` (unique)
- `vehicleId + timestamp` (for transaction history)
- `subscriptionId`

#### 4. **telemetry**
Stores vehicle telemetry and feature usage events.

```typescript
{
  vehicleId: string;        // Vehicle VIN
  eventType: string;        // "FEATURE_ACTIVATED" | "FEATURE_DEACTIVATED" | "FEATURE_USED" | "ERROR" | "STATE_CHANGE"
  featureId?: string;       // Associated feature
  timestamp: Date;          // Event timestamp
  metadata?: object;        // Additional event data
}
```

**Indexes:**
- `vehicleId + timestamp`
- `eventType + timestamp`
- `timestamp` (TTL index - auto-delete after 90 days)

## Performance Optimization

### Connection Pooling

The database connection manager uses connection pooling:
- **Max Pool Size**: 10 connections
- **Min Pool Size**: 2 connections
- **Connection Timeout**: 10 seconds
- **Server Selection Timeout**: 5 seconds

### Indexes

All collections have appropriate indexes for common query patterns:
- Unique indexes prevent duplicate data
- Compound indexes optimize multi-field queries
- TTL index on telemetry auto-deletes old data

### Query Best Practices

```typescript
// GOOD: Use indexed fields
db.subscriptions.find({ vehicleId: "VIN123", status: "ACTIVE" });

// GOOD: Project only needed fields
db.features.find({}, { featureId: 1, name: 1, price: 1 });

// BAD: Full collection scan
db.subscriptions.find({ "metadata.customField": "value" });
```

## Security Best Practices

1. **Network Security**
   - Use VPC Peering for production (not public IP whitelist)
   - Enable MongoDB Atlas IP Access List

2. **Authentication**
   - Use strong passwords (32+ characters)
   - Rotate credentials every 90 days
   - Store credentials only in AWS Secrets Manager

3. **Encryption**
   - MongoDB Atlas encrypts data at rest by default
   - All connections use TLS 1.2+

4. **Auditing**
   - Enable MongoDB Atlas audit logs
   - Monitor CloudWatch logs for database errors

## Monitoring

### MongoDB Atlas Metrics

Monitor these metrics in MongoDB Atlas dashboard:
- **Connections**: Should stay below 80% of max
- **Query Performance**: Slow queries (>100ms)
- **Disk Usage**: Alert at 80% capacity
- **Network**: Unusual traffic patterns

### CloudWatch Integration

```typescript
// Log database operations
logger.info('Database operation', {
  operation: 'insert',
  collection: 'subscriptions',
  duration: 45,
  success: true
});
```

## Troubleshooting

### Connection Timeout

```
Error: connect ETIMEDOUT
```

**Solution**: Check IP whitelist in MongoDB Atlas Network Access

### Authentication Failed

```
Error: Authentication failed
```

**Solution**: Verify username/password in Secrets Manager

### Slow Queries

```
Query took 2000ms
```

**Solution**: Check if indexes exist using `db.collection.getIndexes()`

### Connection Pool Exhausted

```
Error: No connection available
```

**Solution**: Increase `maxPoolSize` in database.ts or check for connection leaks

## Backup and Recovery

### Automated Backups

MongoDB Atlas M10+ clusters include:
- Continuous backups (point-in-time recovery)
- Snapshot every 6 hours
- Retention: 2 days (configurable)

### Manual Backup

```bash
# Export collection
mongoexport --uri="mongodb+srv://..." --collection=subscriptions --out=subscriptions.json

# Import collection
mongoimport --uri="mongodb+srv://..." --collection=subscriptions --file=subscriptions.json
```

## Cost Optimization

### Cluster Sizing

- **Development**: M0 (Free) - 512MB storage
- **Staging**: M10 ($0.08/hr) - 10GB storage
- **Production**: M20+ ($0.20/hr) - 20GB+ storage

### Data Retention

- Telemetry data auto-expires after 90 days (TTL index)
- Archive old transactions to S3 for long-term storage

## Next Steps

After completing MongoDB setup:
1. ✅ Verify all collections and indexes exist
2. ✅ Test connection from Lambda functions
3. ✅ Run database health checks
4. ⏭️ Continue with Task 4: Implement core data models

## Support

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- MongoDB Node.js Driver: https://mongodb.github.io/node-mongodb-native/
- AWS Secrets Manager: https://docs.aws.amazon.com/secretsmanager/
