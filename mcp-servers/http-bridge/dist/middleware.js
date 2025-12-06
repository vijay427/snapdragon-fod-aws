/**
 * Express middleware functions
 */
import { logger } from './logger.js';
/**
 * Request logging middleware
 * Logs all incoming requests with method, path, and timing
 */
export function requestLogger(req, res, next) {
    const start = Date.now();
    const correlationId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // Attach correlation ID to request
    req.correlationId = correlationId;
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
            correlationId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        });
    });
    next();
}
/**
 * API Key authentication middleware (optional)
 * Validates API key from Authorization header if configured
 */
export function apiKeyAuth(apiKey) {
    return (req, res, next) => {
        // Skip auth if no API key configured
        if (!apiKey) {
            return next();
        }
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn('Missing or invalid authorization header', {
                correlationId: req.correlationId,
                path: req.path
            });
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Missing or invalid authorization header'
                }
            });
            return;
        }
        const token = authHeader.substring(7);
        if (token !== apiKey) {
            logger.warn('Invalid API key', {
                correlationId: req.correlationId,
                path: req.path
            });
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid API key'
                }
            });
            return;
        }
        next();
    };
}
/**
 * Error handling middleware
 * Catches all errors and returns structured error responses
 */
export function errorHandler(err, req, res, next) {
    const correlationId = req.correlationId;
    logger.error('Request error', {
        correlationId,
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    // Determine status code
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
    }
    else if (err.name === 'TimeoutError') {
        statusCode = 504;
        errorCode = 'TIMEOUT';
    }
    else if (err.name === 'MCPConnectionError') {
        statusCode = 503;
        errorCode = 'MCP_UNAVAILABLE';
    }
    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message: err.message,
            correlationId
        }
    });
}
//# sourceMappingURL=middleware.js.map