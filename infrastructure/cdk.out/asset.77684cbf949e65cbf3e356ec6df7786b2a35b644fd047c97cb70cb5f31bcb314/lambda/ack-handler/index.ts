/**
 * ACK Handler Lambda Function
 * Handles acknowledgment messages from vehicles via IoT Core
 */

import { IoTEvent } from 'aws-lambda';
import { SubscriptionRepository } from '../../shared/repositories/SubscriptionRepository';
import { TelemetryRepository } from '../../shared/repositories/TelemetryRepository';
import {
  FeatureActivationAckMessage,
  FeatureDeactivationAckMessage,
  validateBaseMessage,
} from '../../shared/models/Messages';
import { verifyMessage } from '../../shared/utils/signing';
import {
  SubscriptionNotFoundError,
  MessageSignatureError,
  InvalidMessageError,
} from '../../shared/models/Errors';

// Initialize repositories
const subscriptionRepo = new SubscriptionRepository();
const telemetryRepo = new TelemetryRepository();

/**
 * Process activation acknowledgment
 */
async function processActivationAck(message: FeatureActivationAckMessage): Promise<void> {
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
      console.log(`Subscription activated: ${subscription.subscriptionId}`);

      // Log success telemetry
      await telemetryRepo.logActivation(vehicleId, featureId, {
        subscriptionId: subscription.subscriptionId,
        activatedAt,
        messageId: message.messageId,
      });
    } else if (status === 'FAILED') {
      await subscriptionRepo.markFailed(subscription.subscriptionId);
      console.error(`Activation failed: ${errorCode} - ${errorMessage}`);

      // Log failure telemetry
      await telemetryRepo.logError(vehicleId, featureId, {
        subscriptionId: subscription.subscriptionId,
        errorCode,
        errorMessage,
        messageId: message.messageId,
      });
    } else if (status === 'PARTIAL') {
      // Partial success - mark as active but log warning
      await subscriptionRepo.activate(subscription.subscriptionId);
      console.warn(`Partial activation: ${errorMessage}`);

      await telemetryRepo.logActivation(vehicleId, featureId, {
        subscriptionId: subscription.subscriptionId,
        status: 'PARTIAL',
        warning: errorMessage,
        messageId: message.messageId,
      });
    }
  } catch (error: any) {
    console.error('Failed to process activation ACK:', error);
    throw error;
  }
}

/**
 * Process deactivation acknowledgment
 */
async function processDeactivationAck(message: FeatureDeactivationAckMessage): Promise<void> {
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
      console.log(`Subscription deactivated: ${subscription.subscriptionId}`);

      // Log success telemetry
      await telemetryRepo.logDeactivation(vehicleId, featureId, {
        subscriptionId: subscription.subscriptionId,
        deactivatedAt,
        messageId: message.messageId,
      });
    } else if (status === 'FAILED') {
      console.error(`Deactivation failed: ${errorCode} - ${errorMessage}`);

      // Log failure telemetry
      await telemetryRepo.logError(vehicleId, featureId, {
        subscriptionId: subscription.subscriptionId,
        errorCode,
        errorMessage,
        messageId: message.messageId,
      });
    }
  } catch (error: any) {
    console.error('Failed to process deactivation ACK:', error);
    throw error;
  }
}

/**
 * Main Lambda handler (triggered by IoT Core rule)
 */
export async function handler(event: any): Promise<void> {
  console.log('ACK handler triggered:', JSON.stringify(event));

  try {
    // Parse message from IoT Core event
    const message = typeof event === 'string' ? JSON.parse(event) : event;

    // Validate base message structure
    if (!validateBaseMessage(message)) {
      throw new InvalidMessageError('Invalid message structure');
    }

    // Verify message signature
    const isValid = await verifyMessage(message);
    if (!isValid) {
      throw new MessageSignatureError('Signature verification failed');
    }

    // Route based on message type
    switch (message.messageType) {
      case 'FEATURE_ACTIVATION_ACK':
        await processActivationAck(message as FeatureActivationAckMessage);
        break;

      case 'FEATURE_DEACTIVATION_ACK':
        await processDeactivationAck(message as FeatureDeactivationAckMessage);
        break;

      default:
        console.warn(`Unknown message type: ${message.messageType}`);
    }

    console.log('ACK processed successfully');
  } catch (error: any) {
    console.error('ACK processing failed:', error);
    throw error;
  }
}
