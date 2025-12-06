/**
 * Custom Error Types for FOD System
 * Provides structured error handling with error codes
 */
/**
 * Base error class for FOD system
 */
export declare class FODError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: Record<string, any> | undefined;
    constructor(message: string, code: string, statusCode?: number, details?: Record<string, any> | undefined);
    toJSON(): {
        name: string;
        message: string;
        code: string;
        statusCode: number;
        details: Record<string, any> | undefined;
    };
}
/**
 * Feature-related errors
 */
export declare class FeatureNotFoundError extends FODError {
    constructor(featureId: string);
}
export declare class FeatureNotAvailableError extends FODError {
    constructor(featureId: string);
}
/**
 * Subscription-related errors
 */
export declare class SubscriptionNotFoundError extends FODError {
    constructor(subscriptionId: string);
}
export declare class DuplicateSubscriptionError extends FODError {
    constructor(vehicleId: string, featureId: string);
}
export declare class SubscriptionExpiredError extends FODError {
    constructor(subscriptionId: string);
}
/**
 * Transaction-related errors
 */
export declare class TransactionNotFoundError extends FODError {
    constructor(transactionId: string);
}
export declare class PaymentFailedError extends FODError {
    constructor(reason: string, details?: Record<string, any>);
}
export declare class InsufficientFundsError extends FODError {
    constructor(required: number, available: number);
}
/**
 * Activation-related errors
 */
export declare class FeatureActivationError extends FODError {
    readonly vehicleId: string;
    readonly featureId: string;
    constructor(message: string, vehicleId: string, featureId: string, details?: Record<string, any>);
}
export declare class FeatureDeactivationError extends FODError {
    readonly vehicleId: string;
    readonly featureId: string;
    constructor(message: string, vehicleId: string, featureId: string, details?: Record<string, any>);
}
/**
 * Message-related errors
 */
export declare class InvalidMessageError extends FODError {
    constructor(reason: string, details?: Record<string, any>);
}
export declare class MessageSignatureError extends FODError {
    constructor(reason: string);
}
export declare class MessageExpiredError extends FODError {
    constructor(timestamp: string);
}
/**
 * Database-related errors
 */
export declare class DatabaseError extends FODError {
    constructor(operation: string, reason: string, details?: Record<string, any>);
}
export declare class DatabaseConnectionError extends FODError {
    constructor(reason: string);
}
/**
 * Validation errors
 */
export declare class ValidationError extends FODError {
    constructor(field: string, reason: string);
}
/**
 * Vehicle-related errors
 */
export declare class VehicleNotFoundError extends FODError {
    constructor(vehicleId: string);
}
export declare class VehicleOfflineError extends FODError {
    constructor(vehicleId: string);
}
/**
 * Helper function to check if error is a FOD error
 */
export declare function isFODError(error: any): error is FODError;
/**
 * Helper function to convert any error to FOD error
 */
export declare function toFODError(error: any): FODError;
//# sourceMappingURL=Errors.d.ts.map