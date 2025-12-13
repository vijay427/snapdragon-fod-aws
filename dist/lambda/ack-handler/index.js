"use strict";
/**
 * ACK Handler Lambda Function
 * Handles acknowledgment messages from vehicles via IoT Core
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const SubscriptionRepository_1 = require("../../shared/repositories/SubscriptionRepository");
const TelemetryRepository_1 = require("../../shared/repositories/TelemetryRepository");
const Messages_1 = require("../../shared/models/Messages");
const signing_1 = require("../../shared/utils/signing");
const Errors_1 = require("../../shared/models/Errors");
// Initialize repositories
const subscriptionRepo = new SubscriptionRepository_1.SubscriptionRepository();
const telemetryRepo = new TelemetryRepository_1.TelemetryRepository();
/**
 * Process activation acknowledgment
 */
async function processActivationAck(message) {
    // eslint-disable-next-line no-console
    console.log('Processing activation ACK:', message);
    const { vehicleId, payload } = message;
    const { featureId, status, activatedAt, errorCode, errorMessage } = payload;
    try {
        // Find subscription
        const subscription = await subscriptionRepo.findByVehicleAndFeature(vehicleId, featureId);
        if (!subscription) {
            console.warn(`Subscription not found for vehicle ${vehicleId}, feature ${featureId}`);
            return;
        }
        // Update subscription based on ACK status
        if (status === 'SUCCESS') {
            await subscriptionRepo.activate(subscription.subscriptionId);
            // eslint-disable-next-line no-console
            console.log(`Subscription activated: ${subscription.subscriptionId}`);
            // Log success telemetry
            await telemetryRepo.logActivation(vehicleId, featureId, {
                subscriptionId: subscription.subscriptionId,
                activatedAt,
                messageId: message.messageId,
            });
        }
        else if (status === 'FAILED') {
            await subscriptionRepo.markFailed(subscription.subscriptionId);
            console.error(`Activation failed: ${errorCode ?? 'UNKNOWN'} - ${errorMessage ?? 'No message'}`);
            // Log failure telemetry
            await telemetryRepo.logError(vehicleId, featureId, {
                subscriptionId: subscription.subscriptionId,
                errorCode,
                errorMessage,
                messageId: message.messageId,
            });
        }
        else if (status === 'PARTIAL') {
            // Partial success - mark as active but log warning
            await subscriptionRepo.activate(subscription.subscriptionId);
            console.warn(`Partial activation: ${errorMessage ?? 'No details'}`);
            await telemetryRepo.logActivation(vehicleId, featureId, {
                subscriptionId: subscription.subscriptionId,
                status: 'PARTIAL',
                warning: errorMessage,
                messageId: message.messageId,
            });
        }
    }
    catch (error) {
        console.error('Failed to process activation ACK:', error);
        throw error;
    }
}
/**
 * Process deactivation acknowledgment
 */
async function processDeactivationAck(message) {
    // eslint-disable-next-line no-console
    console.log('Processing deactivation ACK:', message);
    const { vehicleId, payload } = message;
    const { featureId, status, deactivatedAt, errorCode, errorMessage } = payload;
    try {
        // Find subscription
        const subscription = await subscriptionRepo.findByVehicleAndFeature(vehicleId, featureId);
        if (!subscription) {
            console.warn(`Subscription not found for vehicle ${vehicleId}, feature ${featureId}`);
            return;
        }
        // Update subscription based on ACK status
        if (status === 'SUCCESS') {
            await subscriptionRepo.deactivate(subscription.subscriptionId);
            // eslint-disable-next-line no-console
            console.log(`Subscription deactivated: ${subscription.subscriptionId}`);
            // Log success telemetry
            await telemetryRepo.logDeactivation(vehicleId, featureId, {
                subscriptionId: subscription.subscriptionId,
                deactivatedAt,
                messageId: message.messageId,
            });
        }
        else if (status === 'FAILED') {
            console.error(`Deactivation failed: ${errorCode ?? 'UNKNOWN'} - ${errorMessage ?? 'No message'}`);
            // Log failure telemetry
            await telemetryRepo.logError(vehicleId, featureId, {
                subscriptionId: subscription.subscriptionId,
                errorCode,
                errorMessage,
                messageId: message.messageId,
            });
        }
    }
    catch (error) {
        console.error('Failed to process deactivation ACK:', error);
        throw error;
    }
}
/**
 * Main Lambda handler (triggered by IoT Core rule)
 */
async function handler(event) {
    // eslint-disable-next-line no-console
    console.log('ACK handler triggered:', JSON.stringify(event));
    try {
        // Parse message from IoT Core event
        const message = typeof event === 'string' ? JSON.parse(event) : event;
        // Validate base message structure
        if (!(0, Messages_1.validateBaseMessage)(message)) {
            throw new Errors_1.InvalidMessageError('Invalid message structure');
        }
        // Verify message signature
        const isValid = await (0, signing_1.verifyMessage)(message);
        if (!isValid) {
            throw new Errors_1.MessageSignatureError('Signature verification failed');
        }
        // Route based on message type
        switch (message.messageType) {
            case 'FEATURE_ACTIVATION_ACK':
                await processActivationAck(message);
                break;
            case 'FEATURE_DEACTIVATION_ACK':
                await processDeactivationAck(message);
                break;
            default:
                console.warn(`Unknown message type: ${message.messageType}`);
        }
        // eslint-disable-next-line no-console
        console.log('ACK processed successfully');
    }
    catch (error) {
        console.error('ACK processing failed:', error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map