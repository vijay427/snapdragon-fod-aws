#!/usr/bin/env node

/**
 * HTTP Bridge Main Entry Point
 * Starts Express server and connects to MCP Snapdragon Simulator
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config.js';
import { createServer } from './server.js';
import { MCPClient } from './mcp-client.js';
import { createRoutes } from './routes.js';
import { errorHandler } from './middleware.js';
import { logger } from './logger.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Load configuration
    const config = loadConfig();

    logger.info('Starting HTTP Bridge', {
      port: config.port,
      nodeEnv: config.nodeEnv,
      mcpServerPath: config.mcpServerPath
    });

    // Initialize MCP client
    const mcpClient = new MCPClient();
    
    // Resolve MCP server path
    const mcpServerPath = path.resolve(__dirname, '..', config.mcpServerPath, 'dist/index.js');
    
    logger.info('Connecting to MCP server', { mcpServerPath });
    await mcpClient.connect(mcpServerPath);

    // Create Express server
    const app = createServer(config);

    // Register routes
    const routes = createRoutes(mcpClient);
    app.use('/api', routes);

    // Health check at root
    app.get('/', (req, res) => {
      res.json({
        name: 'MCP HTTP Bridge',
        version: '1.0.0',
        status: 'running',
        mcpConnected: mcpClient.isConnected()
      });
    });

    // Error handling middleware (must be last)
    app.use(errorHandler);

    // Start server
    const server = app.listen(config.port, () => {
      logger.info('HTTP Bridge server started', {
        port: config.port,
        url: `http://localhost:${config.port}`
      });
      console.log(`\n🚀 HTTP Bridge running on http://localhost:${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/health`);
      console.log(`🔌 MCP Connected: ${mcpClient.isConnected()}\n`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down HTTP Bridge');
      
      server.close(() => {
        logger.info('HTTP server closed');
      });

      await mcpClient.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Fatal error starting HTTP Bridge', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

main();
