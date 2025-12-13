"use strict";
/**
 * MongoDB Collection Definitions and Schemas
 * Defines collection names, indexes, and validation schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATION_SCHEMAS = exports.INDEXES = exports.COLLECTIONS = void 0;
exports.createCollections = createCollections;
exports.createIndexes = createIndexes;
// Collection names
exports.COLLECTIONS = {
    FEATURES: 'features',
    SUBSCRIPTIONS: 'subscriptions',
    TRANSACTIONS: 'transactions',
    TELEMETRY: 'telemetry',
};
// Index definitions
exports.INDEXES = {
    features: [
        {
            key: { featureId: 1 },
            options: { unique: true, name: 'idx_feature_id' },
        },
        {
            key: { featureType: 1 },
            options: { name: 'idx_feature_type' },
        },
    ],
    subscriptions: [
        {
            key: { subscriptionId: 1 },
            options: { unique: true, name: 'idx_subscription_id' },
        },
        {
            key: { vehicleId: 1, featureId: 1 },
            options: { name: 'idx_vehicle_feature' },
        },
        {
            key: { vehicleId: 1, status: 1 },
            options: { name: 'idx_vehicle_status' },
        },
        {
            key: { expiresAt: 1 },
            options: {
                name: 'idx_expires_at',
                partialFilterExpression: { expiresAt: { $exists: true } }
            },
        },
        {
            key: { status: 1, expiresAt: 1 },
            options: {
                name: 'idx_status_expires',
                partialFilterExpression: { expiresAt: { $exists: true } }
            },
        },
    ],
    transactions: [
        {
            key: { transactionId: 1 },
            options: { unique: true, name: 'idx_transaction_id' },
        },
        {
            key: { vehicleId: 1, timestamp: -1 },
            options: { name: 'idx_vehicle_timestamp' },
        },
        {
            key: { subscriptionId: 1 },
            options: { name: 'idx_subscription_id' },
        },
    ],
    telemetry: [
        {
            key: { vehicleId: 1, timestamp: -1 },
            options: { name: 'idx_vehicle_timestamp' },
        },
        {
            key: { eventType: 1, timestamp: -1 },
            options: { name: 'idx_event_timestamp' },
        },
        {
            key: { timestamp: 1 },
            options: {
                name: 'idx_timestamp_ttl',
                expireAfterSeconds: 7776000 // 90 days
            },
        },
    ],
};
// Validation schemas
exports.VALIDATION_SCHEMAS = {
    features: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['featureId', 'name', 'featureType', 'price', 'isActive'],
            properties: {
                featureId: {
                    bsonType: 'string',
                    description: 'Unique feature identifier',
                },
                name: {
                    bsonType: 'string',
                    description: 'Feature display name',
                },
                description: {
                    bsonType: 'string',
                    description: 'Feature description',
                },
                featureType: {
                    enum: ['CONNECTIVITY_TIER', 'PERFORMANCE_MODE', 'INFOTAINMENT'],
                    description: 'Type of feature',
                },
                price: {
                    bsonType: 'number',
                    minimum: 0,
                    description: 'Feature price in USD',
                },
                duration: {
                    bsonType: 'number',
                    minimum: 0,
                    description: 'Feature duration in hours (0 for permanent)',
                },
                isActive: {
                    bsonType: 'bool',
                    description: 'Whether feature is available for purchase',
                },
                metadata: {
                    bsonType: 'object',
                    description: 'Additional feature configuration',
                },
            },
        },
    },
    subscriptions: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['subscriptionId', 'vehicleId', 'featureId', 'status', 'purchasedAt'],
            properties: {
                subscriptionId: {
                    bsonType: 'string',
                    description: 'Unique subscription identifier',
                },
                vehicleId: {
                    bsonType: 'string',
                    description: 'Vehicle VIN',
                },
                featureId: {
                    bsonType: 'string',
                    description: 'Feature identifier',
                },
                status: {
                    enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'DEACTIVATED', 'FAILED'],
                    description: 'Subscription status',
                },
                purchasedAt: {
                    bsonType: 'date',
                    description: 'Purchase timestamp',
                },
                activatedAt: {
                    bsonType: 'date',
                    description: 'Activation timestamp',
                },
                expiresAt: {
                    bsonType: 'date',
                    description: 'Expiration timestamp (null for permanent)',
                },
                deactivatedAt: {
                    bsonType: 'date',
                    description: 'Deactivation timestamp',
                },
                isPermanent: {
                    bsonType: 'bool',
                    description: 'Whether subscription is permanent',
                },
            },
        },
    },
    transactions: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['transactionId', 'vehicleId', 'featureId', 'amount', 'status', 'timestamp'],
            properties: {
                transactionId: {
                    bsonType: 'string',
                    description: 'Unique transaction identifier',
                },
                vehicleId: {
                    bsonType: 'string',
                    description: 'Vehicle VIN',
                },
                featureId: {
                    bsonType: 'string',
                    description: 'Feature identifier',
                },
                subscriptionId: {
                    bsonType: 'string',
                    description: 'Associated subscription ID',
                },
                amount: {
                    bsonType: 'number',
                    minimum: 0,
                    description: 'Transaction amount in USD',
                },
                status: {
                    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
                    description: 'Transaction status',
                },
                paymentMethod: {
                    bsonType: 'string',
                    description: 'Payment method used',
                },
                timestamp: {
                    bsonType: 'date',
                    description: 'Transaction timestamp',
                },
            },
        },
    },
    telemetry: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['vehicleId', 'eventType', 'timestamp'],
            properties: {
                vehicleId: {
                    bsonType: 'string',
                    description: 'Vehicle VIN',
                },
                eventType: {
                    enum: ['FEATURE_ACTIVATED', 'FEATURE_DEACTIVATED', 'FEATURE_USED', 'ERROR', 'STATE_CHANGE'],
                    description: 'Type of telemetry event',
                },
                featureId: {
                    bsonType: 'string',
                    description: 'Associated feature ID',
                },
                timestamp: {
                    bsonType: 'date',
                    description: 'Event timestamp',
                },
                metadata: {
                    bsonType: 'object',
                    description: 'Additional event data',
                },
            },
        },
    },
};
/**
 * Create all collections with validation schemas
 */
async function createCollections(db) {
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);
    for (const [collectionName, schema] of Object.entries(exports.VALIDATION_SCHEMAS)) {
        if (!existingNames.includes(collectionName)) {
            await db.createCollection(collectionName, {
                validator: schema,
                validationLevel: 'strict',
                validationAction: 'error',
            });
            console.log(`Created collection: ${collectionName}`);
        }
        else {
            // Update validation schema for existing collection
            await db.command({
                collMod: collectionName,
                validator: schema,
                validationLevel: 'strict',
            });
            console.log(`Updated validation for collection: ${collectionName}`);
        }
    }
}
/**
 * Create all indexes for performance
 */
async function createIndexes(db) {
    for (const [collectionName, indexes] of Object.entries(exports.INDEXES)) {
        const collection = db.collection(collectionName);
        for (const indexDef of indexes) {
            try {
                await collection.createIndex(indexDef.key, indexDef.options);
                console.log(`Created index ${indexDef.options.name} on ${collectionName}`);
            }
            catch (error) {
                // Index might already exist
                if (error.code !== 85 && error.code !== 86) {
                    console.error(`Failed to create index ${indexDef.options.name}:`, error);
                }
            }
        }
    }
}
