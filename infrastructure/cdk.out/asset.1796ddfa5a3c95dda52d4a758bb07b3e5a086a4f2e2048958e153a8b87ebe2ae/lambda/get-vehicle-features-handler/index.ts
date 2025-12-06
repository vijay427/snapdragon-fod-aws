/**
 * Get Vehicle Features Handler Lambda Function
 * Returns all active features for a specific vehicle
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SubscriptionRepository } from '../../shared/repositories/SubscriptionRepository';
import { FeatureRepository } from '../../shared/repositories/FeatureRepository';
import { ValidationError, isFODError, toFODError } from '../../shared/models/Errors';

const subscriptionRepo = new SubscriptionRepository();
const featureRepo = new FeatureRepository();

/**
 * Main Lambda handler
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Get vehicle features request received:', JSON.stringify(event));

  try {
    // Get vehicleId from path parameters
    const vehicleId = event.pathParameters?.vehicleId;

    if (!vehicleId) {
      throw new ValidationError('vehicleId', 'Vehicle ID is required in path');
    }

    console.log('Fetching features for vehicle:', vehicleId);

    // Get all active subscriptions for the vehicle
    const subscriptions = await subscriptionRepo.findByVehicleId(vehicleId);

    // Filter to only active subscriptions
    const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE');

    console.log(`Found ${activeSubscriptions.length} active subscriptions`);

    // Enrich with feature details
    const featuresWithDetails = await Promise.all(
      activeSubscriptions.map(async (sub) => {
        const feature = await featureRepo.findById(sub.featureId);
        return {
          subscriptionId: sub.subscriptionId,
          featureId: sub.featureId,
          featureName: feature?.name || 'Unknown',
          featureDescription: feature?.description || '',
          status: sub.status,
          activatedAt: sub.activatedAt?.toISOString(),
          purchasedAt: sub.purchasedAt.toISOString(),
          expiresAt: sub.expiresAt?.toISOString(),
          isPermanent: sub.isPermanent,
          autoRenew: sub.autoRenew,
        };
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        data: {
          vehicleId,
          features: featuresWithDetails,
          count: featuresWithDetails.length,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Get vehicle features failed:', error);

    const fodError = isFODError(error) ? error : toFODError(error);

    return {
      statusCode: fodError.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
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
