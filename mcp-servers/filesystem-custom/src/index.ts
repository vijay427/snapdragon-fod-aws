#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, statSync } from 'fs';

// Get workspace root from environment or use current directory
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();

// Create MCP server
const server = new Server(
  {
    name: 'filesystem-custom',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to resolve and validate paths
function resolvePath(relativePath: string): string {
  const resolved = path.resolve(WORKSPACE_ROOT, relativePath);
  
  // Security check: ensure path is within workspace
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Access denied: Path is outside workspace');
  }
  
  return resolved;
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'read_file',
        description: 'Read the contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file (relative to workspace root)',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file (creates or overwrites)',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file (relative to workspace root)',
            },
            content: {
              type: 'string',
              description: 'Content to write to the file',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'list_directory',
        description: 'List contents of a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the directory (relative to workspace root)',
            },
            recursive: {
              type: 'boolean',
              description: 'List recursively (default: false)',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'create_directory',
        description: 'Create a new directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the directory (relative to workspace root)',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'delete_file',
        description: 'Delete a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file (relative to workspace root)',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'file_exists',
        description: 'Check if a file or directory exists',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to check (relative to workspace root)',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'get_file_info',
        description: 'Get information about a file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file or directory (relative to workspace root)',
            },
          },
          required: ['path'],
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
      case 'read_file': {
        const filePath = resolvePath(args.path as string);
        const content = await fs.readFile(filePath, 'utf-8');

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'write_file': {
        const filePath = resolvePath(args.path as string);
        const content = args.content as string;

        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(filePath, content, 'utf-8');

        return {
          content: [
            {
              type: 'text',
              text: `Successfully wrote to ${args.path}`,
            },
          ],
        };
      }

      case 'list_directory': {
        const dirPath = resolvePath(args.path as string);
        const recursive = args.recursive as boolean || false;

        async function listDir(dir: string, prefix: string = ''): Promise<string[]> {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          const results: string[] = [];

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.join(prefix, entry.name);

            if (entry.isDirectory()) {
              results.push(`${relativePath}/`);
              if (recursive) {
                const subResults = await listDir(fullPath, relativePath);
                results.push(...subResults);
              }
            } else {
              const stats = statSync(fullPath);
              const size = stats.size;
              results.push(`${relativePath} (${size} bytes)`);
            }
          }

          return results;
        }

        const files = await listDir(dirPath);

        return {
          content: [
            {
              type: 'text',
              text: files.length > 0 ? files.join('\n') : 'Directory is empty',
            },
          ],
        };
      }

      case 'create_directory': {
        const dirPath = resolvePath(args.path as string);
        await fs.mkdir(dirPath, { recursive: true });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully created directory: ${args.path}`,
            },
          ],
        };
      }

      case 'delete_file': {
        const filePath = resolvePath(args.path as string);
        await fs.unlink(filePath);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted: ${args.path}`,
            },
          ],
        };
      }

      case 'file_exists': {
        const filePath = resolvePath(args.path as string);
        const exists = existsSync(filePath);

        return {
          content: [
            {
              type: 'text',
              text: exists ? `Yes, ${args.path} exists` : `No, ${args.path} does not exist`,
            },
          ],
        };
      }

      case 'get_file_info': {
        const filePath = resolvePath(args.path as string);
        const stats = await fs.stat(filePath);

        const info = {
          path: args.path,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          accessed: stats.atime.toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
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
  console.error(`Filesystem Custom MCP server running on stdio`);
  console.error(`Workspace root: ${WORKSPACE_ROOT}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
