/**
 * Catalog Handler Lambda Function
 * Returns all available features in the system
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { FeatureRepository } from '../../shared/repositories/FeatureRepository';
import { isFODError, toFODError } from '../../shared/models/Errors';

const featureRepo = new FeatureRepository();

/**
 * Main Lambda handler
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Catalog request received:', JSON.stringify(event));

  try {
    // Get all active features
    const features = await featureRepo.findAll();

    // Filter to only active features
    const activeFeatures = features.filter((f) => f.isActive);

    console.log(`Found ${activeFeatures.length} active features`);

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
          features: activeFeatures.map((f) => ({
            featureId: f.featureId,
            name: f.name,
            description: f.description,
            price: f.price,
            duration: f.duration,
            category: f.category,
            isActive: f.isActive,
          })),
          count: activeFeatures.length,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Catalog fetch failed:', error);

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
