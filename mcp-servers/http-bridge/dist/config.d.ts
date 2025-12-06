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
export declare function loadConfig(): BridgeConfig;
//# sourceMappingURL=config.d.ts.map