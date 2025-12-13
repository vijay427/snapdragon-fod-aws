"use strict";
/**
 * Get Vehicle Features Handler Lambda Function
 * Returns all active features for a specific vehicle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const Errors_1 = require("../../shared/models/Errors");
/**
 * Main Lambda handler
 */
function handler(event) {
    // eslint-disable-next-line no-console
    console.log('Get vehicle features request received:', JSON.stringify(event));
    try {
        // Get vehicleId from path parameters
        const vehicleId = event.pathParameters?.vehicleId;
        if (!vehicleId) {
            throw new Errors_1.ValidationError('vehicleId', 'Vehicle ID is required in path');
        }
        // eslint-disable-next-line no-console
        console.log('Fetching features for vehicle:', vehicleId);
        // Mock data for testing (until MongoDB is configured)
        const mockFeatures = [
            {
                subscriptionId: 'sub_mock_001',
                featureId: 'SPORT_MODE',
                featureName: 'Sport Mode',
                featureDescription: 'Enhanced performance and handling',
                status: 'ACTIVE',
                activatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                purchasedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                isPermanent: false,
                autoRenew: false,
            },
            {
                subscriptionId: 'sub_mock_002',
                featureId: 'CONNECTIVITY_5G',
                featureName: '5G Connectivity',
                featureDescription: 'Ultra-fast 5G network access',
                status: 'ACTIVE',
                activatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
                purchasedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
                expiresAt: undefined,
                isPermanent: true,
                autoRenew: false,
            },
        ];
        // eslint-disable-next-line no-console
        console.log(`Returning ${mockFeatures.length} mock features for vehicle ${vehicleId}`);
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
                    features: mockFeatures,
                    count: mockFeatures.length,
                },
                timestamp: new Date().toISOString(),
            }),
        };
    }
    catch (error) {
        console.error('Get vehicle features failed:', error);
        const fodError = (0, Errors_1.isFODError)(error) ? error : (0, Errors_1.toFODError)(error);
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
//# sourceMappingURL=index.js.map