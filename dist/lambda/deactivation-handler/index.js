"use strict";
/**
 * Deactivation Handler Lambda Function
 * Handles feature deactivation - sends deactivation message to vehicle via IoT Core
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
 * Publish deactivation message to IoT Core
 */
async function publishDeactivationMessage(vehicleId, message) {
    const topic = `vehicle/${vehicleId}/feature/deactivation`;
    try {
        const command = new client_iot_data_plane_1.PublishCommand({
            topic,
            payload: Buffer.from(JSON.stringify(message)),
            qos: 1, // At least once delivery
        });
        await iotClient.send(command);
        console.log(`Deactivation message published to topic: ${topic}`);
    }
    catch (error) {
        console.error('Failed to publish to IoT Core:', error);
        throw new Errors_1.FeatureDeactivationError(`Failed to publish deactivation message: ${error.message}`, vehicleId, message.payload.featureId);
    }
}
/**
 * Process single deactivation request
 */
async function processDeactivation(request) {
    console.log('Processing deactivation:', request);
    try {
        // 1. Validate subscription exists
        const subscription = await subscriptionRepo.findById(request.subscriptionId);
        if (!subscription) {
            throw new Errors_1.SubscriptionNotFoundError(request.subscriptionId);
        }
        // 2. Build deactivation message
        const messageBase = (0, Messages_1.createFeatureDeactivationMessage)(request.vehicleId, request.featureId, request.reason, { mode: 'COMFORT' } // Default restore config
        );
        // 3. Add message ID and sign message
        const messageWithId = {
            ...messageBase,
            messageId: (0, signing_1.generateMessageId)(),
        };
        const signedMessage = await (0, signing_1.signAndAddSignature)(messageWithId);
        // 4. Publish to IoT Core
        await publishDeactivationMessage(request.vehicleId, signedMessage);
        // 5. Update subscription status based on reason
        if (request.reason === 'EXPIRED') {
            await subscriptionRepo.markExpired(request.subscriptionId);
        }
        else {
            await subscriptionRepo.deactivate(request.subscriptionId);
        }
        // 6. Log telemetry
        await telemetryRepo.logDeactivation(request.vehicleId, request.featureId, {
            subscriptionId: request.subscriptionId,
            reason: request.reason,
            messageId: signedMessage.messageId,
        });
        console.log('Deactivation processed successfully:', request.subscriptionId);
    }
    catch (error) {
        console.error('Deactivation failed:', error);
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
    console.log('Deactivation handler triggered:', JSON.stringify(event));
    const results = await Promise.allSettled(event.Records.map(async (record) => {
        try {
            const request = JSON.parse(record.body);
            await processDeactivation(request);
        }
        catch (error) {
            console.error('Failed to process deactivation record:', error);
            throw error; // Re-throw to mark message as failed in SQS
        }
    }));
    // Log summary
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(`Deactivation batch complete: ${successful} successful, ${failed} failed`);
    // If any failed, throw error to trigger SQS retry
    if (failed > 0) {
        throw new Error(`${failed} deactivation(s) failed`);
    }
}
//# sourceMappingURL=index.js.map