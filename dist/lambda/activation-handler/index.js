"use strict";
/**
 * Activation Handler Lambda Function
 * Handles feature activation after purchase - sends activation message to vehicle via IoT Core
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const client_iot_data_plane_1 = require("@aws-sdk/client-iot-data-plane");
const FeatureRepository_1 = require("../../shared/repositories/FeatureRepository");
const SubscriptionRepository_1 = require("../../shared/repositories/SubscriptionRepository");
const TelemetryRepository_1 = require("../../shared/repositories/TelemetryRepository");
const Messages_1 = require("../../shared/models/Messages");
const signing_1 = require("../../shared/utils/signing");
const Errors_1 = require("../../shared/models/Errors");
// Initialize AWS IoT Data Plane client
const iotClient = new client_iot_data_plane_1.IoTDataPlaneClient({
    region: process.env.AWS_REGION || 'us-east-1',
});
// Initialize repositories
const featureRepo = new FeatureRepository_1.FeatureRepository();
const subscriptionRepo = new SubscriptionRepository_1.SubscriptionRepository();
const telemetryRepo = new TelemetryRepository_1.TelemetryRepository();
/**
 * Valid tier values
 */
const VALID_TIERS = ['4G', '5G'];
/**
 * Valid mode values
 */
const VALID_MODES = ['SPORT', 'ECO', 'COMFORT'];
/**
 * Type guard for tier values
 */
function isValidTier(value) {
    return typeof value === 'string' && VALID_TIERS.includes(value);
}
/**
 * Type guard for mode values
 */
function isValidMode(value) {
    return typeof value === 'string' && VALID_MODES.includes(value);
}
/**
 * Get error message from unknown error
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
/**
 * Build activation configuration based on feature metadata
 */
function buildActivationConfig(feature) {
    const config = {};
    const metadata = feature.metadata;
    if (metadata) {
        // Connectivity tier configuration
        if (isValidTier(metadata['tier'])) {
            config.tier = metadata['tier'];
        }
        // Performance mode configuration
        if (isValidMode(metadata['mode'])) {
            config.mode = metadata['mode'];
        }
        // Additional parameters
        const knownKeys = ['tier', 'mode', 'throttleResponse', 'suspensionStiffness', 'steeringWeight'];
        if (typeof metadata['throttleResponse'] === 'string') {
            config.parameters = config.parameters ?? {};
            config.parameters['throttleResponse'] = metadata['throttleResponse'];
        }
        if (typeof metadata['suspensionStiffness'] === 'string') {
            config.parameters = config.parameters ?? {};
            config.parameters['suspensionStiffness'] = metadata['suspensionStiffness'];
        }
        if (typeof metadata['steeringWeight'] === 'string') {
            config.parameters = config.parameters ?? {};
            config.parameters['steeringWeight'] = metadata['steeringWeight'];
        }
        // Copy any other metadata parameters
        Object.keys(metadata).forEach((key) => {
            if (!knownKeys.includes(key)) {
                config.parameters = config.parameters ?? {};
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                config.parameters[key] = metadata[key];
            }
        });
    }
    return config;
}
/**
 * Publish activation message to IoT Core
 */
async function publishActivationMessage(vehicleId, message) {
    const topic = `vehicle/${vehicleId}/feature/activation`;
    try {
        const command = new client_iot_data_plane_1.PublishCommand({
            topic,
            payload: Buffer.from(JSON.stringify(message)),
            qos: 1, // At least once delivery
        });
        await iotClient.send(command);
        // eslint-disable-next-line no-console
        console.log(`Activation message published to topic: ${topic}`);
    }
    catch (error) {
        console.error('Failed to publish to IoT Core:', error);
        throw new Errors_1.FeatureActivationError(`Failed to publish activation message: ${getErrorMessage(error)}`, vehicleId, message.payload.featureId);
    }
}
/**
 * Process single activation request
 */
async function processActivation(request) {
    // eslint-disable-next-line no-console
    console.log('Processing activation:', request);
    try {
        // 1. Validate subscription exists
        const subscription = await subscriptionRepo.findById(request.subscriptionId);
        if (!subscription) {
            throw new Errors_1.SubscriptionNotFoundError(request.subscriptionId);
        }
        // 2. Validate feature exists
        const feature = await featureRepo.findById(request.featureId);
        if (!feature) {
            throw new Errors_1.FeatureNotFoundError(request.featureId);
        }
        // 3. Build activation message
        const activationConfig = buildActivationConfig(feature);
        const messageBase = (0, Messages_1.createFeatureActivationMessage)(request.vehicleId, request.featureId, feature.featureType, activationConfig, subscription.isPermanent, subscription.expiresAt);
        // 4. Add message ID and sign message
        const messageWithId = {
            ...messageBase,
            messageId: (0, signing_1.generateMessageId)(),
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const signedMessage = await (0, signing_1.signAndAddSignature)(messageWithId);
        // 5. Publish to IoT Core
        await publishActivationMessage(request.vehicleId, signedMessage);
        // 6. Log telemetry
        await telemetryRepo.logActivation(request.vehicleId, request.featureId, {
            subscriptionId: request.subscriptionId,
            messageId: signedMessage.messageId,
        });
        // eslint-disable-next-line no-console
        console.log('Activation processed successfully:', request.subscriptionId);
    }
    catch (error) {
        console.error('Activation failed:', error);
        // Mark subscription as failed
        try {
            await subscriptionRepo.markFailed(request.subscriptionId);
        }
        catch (updateError) {
            console.error('Failed to update subscription status:', updateError);
        }
        // Log error telemetry
        try {
            await telemetryRepo.logError(request.vehicleId, request.featureId, error);
        }
        catch (telemetryError) {
            console.error('Failed to log error telemetry:', telemetryError);
        }
        throw error;
    }
}
/**
 * Main Lambda handler (triggered by SQS)
 */
async function handler(event) {
    // eslint-disable-next-line no-console
    console.log('Activation handler triggered:', JSON.stringify(event));
    // eslint-disable-next-line no-console
    console.log('Activation Handler v1.0.2 - Pipeline Fixed:', new Date().toISOString());
    const results = await Promise.allSettled(event.Records.map(async (record) => {
        try {
            const request = JSON.parse(record.body);
            await processActivation(request);
        }
        catch (error) {
            console.error('Failed to process activation record:', error);
            throw error; // Re-throw to mark message as failed in SQS
        }
    }));
    // Log summary
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    // eslint-disable-next-line no-console
    console.log(`Activation batch complete: ${successful} successful, ${failed} failed`);
    // If any failed, throw error to trigger SQS retry
    if (failed > 0) {
        throw new Error(`${failed} activation(s) failed`);
    }
}
//# sourceMappingURL=index.js.map