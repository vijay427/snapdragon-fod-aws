"use strict";
/**
 * Custom Error Types for FOD System
 * Provides structured error handling with error codes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleOfflineError = exports.VehicleNotFoundError = exports.ValidationError = exports.DatabaseConnectionError = exports.DatabaseError = exports.MessageExpiredError = exports.MessageSignatureError = exports.InvalidMessageError = exports.FeatureDeactivationError = exports.FeatureActivationError = exports.InsufficientFundsError = exports.PaymentFailedError = exports.TransactionNotFoundError = exports.SubscriptionExpiredError = exports.DuplicateSubscriptionError = exports.SubscriptionNotFoundError = exports.FeatureNotAvailableError = exports.FeatureNotFoundError = exports.FODError = void 0;
exports.isFODError = isFODError;
exports.toFODError = toFODError;
/**
 * Base error class for FOD system
 */
class FODError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'FODError';
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            details: this.details,
        };
    }
}
exports.FODError = FODError;
/**
 * Feature-related errors
 */
class FeatureNotFoundError extends FODError {
    constructor(featureId) {
        super(`Feature not found: ${featureId}`, 'FEATURE_NOT_FOUND', 404, { featureId });
        this.name = 'FeatureNotFoundError';
    }
}
exports.FeatureNotFoundError = FeatureNotFoundError;
class FeatureNotAvailableError extends FODError {
    constructor(featureId) {
        super(`Feature not available for purchase: ${featureId}`, 'FEATURE_NOT_AVAILABLE', 400, {
            featureId,
        });
        this.name = 'FeatureNotAvailableError';
    }
}
exports.FeatureNotAvailableError = FeatureNotAvailableError;
/**
 * Subscription-related errors
 */
class SubscriptionNotFoundError extends FODError {
    constructor(subscriptionId) {
        super(`Subscription not found: ${subscriptionId}`, 'SUBSCRIPTION_NOT_FOUND', 404, {
            subscriptionId,
        });
        this.name = 'SubscriptionNotFoundError';
    }
}
exports.SubscriptionNotFoundError = SubscriptionNotFoundError;
class DuplicateSubscriptionError extends FODError {
    constructor(vehicleId, featureId) {
        super(`Vehicle already has an active subscription for this feature`, 'DUPLICATE_SUBSCRIPTION', 409, { vehicleId, featureId });
        this.name = 'DuplicateSubscriptionError';
    }
}
exports.DuplicateSubscriptionError = DuplicateSubscriptionError;
class SubscriptionExpiredError extends FODError {
    constructor(subscriptionId) {
        super(`Subscription has expired: ${subscriptionId}`, 'SUBSCRIPTION_EXPIRED', 400, {
            subscriptionId,
        });
        this.name = 'SubscriptionExpiredError';
    }
}
exports.SubscriptionExpiredError = SubscriptionExpiredError;
/**
 * Transaction-related errors
 */
class TransactionNotFoundError extends FODError {
    constructor(transactionId) {
        super(`Transaction not found: ${transactionId}`, 'TRANSACTION_NOT_FOUND', 404, {
            transactionId,
        });
        this.name = 'TransactionNotFoundError';
    }
}
exports.TransactionNotFoundError = TransactionNotFoundError;
class PaymentFailedError extends FODError {
    constructor(reason, details) {
        super(`Payment failed: ${reason}`, 'PAYMENT_FAILED', 402, details);
        this.name = 'PaymentFailedError';
    }
}
exports.PaymentFailedError = PaymentFailedError;
class InsufficientFundsError extends FODError {
    constructor(required, available) {
        super(`Insufficient funds: required ${required}, available ${available}`, 'INSUFFICIENT_FUNDS', 402, { required, available });
        this.name = 'InsufficientFundsError';
    }
}
exports.InsufficientFundsError = InsufficientFundsError;
/**
 * Activation-related errors
 */
class FeatureActivationError extends FODError {
    vehicleId;
    featureId;
    constructor(message, vehicleId, featureId, details) {
        super(message, 'ACTIVATION_FAILED', 500, { vehicleId, featureId, ...details });
        this.vehicleId = vehicleId;
        this.featureId = featureId;
        this.name = 'FeatureActivationError';
    }
}
exports.FeatureActivationError = FeatureActivationError;
class FeatureDeactivationError extends FODError {
    vehicleId;
    featureId;
    constructor(message, vehicleId, featureId, details) {
        super(message, 'DEACTIVATION_FAILED', 500, { vehicleId, featureId, ...details });
        this.vehicleId = vehicleId;
        this.featureId = featureId;
        this.name = 'FeatureDeactivationError';
    }
}
exports.FeatureDeactivationError = FeatureDeactivationError;
/**
 * Message-related errors
 */
class InvalidMessageError extends FODError {
    constructor(reason, details) {
        super(`Invalid message: ${reason}`, 'INVALID_MESSAGE', 400, details);
        this.name = 'InvalidMessageError';
    }
}
exports.InvalidMessageError = InvalidMessageError;
class MessageSignatureError extends FODError {
    constructor(reason) {
        super(`Message signature verification failed: ${reason}`, 'INVALID_SIGNATURE', 401, { reason });
        this.name = 'MessageSignatureError';
    }
}
exports.MessageSignatureError = MessageSignatureError;
class MessageExpiredError extends FODError {
    constructor(timestamp) {
        super(`Message has expired: ${timestamp}`, 'MESSAGE_EXPIRED', 400, { timestamp });
        this.name = 'MessageExpiredError';
    }
}
exports.MessageExpiredError = MessageExpiredError;
/**
 * Database-related errors
 */
class DatabaseError extends FODError {
    constructor(operation, reason, details) {
        super(`Database operation failed: ${operation} - ${reason}`, 'DATABASE_ERROR', 500, {
            operation,
            reason,
            ...details,
        });
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class DatabaseConnectionError extends FODError {
    constructor(reason) {
        super(`Database connection failed: ${reason}`, 'DATABASE_CONNECTION_ERROR', 503, { reason });
        this.name = 'DatabaseConnectionError';
    }
}
exports.DatabaseConnectionError = DatabaseConnectionError;
/**
 * Validation errors
 */
class ValidationError extends FODError {
    constructor(field, reason) {
        super(`Validation failed for ${field}: ${reason}`, 'VALIDATION_ERROR', 400, { field, reason });
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Vehicle-related errors
 */
class VehicleNotFoundError extends FODError {
    constructor(vehicleId) {
        super(`Vehicle not found: ${vehicleId}`, 'VEHICLE_NOT_FOUND', 404, { vehicleId });
        this.name = 'VehicleNotFoundError';
    }
}
exports.VehicleNotFoundError = VehicleNotFoundError;
class VehicleOfflineError extends FODError {
    constructor(vehicleId) {
        super(`Vehicle is offline: ${vehicleId}`, 'VEHICLE_OFFLINE', 503, { vehicleId });
        this.name = 'VehicleOfflineError';
    }
}
exports.VehicleOfflineError = VehicleOfflineError;
/**
 * Helper function to check if error is a FOD error
 */
function isFODError(error) {
    return error instanceof FODError;
}
/**
 * Helper function to convert any error to FOD error
 */
function toFODError(error) {
    if (isFODError(error)) {
        return error;
    }
    if (error instanceof Error) {
        return new FODError(error.message, 'INTERNAL_ERROR', 500, { originalError: error.name });
    }
    return new FODError('An unknown error occurred', 'UNKNOWN_ERROR', 500, { error: String(error) });
}
//# sourceMappingURL=Errors.js.map