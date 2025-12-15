/**
 * Activation Handler Lambda Function
 * Handles feature activation after purchase - sends activation message to vehicle via IoT Core
 */

import { SQSEvent, SQSRecord } from 'aws-lambda';
import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';
import { FeatureRepository } from '../../shared/repositories/FeatureRepository';
import { SubscriptionRepository } from '../../shared/repositories/SubscriptionRepository';
import { TelemetryRepository } from '../../shared/repositories/TelemetryRepository';
import { Feature } from '../../shared/models/Feature';
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
 * Signed message interface
 */
interface SignedMessage {
  messageId: string;
  signature: string;
  timestamp: string;
  vehicleId: string;
  messageType: string;
  payload: unknown;
}

/**
 * Activation configuration interface matching FeatureActivationMessage
 */
type ActivationConfig = FeatureActivationMessage['payload']['activationConfig'];

/**
 * Valid tier values
 */
const VALID_TIERS = ['4G', '5G'] as const;
type TierType = (typeof VALID_TIERS)[number];

/**
 * Valid mode values
 */
const VALID_MODES = ['SPORT', 'ECO', 'COMFORT'] as const;
type ModeType = (typeof VALID_MODES)[number];

/**
 * Type guard for tier values
 */
function isValidTier(value: unknown): value is TierType {
  return typeof value === 'string' && VALID_TIERS.includes(value as TierType);
}

/**
 * Type guard for mode values
 */
function isValidMode(value: unknown): value is ModeType {
  return typeof value === 'string' && VALID_MODES.includes(value as ModeType);
}

/**
 * Get error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Build activation configuration based on feature metadata
 */
function buildActivationConfig(feature: Feature): ActivationConfig {
  const config: ActivationConfig = {};
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
    // eslint-disable-next-line no-console
    console.log(`Activation message published to topic: ${topic}`);
  } catch (error: unknown) {
    console.error('Failed to publish to IoT Core:', error);
    throw new FeatureActivationError(
      `Failed to publish activation message: ${getErrorMessage(error)}`,
      vehicleId,
      message.payload.featureId
    );
  }
}

/**
 * Process single activation request
 */
async function processActivation(request: ActivationRequest): Promise<void> {
  // eslint-disable-next-line no-console
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const signedMessage: SignedMessage = await signAndAddSignature(messageWithId);

    // 5. Publish to IoT Core
    await publishActivationMessage(
      request.vehicleId,
      signedMessage as unknown as FeatureActivationMessage
    );

    // 6. Log telemetry
    await telemetryRepo.logActivation(request.vehicleId, request.featureId, {
      subscriptionId: request.subscriptionId,
      messageId: signedMessage.messageId,
    });

    // eslint-disable-next-line no-console
    console.log('Activation processed successfully:', request.subscriptionId);
  } catch (error: unknown) {
    console.error('Activation failed:', error);

    // Mark subscription as failed
    try {
      await subscriptionRepo.markFailed(request.subscriptionId);
    } catch (updateError: unknown) {
      console.error('Failed to update subscription status:', updateError);
    }

    // Log error telemetry
    try {
      await telemetryRepo.logError(request.vehicleId, request.featureId, error);
    } catch (telemetryError: unknown) {
      console.error('Failed to log error telemetry:', telemetryError);
    }

    throw error;
  }
}

/**
 * Main Lambda handler (triggered by SQS)
 */
export async function handler(event: SQSEvent): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Activation handler triggered:', JSON.stringify(event));
  // eslint-disable-next-line no-console
  console.log('Activation Handler v1.0.1 - Deployed:', new Date().toISOString());

  const results = await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      try {
        const request = JSON.parse(record.body) as ActivationRequest;
        await processActivation(request);
      } catch (error: unknown) {
        console.error('Failed to process activation record:', error);
        throw error; // Re-throw to mark message as failed in SQS
      }
    })
  );

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
