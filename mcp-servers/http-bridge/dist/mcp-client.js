/**
 * MCP Client for Snapdragon Simulator
 * Connects to the MCP server via stdio and provides typed methods for tool invocation
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { logger } from './logger.js';
export class MCPConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MCPConnectionError';
    }
}
export class MCPClient {
    constructor() {
        this.client = null;
        this.transport = null;
        this.serverProcess = null;
        this.connected = false;
    }
    /**
     * Initialize connection to MCP server
     * @param serverPath Path to the MCP server executable
     */
    async connect(serverPath) {
        try {
            logger.info('Initializing MCP client connection', { serverPath });
            // Spawn the MCP server process
            this.serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            // Handle server process errors
            this.serverProcess.on('error', (error) => {
                logger.error('MCP server process error', { error: error.message });
                this.connected = false;
            });
            this.serverProcess.on('exit', (code) => {
                logger.warn('MCP server process exited', { code });
                this.connected = false;
            });
            // Create stdio transport
            this.transport = new StdioClientTransport({
                command: 'node',
                args: [serverPath]
            });
            // Create MCP client
            this.client = new Client({
                name: 'http-bridge-client',
                version: '1.0.0',
            }, {
                capabilities: {},
            });
            // Connect to server
            await this.client.connect(this.transport);
            this.connected = true;
            logger.info('MCP client connected successfully');
        }
        catch (error) {
            logger.error('Failed to connect to MCP server', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new MCPConnectionError(`Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Check if client is connected
     */
    isConnected() {
        return this.connected && this.client !== null;
    }
    /**
     * Call an MCP tool
     * @param toolName Name of the tool to call
     * @param args Arguments for the tool
     */
    async callTool(toolName, args) {
        if (!this.isConnected() || !this.client) {
            throw new MCPConnectionError('MCP client is not connected');
        }
        try {
            logger.debug('Calling MCP tool', { toolName, args });
            const response = await this.client.callTool({
                name: toolName,
                arguments: args
            });
            if (response.isError) {
                const content = response.content;
                throw new Error(content[0]?.text || 'Unknown MCP error');
            }
            // Parse response text as JSON if possible
            const content = response.content;
            const resultText = content[0]?.text || '{}';
            try {
                return JSON.parse(resultText);
            }
            catch {
                // If not JSON, return as text
                return resultText;
            }
        }
        catch (error) {
            logger.error('MCP tool call failed', {
                toolName,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Get vehicle state
     */
    async getVehicleState(vehicleId) {
        return this.callTool('get_vehicle_state', { vehicleId });
    }
    /**
     * Activate a feature
     */
    async activateFeature(vehicleId, featureId, duration) {
        const args = { vehicleId, featureId };
        if (duration !== undefined) {
            args.duration = duration;
        }
        return this.callTool('activate_feature', args);
    }
    /**
     * Deactivate a feature
     */
    async deactivateFeature(vehicleId, featureId) {
        return this.callTool('deactivate_feature', { vehicleId, featureId });
    }
    /**
     * Advance simulator time
     */
    async advanceTime(vehicleId, hours) {
        return this.callTool('advance_time', { vehicleId, hours });
    }
    /**
     * Get activation logs
     */
    async getActivationLogs(vehicleId, limit) {
        const args = { vehicleId };
        if (limit !== undefined) {
            args.limit = limit;
        }
        return this.callTool('get_activation_logs', args);
    }
    /**
     * Reset vehicle to default state
     */
    async resetVehicle(vehicleId) {
        return this.callTool('reset_vehicle', { vehicleId });
    }
    /**
     * Disconnect from MCP server
     */
    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
        if (this.serverProcess) {
            this.serverProcess.kill();
            this.serverProcess = null;
        }
        this.connected = false;
        logger.info('MCP client disconnected');
    }
}
//# sourceMappingURL=mcp-client.js.map