/**
 * Activation Handler Lambda Function
 * Handles feature activation after purchase - sends activation message to vehicle via IoT Core
 */

import { SQSEvent, SQSRecord } from 'aws-lambda';
import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';
import { FeatureRepository } from '../../shared/repositories/FeatureRepository';
import { SubscriptionRepository } from '../../shared/repositories/SubscriptionRepository';
import { TelemetryRepository } from '../../shared/repositories/TelemetryRepository';
import {
  createFeatureActivationMessage,
  FeatureActivationMessage,
  FeatureType,
} from '../../shared/models/Messages';
import { signAndAddSignature, generateMessageId } from '../../shared/utils/signing';
import {
  SubscriptionNotFoundError,
  FeatureNotFoundError,
  FeatureActivationError,
  isFODError,
} from '../../shared/models/Errors';

// Initialize AWS IoT Data Plane client
const iotClient = new IoTDataPlaneClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Initialize repositories
const featureRepo = new FeatureRepository();
const subscriptionRepo = new SubscriptionRepository();
const telemetryRepo = new TelemetryRepository();

/**
 * Activation request interface (from SQS message)
 */
interface ActivationRequest {
  subscriptionId: string;
  vehicleId: string;
  featureId: string;
}

/**
 * Build activation configuration based on feature metadata
 */
function buildActivationConfig(feature: any): any {
  const config: any = {};

  if (feature.metadata) {
    // Connectivity tier configuration
    if (feature.metadata.tier) {
      config.tier = feature.metadata.tier;
    }

    // Performance mode configuration
    if (feature.metadata.mode) {
      config.mode = feature.metadata.mode;
    }

    // Additional parameters
    if (feature.metadata.throttleResponse) {
      config.parameters = config.parameters || {};
      config.parameters.throttleResponse = feature.metadata.throttleResponse;
    }

    if (feature.metadata.suspensionStiffness) {
      config.parameters = config.parameters || {};
      config.parameters.suspensionStiffness = feature.metadata.suspensionStiffness;
    }

    if (feature.metadata.steeringWeight) {
      config.parameters = config.parameters || {};
      config.parameters.steeringWeight = feature.metadata.steeringWeight;
    }

    // Copy any other metadata parameters
    Object.keys(feature.metadata).forEach((key) => {
      if (!['tier', 'mode', 'throttleResponse', 'suspensionStiffness', 'steeringWeight'].includes(key)) {
        config.parameters = config.parameters || {};
        config.parameters[key] = feature.metadata[key];
      }
    });
  }

  return config;
}

/**
 * Publish activation message to IoT Core
 */
async function publishActivationMessage(
  vehicleId: string,
  message: FeatureActivationMessage
): Promise<void> {
  const topic = `vehicle/${vehicleId}/feature/activation`;

  try {
    const command = new PublishCommand({
      topic,
      payload: Buffer.from(JSON.stringify(message)),
      qos: 1, // At least once delivery
    });

    await iotClient.send(command);
    console.log(`Activation message published to topic: ${topic}`);
  } catch (error: any) {
    console.error('Failed to publish to IoT Core:', error);
    throw new FeatureActivationError(
      `Failed to publish activation message: ${error.message}`,
      vehicleId,
      message.payload.featureId
    );
  }
}

/**
 * Process single activation request
 */
async function processActivation(request: ActivationRequest): Promise<void> {
  console.log('Processing activation:', request);

  try {
    // 1. Validate subscription exists
    const subscription = await subscriptionRepo.findById(request.subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError(request.subscriptionId);
    }

    // 2. Validate feature exists
    const feature = await featureRepo.findById(request.featureId);
    if (!feature) {
      throw new FeatureNotFoundError(request.featureId);
    }

    // 3. Build activation message
    const activationConfig = buildActivationConfig(feature);
    const messageBase = createFeatureActivationMessage(
      request.vehicleId,
      request.featureId,
      feature.featureType as FeatureType,
      activationConfig,
      subscription.isPermanent,
      subscription.expiresAt
    );

    // 4. Add message ID and sign message
    const messageWithId = {
      ...messageBase,
      messageId: generateMessageId(),
    };

    const signedMessage = await signAndAddSignature(messageWithId);

    // 5. Publish to IoT Core
    await publishActivationMessage(request.vehicleId, signedMessage as FeatureActivationMessage);

    // 6. Log telemetry
    await telemetryRepo.logActivation(request.vehicleId, request.featureId, {
      subscriptionId: request.subscriptionId,
      messageId: signedMessage.messageId,
    });

    console.log('Activation processed successfully:', request.subscriptionId);
  } catch (error: any) {
    console.error('Activation failed:', error);

    // Mark subscription as failed
    try {
      await subscriptionRepo.markFailed(request.subscriptionId);
    } catch (updateError) {
      console.error('Failed to update subscription status:', updateError);
    }

    // Log error telemetry
    try {
      await telemetryRepo.logError(request.vehicleId, request.featureId, error);
    } catch (telemetryError) {
      console.error('Failed to log error telemetry:', telemetryError);
    }

    throw error;
  }
}

/**
 * Main Lambda handler (triggered by SQS)
 */
export async function handler(event: SQSEvent): Promise<void> {
  console.log('Activation handler triggered:', JSON.stringify(event));

  const results = await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      try {
        const request: ActivationRequest = JSON.parse(record.body);
        await processActivation(request);
      } catch (error: any) {
        console.error('Failed to process activation record:', error);
        throw error; // Re-throw to mark message as failed in SQS
      }
    })
  );

  // Log summary
  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`Activation batch complete: ${successful} successful, ${failed} failed`);

  // If any failed, throw error to trigger SQS retry
  if (failed > 0) {
    throw new Error(`${failed} activation(s) failed`);
  }
}
