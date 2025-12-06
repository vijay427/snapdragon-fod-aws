/**
 * MongoDB Collection Definitions and Schemas
 * Defines collection names, indexes, and validation schemas
 */
import { Db } from 'mongodb';
export declare const COLLECTIONS: {
    readonly FEATURES: "features";
    readonly SUBSCRIPTIONS: "subscriptions";
    readonly TRANSACTIONS: "transactions";
    readonly TELEMETRY: "telemetry";
};
export declare const INDEXES: {
    features: ({
        key: {
            featureId: number;
            featureType?: undefined;
        };
        options: {
            unique: boolean;
            name: string;
        };
    } | {
        key: {
            featureType: number;
            featureId?: undefined;
        };
        options: {
            name: string;
            unique?: undefined;
        };
    })[];
    subscriptions: ({
        key: {
            subscriptionId: number;
            vehicleId?: undefined;
            featureId?: undefined;
            status?: undefined;
            expiresAt?: undefined;
        };
        options: {
            unique: boolean;
            name: string;
            partialFilterExpression?: undefined;
        };
    } | {
        key: {
            vehicleId: number;
            featureId: number;
            subscriptionId?: undefined;
            status?: undefined;
            expiresAt?: undefined;
        };
        options: {
            name: string;
            unique?: undefined;
            partialFilterExpression?: undefined;
        };
    } | {
        key: {
            vehicleId: number;
            status: number;
            subscriptionId?: undefined;
            featureId?: undefined;
            expiresAt?: undefined;
        };
        options: {
            name: string;
            unique?: undefined;
            partialFilterExpression?: undefined;
        };
    } | {
        key: {
            expiresAt: number;
            subscriptionId?: undefined;
            vehicleId?: undefined;
            featureId?: undefined;
            status?: undefined;
        };
        options: {
            name: string;
            partialFilterExpression: {
                expiresAt: {
                    $exists: boolean;
                };
            };
            unique?: undefined;
        };
    } | {
        key: {
            status: number;
            expiresAt: number;
            subscriptionId?: undefined;
            vehicleId?: undefined;
            featureId?: undefined;
        };
        options: {
            name: string;
            partialFilterExpression: {
                expiresAt: {
                    $exists: boolean;
                };
            };
            unique?: undefined;
        };
    })[];
    transactions: ({
        key: {
            transactionId: number;
            vehicleId?: undefined;
            timestamp?: undefined;
            subscriptionId?: undefined;
        };
        options: {
            unique: boolean;
            name: string;
        };
    } | {
        key: {
            vehicleId: number;
            timestamp: number;
            transactionId?: undefined;
            subscriptionId?: undefined;
        };
        options: {
            name: string;
            unique?: undefined;
        };
    } | {
        key: {
            subscriptionId: number;
            transactionId?: undefined;
            vehicleId?: undefined;
            timestamp?: undefined;
        };
        options: {
            name: string;
            unique?: undefined;
        };
    })[];
    telemetry: ({
        key: {
            vehicleId: number;
            timestamp: number;
            eventType?: undefined;
        };
        options: {
            name: string;
            expireAfterSeconds?: undefined;
        };
    } | {
        key: {
            eventType: number;
            timestamp: number;
            vehicleId?: undefined;
        };
        options: {
            name: string;
            expireAfterSeconds?: undefined;
        };
    } | {
        key: {
            timestamp: number;
            vehicleId?: undefined;
            eventType?: undefined;
        };
        options: {
            name: string;
            expireAfterSeconds: number;
        };
    })[];
};
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