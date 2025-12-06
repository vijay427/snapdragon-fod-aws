"use strict";
/**
 * Purchase Handler Lambda Function
 * Handles feature purchase requests from API Gateway
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const uuid_1 = require("uuid");
const FeatureRepository_1 = require("../../shared/repositories/FeatureRepository");
const SubscriptionRepository_1 = require("../../shared/repositories/SubscriptionRepository");
const TransactionRepository_1 = require("../../shared/repositories/TransactionRepository");
const TelemetryRepository_1 = require("../../shared/repositories/TelemetryRepository");
const Subscription_1 = require("../../shared/models/Subscription");
const Transaction_1 = require("../../shared/models/Transaction");
const Errors_1 = require("../../shared/models/Errors");
// Initialize repositories
const featureRepo = new FeatureRepository_1.FeatureRepository();
const subscriptionRepo = new SubscriptionRepository_1.SubscriptionRepository();
const transactionRepo = new TransactionRepository_1.TransactionRepository();
const telemetryRepo = new TelemetryRepository_1.TelemetryRepository();
/**
 * Validate purchase request
 */
function validatePurchaseRequest(body) {
    if (!body.vehicleId || typeof body.vehicleId !== 'string') {
        throw new Errors_1.ValidationError('vehicleId', 'Vehicle ID is required');
    }
    if (!body.featureId || typeof body.featureId !== 'string') {
        throw new Errors_1.ValidationError('featureId', 'Feature ID is required');
    }
    if (!body.paymentMethod || typeof body.paymentMethod !== 'string') {
        throw new Errors_1.ValidationError('paymentMethod', 'Payment method is required');
    }
    return {
        vehicleId: body.vehicleId.trim(),
        featureId: body.featureId.trim(),
        paymentMethod: body.paymentMethod.trim(),
        paymentToken: body.paymentToken,
    };
}
/**
 * Process payment (mock implementation)
 */
async function processPayment(amount, paymentMethod, paymentToken) {
    // In production, integrate with payment gateway (Stripe, PayPal, etc.)
    console.log('Processing payment:', { amount, paymentMethod, paymentToken });
    // Mock payment processing
    if (amount <= 0) {
        throw new Errors_1.PaymentFailedError('Invalid amount');
    }
    // Simulate payment success (90% success rate for testing)
    const success = Math.random() > 0.1;
    if (!success) {
        throw new Errors_1.PaymentFailedError('Payment declined by processor');
    }
    return true;
}
/**
 * Main Lambda handler
 */
async function handler(event) {
    console.log('Purchase request received:', JSON.stringify(event));
    try {
        // Parse and validate request body
        if (!event.body) {
            throw new Errors_1.ValidationError('body', 'Request body is required');
        }
        const body = JSON.parse(event.body);
        const request = validatePurchaseRequest(body);
        console.log('Processing purchase:', request);
        // 1. Validate feature exists and is available
        const feature = await featureRepo.findById(request.featureId);
        if (!feature) {
            throw new Errors_1.FeatureNotFoundError(request.featureId);
        }
        if (!feature.isActive) {
            throw new Errors_1.FeatureNotAvailableError(request.featureId);
        }
        // 2. Check for duplicate subscription
        const hasExisting = await subscriptionRepo.hasActiveSubscription(request.vehicleId, request.featureId);
        if (hasExisting) {
            throw new Errors_1.DuplicateSubscriptionError(request.vehicleId, request.featureId);
        }
        // 3. Create transaction record
        const transactionId = `txn_${(0, uuid_1.v4)()}`;
        const transaction = (0, Transaction_1.createTransaction)({
            transactionId,
            vehicleId: request.vehicleId,
            featureId: request.featureId,
            amount: feature.price,
            status: 'PENDING',
            paymentMethod: request.paymentMethod,
            timestamp: new Date(),
        });
        await transactionRepo.create(transaction);
        console.log('Transaction created:', transactionId);
        // 4. Process payment
        try {
            await processPayment(feature.price, request.paymentMethod, request.paymentToken);
            console.log('Payment processed successfully');
        }
        catch (error) {
            // Mark transaction as failed
            await transactionRepo.markFailed(transactionId);
            throw error;
        }
        // 5. Create subscription
        const subscriptionId = `sub_${(0, uuid_1.v4)()}`;
        const expiresAt = feature.duration > 0
            ? new Date(Date.now() + feature.duration * 60 * 60 * 1000)
            : undefined;
        const subscription = (0, Subscription_1.createSubscription)({
            subscriptionId,
            vehicleId: request.vehicleId,
            featureId: request.featureId,
            status: 'PENDING',
            purchasedAt: new Date(),
            expiresAt,
            isPermanent: feature.duration === 0,
        });
        await subscriptionRepo.create(subscription);
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
    }
    catch (error) {
        console.error('Purchase failed:', error);
        // Convert to FOD error if needed
        const fodError = (0, Errors_1.isFODError)(error) ? error : (0, Errors_1.toFODError)(error);
        // Log error telemetry if we have vehicle context
        try {
            const body = event.body ? JSON.parse(event.body) : {};
            if (body.vehicleId && body.featureId) {
                await telemetryRepo.logError(body.vehicleId, body.featureId, fodError);
            }
        }
        catch (telemetryError) {
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
//# sourceMappingURL=index.js.map