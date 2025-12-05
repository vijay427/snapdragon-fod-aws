/**
 * Express HTTP Server
 * Exposes MCP Snapdragon Simulator as REST API
 */

import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { BridgeConfig } from './config.js';
import { logger } from './logger.js';
import { requestLogger, apiKeyAuth, errorHandler } from './middleware.js';

export function createServer(config: BridgeConfig): Express {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Body parser middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // API key authentication (if configured)
  if (config.apiKey) {
    logger.info('API key authentication enabled');
    app.use('/api', apiKeyAuth(config.apiKey));
  }

  logger.info('Express server configured', {
    port: config.port,
    corsOrigins: config.corsOrigins,
    authEnabled: !!config.apiKey
  });

  return app;
}
