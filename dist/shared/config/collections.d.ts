/**
 * MongoDB Collection Definitions and Schemas
 * Defines collection names, indexes, and validation schemas
 */
import { Db, IndexSpecification, CreateIndexesOptions } from 'mongodb';
export declare const COLLECTIONS: {
    readonly FEATURES: "features";
    readonly SUBSCRIPTIONS: "subscriptions";
    readonly TRANSACTIONS: "transactions";
    readonly TELEMETRY: "telemetry";
};
export declare const INDEXES: Record<string, Array<{
    key: IndexSpecification;
    options: CreateIndexesOptions;
}>>;
export declare const VALIDATION_SCHEMAS: {
    features: {
        $jsonSchema: {
            bsonType: string;
            required: string[];
            properties: {
                featureId: {
                    bsonType: string;
                    description: string;
                };
                name: {
                    bsonType: string;
                    description: string;
                };
                description: {
                    bsonType: string;
                    description: string;
                };
                featureType: {
                    enum: string[];
                    description: string;
                };
                price: {
                    bsonType: string;
                    minimum: number;
                    description: string;
                };
                duration: {
                    bsonType: string;
                    minimum: number;
                    description: string;
                };
                isActive: {
                    bsonType: string;
                    description: string;
                };
                metadata: {
                    bsonType: string;
                    description: string;
                };
            };
        };
    };
    subscriptions: {
        $jsonSchema: {
            bsonType: string;
            required: string[];
            properties: {
                subscriptionId: {
                    bsonType: string;
                    description: string;
                };
                vehicleId: {
                    bsonType: string;
                    description: string;
                };
                featureId: {
                    bsonType: string;
                    description: string;
                };
                status: {
                    enum: string[];
                    description: string;
                };
                purchasedAt: {
                    bsonType: string;
                    description: string;
                };
                activatedAt: {
                    bsonType: string;
                    description: string;
                };
                expiresAt: {
                    bsonType: string;
                    description: string;
                };
                deactivatedAt: {
                    bsonType: string;
                    description: string;
                };
                isPermanent: {
                    bsonType: string;
                    description: string;
                };
            };
        };
    };
    transactions: {
        $jsonSchema: {
            bsonType: string;
            required: string[];
            properties: {
                transactionId: {
                    bsonType: string;
                    description: string;
                };
                vehicleId: {
                    bsonType: string;
                    description: string;
                };
                featureId: {
                    bsonType: string;
                    description: string;
                };
                subscriptionId: {
                    bsonType: string;
                    description: string;
                };
                amount: {
                    bsonType: string;
                    minimum: number;
                    description: string;
                };
                status: {
                    enum: string[];
                    description: string;
                };
                paymentMethod: {
                    bsonType: string;
                    description: string;
                };
                timestamp: {
                    bsonType: string;
                    description: string;
                };
            };
        };
    };
    telemetry: {
        $jsonSchema: {
            bsonType: string;
            required: string[];
            properties: {
                vehicleId: {
                    bsonType: string;
                    description: string;
                };
                eventType: {
                    enum: string[];
                    description: string;
                };
                featureId: {
                    bsonType: string;
                    description: string;
                };
                timestamp: {
                    bsonType: string;
                    description: string;
                };
                metadata: {
                    bsonType: string;
                    description: string;
                };
            };
        };
    };
};
/**
 * Create all collections with validation schemas
 */
export declare function createCollections(db: Db): Promise<void>;
/**
 * Create all indexes for performance
 */
export declare function createIndexes(db: Db): Promise<void>;
//# sourceMappingURL=collections.d.ts.map