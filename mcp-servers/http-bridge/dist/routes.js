/**
 * API Routes for HTTP Bridge
 * Exposes MCP simulator functionality as REST endpoints
 */
import { Router } from 'express';
import { logger } from './logger.js';
export function createRoutes(mcpClient) {
    const router = Router();
    /**
     * POST /api/vehicle/:vehicleId/activate
     * Activate a feature on a vehicle
     */
    router.post('/vehicle/:vehicleId/activate', async (req, res) => {
        const correlationId = req.correlationId;
        const { vehicleId } = req.params;
        const { featureId, duration } = req.body;
        try {
            // Validate request
            if (!featureId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'featureId is required',
                        correlationId
                    }
                });
            }
            if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'duration must be a positive number',
                        correlationId
                    }
                });
            }
            logger.info('Activating feature', {
                correlationId,
                vehicleId,
                featureId,
                duration
            });
            // Call MCP simulator
            const result = await mcpClient.activateFeature(vehicleId, featureId, duration);
            // Get updated vehicle state
            const state = await mcpClient.getVehicleState(vehicleId);
            res.status(200).json({
                success: true,
                data: {
                    vehicleId,
                    featureId,
                    status: 'ACTIVATED',
                    activatedAt: new Date().toISOString(),
                    expiresAt: duration ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString() : undefined,
                    vehicleState: state
                }
            });
        }
        catch (error) {
            logger.error('Feature activation failed', {
                correlationId,
                vehicleId,
                featureId,
                error: error instanceof Error ? error.message : String(error)
            });
            const statusCode = error instanceof Error && error.name === 'MCPConnectionError' ? 503 : 500;
            res.status(statusCode).json({
                success: false,
                error: {
                    code: statusCode === 503 ? 'MCP_UNAVAILABLE' : 'ACTIVATION_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    correlationId
                }
            });
        }
    });
    /**
     * POST /api/vehicle/:vehicleId/deactivate
     * Deactivate a feature on a vehicle
     */
    router.post('/vehicle/:vehicleId/deactivate', async (req, res) => {
        const correlationId = req.correlationId;
        const { vehicleId } = req.params;
        const { featureId } = req.body;
        try {
            // Validate request
            if (!featureId) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'featureId is required',
                        correlationId
                    }
                });
            }
            logger.info('Deactivating feature', {
                correlationId,
                vehicleId,
                featureId
            });
            // Call MCP simulator
            await mcpClient.deactivateFeature(vehicleId, featureId);
            res.status(200).json({
                success: true,
                data: {
                    vehicleId,
                    featureId,
                    status: 'DEACTIVATED',
                    deactivatedAt: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger.error('Feature deactivation failed', {
                correlationId,
                vehicleId,
                featureId,
                error: error instanceof Error ? error.message : String(error)
            });
            const statusCode = error instanceof Error && error.name === 'MCPConnectionError' ? 503 : 500;
            res.status(statusCode).json({
                success: false,
                error: {
                    code: statusCode === 503 ? 'MCP_UNAVAILABLE' : 'DEACTIVATION_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    correlationId
                }
            });
        }
    });
    /**
     * GET /api/vehicle/:vehicleId/state
     * Get current vehicle state
     */
    router.get('/vehicle/:vehicleId/state', async (req, res) => {
        const correlationId = req.correlationId;
        const { vehicleId } = req.params;
        try {
            logger.info('Getting vehicle state', {
                correlationId,
                vehicleId
            });
            // Call MCP simulator
            const state = await mcpClient.getVehicleState(vehicleId);
            res.status(200).json({
                success: true,
                data: state
            });
        }
        catch (error) {
            logger.error('Failed to get vehicle state', {
                correlationId,
                vehicleId,
                error: error instanceof Error ? error.message : String(error)
            });
            const statusCode = error instanceof Error && error.name === 'MCPConnectionError' ? 503 : 500;
            res.status(statusCode).json({
                success: false,
                error: {
                    code: statusCode === 503 ? 'MCP_UNAVAILABLE' : 'STATE_QUERY_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    correlationId
                }
            });
        }
    });
    /**
     * POST /api/vehicle/:vehicleId/advance-time
     * Advance simulator time for testing
     */
    router.post('/vehicle/:vehicleId/advance-time', async (req, res) => {
        const correlationId = req.correlationId;
        const { vehicleId } = req.params;
        const { hours } = req.body;
        try {
            // Validate request
            if (typeof hours !== 'number' || hours <= 0) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'hours must be a positive number',
                        correlationId
                    }
                });
            }
            logger.info('Advancing simulator time', {
                correlationId,
                vehicleId,
                hours
            });
            // Call MCP simulator
            const result = await mcpClient.advanceTime(vehicleId, hours);
            res.status(200).json({
                success: true,
                data: {
                    vehicleId,
                    hoursAdvanced: hours,
                    result
                }
            });
        }
        catch (error) {
            logger.error('Failed to advance time', {
                correlationId,
                vehicleId,
                hours,
                error: error instanceof Error ? error.message : String(error)
            });
            const statusCode = error instanceof Error && error.name === 'MCPConnectionError' ? 503 : 500;
            res.status(statusCode).json({
                success: false,
                error: {
                    code: statusCode === 503 ? 'MCP_UNAVAILABLE' : 'TIME_ADVANCE_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    correlationId
                }
            });
        }
    });
    /**
     * POST /api/vehicle/:vehicleId/reset
     * Reset vehicle to default state
     */
    router.post('/vehicle/:vehicleId/reset', async (req, res) => {
        const correlationId = req.correlationId;
        const { vehicleId } = req.params;
        try {
            logger.info('Resetting vehicle', {
                correlationId,
                vehicleId
            });
            // Call MCP simulator
            await mcpClient.resetVehicle(vehicleId);
            res.status(200).json({
                success: true,
                data: {
                    vehicleId,
                    status: 'RESET',
                    resetAt: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger.error('Failed to reset vehicle', {
                correlationId,
                vehicleId,
                error: error instanceof Error ? error.message : String(error)
            });
            const statusCode = error instanceof Error && error.name === 'MCPConnectionError' ? 503 : 500;
            res.status(statusCode).json({
                success: false,
                error: {
                    code: statusCode === 503 ? 'MCP_UNAVAILABLE' : 'RESET_FAILED',
                    message: error instanceof Error ? error.message : 'Unknown error',
                    correlationId
                }
            });
        }
    });
    /**
     * GET /health
     * Health check endpoint
     */
    router.get('/health', (req, res) => {
        const mcpConnected = mcpClient.isConnected();
        const status = mcpConnected ? 'healthy' : 'degraded';
        const statusCode = mcpConnected ? 200 : 503;
        res.status(statusCode).json({
            status,
            mcpConnected,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    });
    return router;
}
//# sourceMappingURL=routes.js.map