/**
 * Express middleware functions
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Request logging middleware
 * Logs all incoming requests with method, path, and timing
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * API Key authentication middleware (optional)
 * Validates API key from Authorization header if configured
 */
export declare function apiKeyAuth(apiKey?: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Error handling middleware
 * Catches all errors and returns structured error responses
 */
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=middleware.d.ts.map