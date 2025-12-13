/**
 * Deactivation Handler Lambda Function
 * Handles feature deactivation - sends deactivation message to vehicle via IoT Core
 */

import { SQSEvent, SQSRecord } from 'aws-lambda';
import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane';
import { SubscriptionRepository } from '../../shared/repositories/SubscriptionRepository';
import { TelemetryRepository } from '../../shared/repositories/TelemetryRepository';
import {
  createFeatureDeactivationMessage,
  FeatureDeactivationMessage,
} from '../../shared/models/Messages';
import { signAndAddSignature, generateMessageId } from '../../shared/utils/signing';
import { SubscriptionNotFoundError, FeatureDeactivationError } from '../../shared/models/Errors';

// Initialize AWS IoT Data Plane client
const iotClient = new IoTDataPlaneClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Initialize repositories
const subscriptionRepo = new SubscriptionRepository();
const telemetryRepo = new TelemetryRepository();

/**
 * Deactivation request interface (from SQS message)
 */
interface DeactivationRequest {
  subscriptionId: string;
  vehicleId: string;
  featureId: string;
  reason: 'EXPIRED' | 'REVOKED' | 'USER_REQUESTED' | 'DOWNGRADE';
}

/**
 * Signed message interface
 */
interface SignedMessage {
  messageId: string;
  signature: string;
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
 * Publish deactivation message to IoT Core
 */
async function publishDeactivationMessage(
  vehicleId: string,
  message: FeatureDeactivationMessage
): Promise<void> {
  const topic = `vehicle/${vehicleId}/feature/deactivation`;

  try {
    const command = new PublishCommand({
      topic,
      payload: Buffer.from(JSON.stringify(message)),
      qos: 1, // At least once delivery
    });

    await iotClient.send(command);
    // eslint-disable-next-line no-console
    console.log(`Deactivation message published to topic: ${topic}`);
  } catch (error: unknown) {
    console.error('Failed to publish to IoT Core:', error);
    throw new FeatureDeactivationError(
      `Failed to publish deactivation message: ${getErrorMessage(error)}`,
      vehicleId,
      message.payload.featureId
    );
  }
}

/**
 * Process single deactivation request
 */
async function processDeactivation(request: DeactivationRequest): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Processing deactivation:', request);

  try {
    // 1. Validate subscription exists
    const subscription = await subscriptionRepo.findById(request.subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError(request.subscriptionId);
    }

    // 2. Build deactivation message
    const messageBase = createFeatureDeactivationMessage(
      request.vehicleId,
      request.featureId,
      request.reason,
      { mode: 'COMFORT' } // Default restore config
    );

    // 3. Add message ID and sign message
    const messageWithId = {
      ...messageBase,
      messageId: generateMessageId(),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const signedMessage: SignedMessage = await signAndAddSignature(messageWithId);

    // 4. Publish to IoT Core
    await publishDeactivationMessage(
      request.vehicleId,
      signedMessage as unknown as FeatureDeactivationMessage
    );

    // 5. Update subscription status based on reason
    if (request.reason === 'EXPIRED') {
      await subscriptionRepo.markExpired(request.subscriptionId);
    } else {
      await subscriptionRepo.deactivate(request.subscriptionId);
    }

    // 6. Log telemetry
    await telemetryRepo.logDeactivation(request.vehicleId, request.featureId, {
      subscriptionId: request.subscriptionId,
      reason: request.reason,
      messageId: signedMessage.messageId,
    });

    // eslint-disable-next-line no-console
    console.log('Deactivation processed successfully:', request.subscriptionId);
  } catch (error: unknown) {
    console.error('Deactivation failed:', error);

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
  console.log('Deactivation handler triggered:', JSON.stringify(event));

  const results = await Promise.allSettled(
    event.Records.map(async (record: SQSRecord) => {
      try {
        const request = JSON.parse(record.body) as DeactivationRequest;
        await processDeactivation(request);
      } catch (error: unknown) {
        console.error('Failed to process deactivation record:', error);
        throw error; // Re-throw to mark message as failed in SQS
      }
    })
  );

  // Log summary
  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  // eslint-disable-next-line no-console
  console.log(`Deactivation batch complete: ${successful} successful, ${failed} failed`);

  // If any failed, throw error to trigger SQS retry
  if (failed > 0) {
    throw new Error(`${failed} deactivation(s) failed`);
  }
}
