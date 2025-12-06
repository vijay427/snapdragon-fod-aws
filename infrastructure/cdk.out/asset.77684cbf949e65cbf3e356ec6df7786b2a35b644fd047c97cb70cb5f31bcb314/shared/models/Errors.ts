/**
 * Custom Error Types for FOD System
 * Provides structured error handling with error codes
 */

/**
 * Base error class for FOD system
 */
export class FODError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, any>
  ) {
    super(message);
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

/**
 * Feature-related errors
 */
export class FeatureNotFoundError extends FODError {
  constructor(featureId: string) {
    super(
      `Feature not found: ${featureId}`,
      'FEATURE_NOT_FOUND',
      404,
      { featureId }
    );
    this.name = 'FeatureNotFoundError';
  }
}

export class FeatureNotAvailableError extends FODError {
  constructor(featureId: string) {
    super(
      `Feature not available for purchase: ${featureId}`,
      'FEATURE_NOT_AVAILABLE',
      400,
      { featureId }
    );
    this.name = 'FeatureNotAvailableError';
  }
}

/**
 * Subscription-related errors
 */
export class SubscriptionNotFoundError extends FODError {
  constructor(subscriptionId: string) {
    super(
      `Subscription not found: ${subscriptionId}`,
      'SUBSCRIPTION_NOT_FOUND',
      404,
      { subscriptionId }
    );
    this.name = 'SubscriptionNotFoundError';
  }
}

export class DuplicateSubscriptionError extends FODError {
  constructor(vehicleId: string, featureId: string) {
    super(
      `Vehicle already has an active subscription for this feature`,
      'DUPLICATE_SUBSCRIPTION',
      409,
      { vehicleId, featureId }
    );
    this.name = 'DuplicateSubscriptionError';
  }
}

export class SubscriptionExpiredError extends FODError {
  constructor(subscriptionId: string) {
    super(
      `Subscription has expired: ${subscriptionId}`,
      'SUBSCRIPTION_EXPIRED',
      400,
      { subscriptionId }
    );
    this.name = 'SubscriptionExpiredError';
  }
}

/**
 * Transaction-related errors
 */
export class TransactionNotFoundError extends FODError {
  constructor(transactionId: string) {
    super(
      `Transaction not found: ${transactionId}`,
      'TRANSACTION_NOT_FOUND',
      404,
      { transactionId }
    );
    this.name = 'TransactionNotFoundError';
  }
}

export class PaymentFailedError extends FODError {
  constructor(reason: string, details?: Record<string, any>) {
    super(
      `Payment failed: ${reason}`,
      'PAYMENT_FAILED',
      402,
      details
    );
    this.name = 'PaymentFailedError';
  }
}

export class InsufficientFundsError extends FODError {
  constructor(required: number, available: number) {
    super(
      `Insufficient funds: required ${required}, available ${available}`,
      'INSUFFICIENT_FUNDS',
      402,
      { required, available }
    );
    this.name = 'InsufficientFundsError';
  }
}

/**
 * Activation-related errors
 */
export class FeatureActivationError extends FODError {
  constructor(
    message: string,
    public readonly vehicleId: string,
    public readonly featureId: string,
    details?: Record<string, any>
  ) {
    super(
      message,
      'ACTIVATION_FAILED',
      500,
      { vehicleId, featureId, ...details }
    );
    this.name = 'FeatureActivationError';
  }
}

export class FeatureDeactivationError extends FODError {
  constructor(
    message: string,
    public readonly vehicleId: string,
    public readonly featureId: string,
    details?: Record<string, any>
  ) {
    super(
      message,
      'DEACTIVATION_FAILED',
      500,
      { vehicleId, featureId, ...details }
    );
    this.name = 'FeatureDeactivationError';
  }
}

/**
 * Message-related errors
 */
export class InvalidMessageError extends FODError {
  constructor(reason: string, details?: Record<string, any>) {
    super(
      `Invalid message: ${reason}`,
      'INVALID_MESSAGE',
      400,
      details
    );
    this.name = 'InvalidMessageError';
  }
}

export class MessageSignatureError extends FODError {
  constructor(reason: string) {
    super(
      `Message signature verification failed: ${reason}`,
      'INVALID_SIGNATURE',
      401,
      { reason }
    );
    this.name = 'MessageSignatureError';
  }
}

export class MessageExpiredError extends FODError {
  constructor(timestamp: string) {
    super(
      `Message has expired: ${timestamp}`,
      'MESSAGE_EXPIRED',
      400,
      { timestamp }
    );
    this.name = 'MessageExpiredError';
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends FODError {
  constructor(operation: string, reason: string, details?: Record<string, any>) {
    super(
      `Database operation failed: ${operation} - ${reason}`,
      'DATABASE_ERROR',
      500,
      { operation, reason, ...details }
    );
    this.name = 'DatabaseError';
  }
}

export class DatabaseConnectionError extends FODError {
  constructor(reason: string) {
    super(
      `Database connection failed: ${reason}`,
      'DATABASE_CONNECTION_ERROR',
      503,
      { reason }
    );
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends FODError {
  constructor(field: string, reason: string) {
    super(
      `Validation failed for ${field}: ${reason}`,
      'VALIDATION_ERROR',
      400,
      { field, reason }
    );
    this.name = 'ValidationError';
  }
}

/**
 * Vehicle-related errors
 */
export class VehicleNotFoundError extends FODError {
  constructor(vehicleId: string) {
    super(
      `Vehicle not found: ${vehicleId}`,
      'VEHICLE_NOT_FOUND',
      404,
      { vehicleId }
    );
    this.name = 'VehicleNotFoundError';
  }
}

export class VehicleOfflineError extends FODError {
  constructor(vehicleId: string) {
    super(
      `Vehicle is offline: ${vehicleId}`,
      'VEHICLE_OFFLINE',
      503,
      { vehicleId }
    );
    this.name = 'VehicleOfflineError';
  }
}

/**
 * Helper function to check if error is a FOD error
 */
export function isFODError(error: any): error is FODError {
  return error instanceof FODError;
}

/**
 * Helper function to convert any error to FOD error
 */
export function toFODError(error: any): FODError {
  if (isFODError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new FODError(
      error.message,
      'INTERNAL_ERROR',
      500,
      { originalError: error.name }
    );
  }

  return new FODError(
    'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    { error: String(error) }
  );
}
