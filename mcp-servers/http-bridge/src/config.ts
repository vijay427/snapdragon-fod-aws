/**
 * Configuration for HTTP Bridge Server
 * Loads settings from environment variables with defaults
 */

export interface BridgeConfig {
  port: number;
  mcpServerPath: string;
  corsOrigins: string[];
  apiKey?: string;
  timeout: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  nodeEnv: string;
}

export function loadConfig(): BridgeConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    mcpServerPath: process.env.MCP_SERVER_PATH || '../snapdragon-simulator',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
    apiKey: process.env.API_KEY,
    timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
    logLevel: (process.env.LOG_LEVEL as BridgeConfig['logLevel']) || 'info',
    nodeEnv: process.env.NODE_ENV || 'development'
  };
}
