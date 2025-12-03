#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Simulator state
interface VehicleState {
  vehicleId: string;
  connectivityTier: '4G' | '5G';
  performanceMode: 'COMFORT' | 'SPORT' | 'ECO';
  activeFeatures: Array<{
    featureId: string;
    activatedAt: string;
    expiresAt?: string;
  }>;
  simulatedTime: Date;
  activationLogs: Array<{
    timestamp: string;
    action: string;
    featureId: string;
    status: string;
  }>;
}

const vehicleStates = new Map<string, VehicleState>();

// Initialize default vehicle
function getOrCreateVehicle(vehicleId: string): VehicleState {
  if (!vehicleStates.has(vehicleId)) {
    vehicleStates.set(vehicleId, {
      vehicleId,
      connectivityTier: '4G',
      performanceMode: 'COMFORT',
      activeFeatures: [],
      simulatedTime: new Date(),
      activationLogs: []
    });
  }
  return vehicleStates.get(vehicleId)!;
}

// Create MCP server
const server = new Server(
  {
    name: 'snapdragon-simulator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_vehicle_state',
        description: 'Get the current state of a simulated vehicle including active features, connectivity tier, and performance mode',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: {
              type: 'string',
              description: 'The unique identifier for the vehicle (e.g., VIN1234567890)',
            },
          },
          required: ['vehicleId'],
        },
      },
      {
        name: 'activate_feature',
        description: 'Simulate activating a feature on the vehicle (connectivity upgrade, sport mode, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: {
              type: 'string',
              description: 'The unique identifier for the vehicle',
            },
            featureId: {
              type: 'string',
              description: 'The feature to activate (e.g., CONNECTIVITY_5G, SPORT_MODE)',
            },
            duration: {
              type: 'number',
              description: 'Duration in hours (optional, for time-limited features)',
            },
          },
          required: ['vehicleId', 'featureId'],
        },
      },
      {
        name: 'deactivate_feature',
        description: 'Simulate deactivating a feature on the vehicle',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: {
              type: 'string',
              description: 'The unique identifier for the vehicle',
            },
            featureId: {
              type: 'string',
              description: 'The feature to deactivate',
            },
          },
          required: ['vehicleId', 'featureId'],
        },
      },
      {
        name: 'advance_time',
        description: 'Fast-forward the simulator time to test time-limited features and expirations',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: {
              type: 'string',
              description: 'The unique identifier for the vehicle',
            },
            hours: {
              type: 'number',
              description: 'Number of hours to advance',
            },
          },
          required: ['vehicleId', 'hours'],
        },
      },
      {
        name: 'get_activation_logs',
        description: 'Get the activation/deactivation logs for a vehicle',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: {
              type: 'string',
              description: 'The unique identifier for the vehicle',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of log entries to return (default: 50)',
            },
          },
          required: ['vehicleId'],
        },
      },
      {
        name: 'reset_vehicle',
        description: 'Reset a vehicle to its default state',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: {
              type: 'string',
              description: 'The unique identifier for the vehicle',
            },
          },
          required: ['vehicleId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: No arguments provided',
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'get_vehicle_state': {
        const vehicleId = args.vehicleId as string;
        const state = getOrCreateVehicle(vehicleId);
        
        // Check for expired features
        const now = state.simulatedTime;
        state.activeFeatures = state.activeFeatures.filter(feature => {
          if (feature.expiresAt) {
            const expiresAt = new Date(feature.expiresAt);
            if (expiresAt <= now) {
              state.activationLogs.push({
                timestamp: now.toISOString(),
                action: 'AUTO_DEACTIVATED',
                featureId: feature.featureId,
                status: 'EXPIRED'
              });
              return false;
            }
          }
          return true;
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(state, null, 2),
            },
          ],
        };
      }

      case 'activate_feature': {
        const vehicleId = args.vehicleId as string;
        const featureId = args.featureId as string;
        const duration = args.duration as number | undefined;
        
        const state = getOrCreateVehicle(vehicleId);
        const now = state.simulatedTime;
        
        // Check if already active
        const existing = state.activeFeatures.find(f => f.featureId === featureId);
        if (existing) {
          return {
            content: [
              {
                type: 'text',
                text: `Feature ${featureId} is already active on vehicle ${vehicleId}`,
              },
            ],
          };
        }

        // Apply feature-specific logic
        if (featureId === 'CONNECTIVITY_5G') {
          state.connectivityTier = '5G';
        } else if (featureId === 'SPORT_MODE') {
          state.performanceMode = 'SPORT';
        }

        // Add to active features
        const feature: any = {
          featureId,
          activatedAt: now.toISOString(),
        };
        
        if (duration) {
          const expiresAt = new Date(now);
          expiresAt.setHours(expiresAt.getHours() + duration);
          feature.expiresAt = expiresAt.toISOString();
        }
        
        state.activeFeatures.push(feature);
        
        // Log activation
        state.activationLogs.push({
          timestamp: now.toISOString(),
          action: 'ACTIVATED',
          featureId,
          status: 'SUCCESS'
        });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully activated ${featureId} on vehicle ${vehicleId}${duration ? ` for ${duration} hours` : ''}`,
            },
          ],
        };
      }

      case 'deactivate_feature': {
        const vehicleId = args.vehicleId as string;
        const featureId = args.featureId as string;
        
        const state = getOrCreateVehicle(vehicleId);
        const now = state.simulatedTime;
        
        // Remove from active features
        const index = state.activeFeatures.findIndex(f => f.featureId === featureId);
        if (index === -1) {
          return {
            content: [
              {
                type: 'text',
                text: `Feature ${featureId} is not active on vehicle ${vehicleId}`,
              },
            ],
          };
        }
        
        state.activeFeatures.splice(index, 1);
        
        // Apply feature-specific logic
        if (featureId === 'CONNECTIVITY_5G') {
          state.connectivityTier = '4G';
        } else if (featureId === 'SPORT_MODE') {
          state.performanceMode = 'COMFORT';
        }
        
        // Log deactivation
        state.activationLogs.push({
          timestamp: now.toISOString(),
          action: 'DEACTIVATED',
          featureId,
          status: 'SUCCESS'
        });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully deactivated ${featureId} on vehicle ${vehicleId}`,
            },
          ],
        };
      }

      case 'advance_time': {
        const vehicleId = args.vehicleId as string;
        const hours = args.hours as number;
        
        const state = getOrCreateVehicle(vehicleId);
        state.simulatedTime = new Date(state.simulatedTime.getTime() + hours * 60 * 60 * 1000);
        
        // Check for expired features
        const now = state.simulatedTime;
        const expiredFeatures: string[] = [];
        
        state.activeFeatures = state.activeFeatures.filter(feature => {
          if (feature.expiresAt) {
            const expiresAt = new Date(feature.expiresAt);
            if (expiresAt <= now) {
              expiredFeatures.push(feature.featureId);
              state.activationLogs.push({
                timestamp: now.toISOString(),
                action: 'AUTO_DEACTIVATED',
                featureId: feature.featureId,
                status: 'EXPIRED'
              });
              return false;
            }
          }
          return true;
        });

        return {
          content: [
            {
              type: 'text',
              text: `Advanced time by ${hours} hours. Current time: ${state.simulatedTime.toISOString()}${expiredFeatures.length > 0 ? `\nExpired features: ${expiredFeatures.join(', ')}` : ''}`,
            },
          ],
        };
      }

      case 'get_activation_logs': {
        const vehicleId = args.vehicleId as string;
        const limit = (args.limit as number) || 50;
        
        const state = getOrCreateVehicle(vehicleId);
        const logs = state.activationLogs.slice(-limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(logs, null, 2),
            },
          ],
        };
      }

      case 'reset_vehicle': {
        const vehicleId = args.vehicleId as string;
        vehicleStates.delete(vehicleId);
        getOrCreateVehicle(vehicleId);

        return {
          content: [
            {
              type: 'text',
              text: `Vehicle ${vehicleId} has been reset to default state`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Snapdragon Simulator MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
