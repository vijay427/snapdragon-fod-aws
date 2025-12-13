/**
 * Purchase Handler Lambda Function
 * Handles feature purchase requests from API Gateway
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { FeatureRepository } from '../../shared/repositories/FeatureRepository';
import { SubscriptionRepository } from '../../shared/repositories/SubscriptionRepository';
import { TransactionRepository } from '../../shared/repositories/TransactionRepository';
import { TelemetryRepository } from '../../shared/repositories/TelemetryRepository';
import { createSubscription } from '../../shared/models/Subscription';
import { createTransaction } from '../../shared/models/Transaction';
import {
  FeatureNotFoundError,
  FeatureNotAvailableError,
  DuplicateSubscriptionError,
  PaymentFailedError,
  ValidationError,
  isFODError,
  toFODError,
} from '../../shared/models/Errors';

// Initialize repositories
const featureRepo = new FeatureRepository();
const subscriptionRepo = new SubscriptionRepository();
const transactionRepo = new TransactionRepository();
const telemetryRepo = new TelemetryRepository();

/**
 * Purchase request interface
 */
interface PurchaseRequest {
  vehicleId: string;
  featureId: string;
  paymentMethod: string;
  paymentToken?: string;
}

/**
 * Request body interface
 */
interface RequestBody {
  vehicleId?: unknown;
  featureId?: unknown;
  paymentMethod?: unknown;
  paymentToken?: unknown;
}

/**
 * Validate purchase request
 */
function validatePurchaseRequest(body: RequestBody): PurchaseRequest {
  if (!body.vehicleId || typeof body.vehicleId !== 'string') {
    throw new ValidationError('vehicleId', 'Vehicle ID is required');
  }

  if (!body.featureId || typeof body.featureId !== 'string') {
    throw new ValidationError('featureId', 'Feature ID is required');
  }

  if (!body.paymentMethod || typeof body.paymentMethod !== 'string') {
    throw new ValidationError('paymentMethod', 'Payment method is required');
  }

  return {
    vehicleId: body.vehicleId.trim(),
    featureId: body.featureId.trim(),
    paymentMethod: body.paymentMethod.trim(),
    paymentToken: typeof body.paymentToken === 'string' ? body.paymentToken : undefined,
  };
}

/**
 * Process payment (mock implementation)
 */
function processPayment(amount: number, paymentMethod: string, paymentToken?: string): boolean {
  // In production, integrate with payment gateway (Stripe, PayPal, etc.)
  // eslint-disable-next-line no-console
  console.log('Processing payment:', { amount, paymentMethod, paymentToken });

  // Mock payment processing
  if (amount <= 0) {
    throw new PaymentFailedError('Invalid amount');
  }

  // Simulate payment success (90% success rate for testing)
  const success = Math.random() > 0.1;
  if (!success) {
    throw new PaymentFailedError('Payment declined by processor');
  }

  return true;
}

/**
 * Main Lambda handler
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // eslint-disable-next-line no-console
  console.log('Purchase request received:', JSON.stringify(event));

  try {
    // Parse and validate request body
    if (!event.body) {
      throw new ValidationError('body', 'Request body is required');
    }

    const body = JSON.parse(event.body) as RequestBody;
    const request = validatePurchaseRequest(body);

    // eslint-disable-next-line no-console
    console.log('Processing purchase:', request);

    // 1. Validate feature exists and is available
    const feature = await featureRepo.findById(request.featureId);
    if (!feature) {
      throw new FeatureNotFoundError(request.featureId);
    }

    if (!feature.isActive) {
      throw new FeatureNotAvailableError(request.featureId);
    }

    // 2. Check for duplicate subscription
    const hasExisting = await subscriptionRepo.hasActiveSubscription(
      request.vehicleId,
      request.featureId
    );

    if (hasExisting) {
      throw new DuplicateSubscriptionError(request.vehicleId, request.featureId);
    }

    // 3. Create transaction record
    const transactionId = `txn_${uuidv4()}`;
    const transaction = createTransaction({
      transactionId,
      vehicleId: request.vehicleId,
      featureId: request.featureId,
      amount: feature.price,
      status: 'PENDING',
      paymentMethod: request.paymentMethod,
      timestamp: new Date(),
    });

    await transactionRepo.create(transaction);
    // eslint-disable-next-line no-console
    console.log('Transaction created:', transactionId);

    // 4. Process payment
    try {
      processPayment(feature.price, request.paymentMethod, request.paymentToken);
      // eslint-disable-next-line no-console
      console.log('Payment processed successfully');
    } catch (error: unknown) {
      // Mark transaction as failed
      await transactionRepo.markFailed(transactionId);
      throw error;
    }

    // 5. Create subscription
    const subscriptionId = `sub_${uuidv4()}`;
    const expiresAt =
      feature.duration > 0 ? new Date(Date.now() + feature.duration * 60 * 60 * 1000) : undefined;

    const subscription = createSubscription({
      subscriptionId,
      vehicleId: request.vehicleId,
      featureId: request.featureId,
      status: 'PENDING',
      purchasedAt: new Date(),
      expiresAt,
      isPermanent: feature.duration === 0,
    });

    await subscriptionRepo.create(subscription);
    // eslint-disable-next-line no-console
    console.log('Subscription created:', subscriptionId);

    // 6. Update transaction with subscription ID and mark completed
    await transactionRepo.markCompleted(transactionId, subscriptionId);

    // 7. Log telemetry
    await telemetryRepo.logEvent({
      vehicleId: request.vehicleId,
      eventType: 'FEATURE_ACTIVATED',
      featureId: request.featureId,
      timestamp: new Date(),
      metadata: {
        subscriptionId,
        transactionId,
        amount: feature.price,
      },
    });

    // 8. Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          transactionId,
          subscriptionId,
          vehicleId: request.vehicleId,
          featureId: request.featureId,
          amount: feature.price,
          status: 'PENDING',
          expiresAt: expiresAt?.toISOString(),
          isPermanent: feature.duration === 0,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: unknown) {
    console.error('Purchase failed:', error);

    // Convert to FOD error if needed
    const fodError = isFODError(error) ? error : toFODError(error);

    // Log error telemetry if we have vehicle context
    try {
      const body = event.body ? (JSON.parse(event.body) as RequestBody) : {};
      if (typeof body.vehicleId === 'string' && typeof body.featureId === 'string') {
        await telemetryRepo.logError(body.vehicleId, body.featureId, fodError);
      }
    } catch (telemetryError: unknown) {
      console.error('Failed to log error telemetry:', telemetryError);
    }

    // Return error response
    return {
      statusCode: fodError.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: fodError.code,
          message: fodError.message,
          details: fodError.details,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }
}
