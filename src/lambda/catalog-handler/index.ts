/**
 * Catalog Handler Lambda Function
 * Returns all available features in the system
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

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
 * Main Lambda handler
 */
export function handler(_event: APIGatewayProxyEvent): APIGatewayProxyResult {
  // eslint-disable-next-line no-console
  console.log('Catalog request received');

  try {
    // Mock data for testing (until MongoDB is configured)
    const mockFeatures = [
      {
        featureId: 'SPORT_MODE',
        name: 'Sport Mode',
        description: 'Enhanced performance and handling with aggressive throttle response',
        price: 99.99,
        duration: 48,
        category: 'PERFORMANCE',
        isActive: true,
      },
      {
        featureId: 'CONNECTIVITY_5G',
        name: '5G Connectivity',
        description: 'Ultra-fast 5G network access for seamless connectivity',
        price: 299.99,
        duration: 0,
        category: 'CONNECTIVITY',
        isActive: true,
      },
      {
        featureId: 'PREMIUM_AUDIO',
        name: 'Premium Audio System',
        description: 'High-fidelity audio with surround sound',
        price: 199.99,
        duration: 0,
        category: 'INFOTAINMENT',
        isActive: true,
      },
      {
        featureId: 'AUTOPILOT',
        name: 'Advanced Autopilot',
        description: 'Advanced driver assistance with lane keeping and adaptive cruise',
        price: 499.99,
        duration: 168,
        category: 'SAFETY',
        isActive: true,
      },
      {
        featureId: 'ECO_MODE',
        name: 'Eco Mode',
        description: 'Optimized for fuel efficiency and range',
        price: 49.99,
        duration: 72,
        category: 'PERFORMANCE',
        isActive: true,
      },
    ];

    // eslint-disable-next-line no-console
    console.log(`Returning ${mockFeatures.length} mock features`);

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
          features: mockFeatures,
          count: mockFeatures.length,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: unknown) {
    console.error('Catalog fetching failed:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
      },
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: getErrorMessage(error) || 'Internal server error occurred',
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }
}
