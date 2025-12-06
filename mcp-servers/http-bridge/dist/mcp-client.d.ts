/**
 * MCP Client for Snapdragon Simulator
 * Connects to the MCP server via stdio and provides typed methods for tool invocation
 */
export declare class MCPConnectionError extends Error {
    constructor(message: string);
}
export declare class MCPClient {
    private client;
    private transport;
    private serverProcess;
    private connected;
    /**
     * Initialize connection to MCP server
     * @param serverPath Path to the MCP server executable
     */
    connect(serverPath: string): Promise<void>;
    /**
     * Check if client is connected
     */
    isConnected(): boolean;
    /**
     * Call an MCP tool
     * @param toolName Name of the tool to call
     * @param args Arguments for the tool
     */
    private callTool;
    /**
     * Get vehicle state
     */
    getVehicleState(vehicleId: string): Promise<any>;
    /**
     * Activate a feature
     */
    activateFeature(vehicleId: string, featureId: string, duration?: number): Promise<any>;
    /**
     * Deactivate a feature
     */
    deactivateFeature(vehicleId: string, featureId: string): Promise<any>;
    /**
     * Advance simulator time
     */
    advanceTime(vehicleId: string, hours: number): Promise<any>;
    /**
     * Get activation logs
     */
    getActivationLogs(vehicleId: string, limit?: number): Promise<any>;
    /**
     * Reset vehicle to default state
     */
    resetVehicle(vehicleId: string): Promise<any>;
    /**
     * Disconnect from MCP server
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=mcp-client.d.ts.map