/**
 * Configuration for HTTP Bridge Server
 * Loads settings from environment variables with defaults
 */
export function loadConfig() {
    return {
        port: parseInt(process.env.PORT || '3001', 10),
        mcpServerPath: process.env.MCP_SERVER_PATH || '../snapdragon-simulator',
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
        apiKey: process.env.API_KEY,
        timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
        logLevel: process.env.LOG_LEVEL || 'info',
        nodeEnv: process.env.NODE_ENV || 'development'
    };
}
//# sourceMappingURL=config.js.map