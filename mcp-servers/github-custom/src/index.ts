#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';

// Get GitHub token from environment
const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_PERSONAL_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Create MCP server
const server = new Server(
  {
    name: 'github-custom',
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
        name: 'list_repositories',
        description: 'List repositories accessible to the authenticated user',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Type of repositories to list: all, owner, public, private, member (default: owner)',
              enum: ['all', 'owner', 'public', 'private', 'member'],
            },
            sort: {
              type: 'string',
              description: 'Sort by: created, updated, pushed, full_name (default: updated)',
              enum: ['created', 'updated', 'pushed', 'full_name'],
            },
            limit: {
              type: 'number',
              description: 'Maximum number of repositories to return (default: 30)',
            },
          },
        },
      },
      {
        name: 'create_repository',
        description: 'Create a new GitHub repository',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Repository name',
            },
            description: {
              type: 'string',
              description: 'Repository description',
            },
            private: {
              type: 'boolean',
              description: 'Whether the repository should be private (default: false)',
            },
            autoInit: {
              type: 'boolean',
              description: 'Initialize with README (default: true)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_issues',
        description: 'List issues in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            state: {
              type: 'string',
              description: 'Issue state: open, closed, all (default: open)',
              enum: ['open', 'closed', 'all'],
            },
            limit: {
              type: 'number',
              description: 'Maximum number of issues to return (default: 30)',
            },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'create_issue',
        description: 'Create a new issue in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            title: {
              type: 'string',
              description: 'Issue title',
            },
            body: {
              type: 'string',
              description: 'Issue body/description',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Labels to add to the issue',
            },
          },
          required: ['owner', 'repo', 'title'],
        },
      },
      {
        name: 'update_issue',
        description: 'Update an existing issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            issueNumber: {
              type: 'number',
              description: 'Issue number',
            },
            title: {
              type: 'string',
              description: 'New issue title',
            },
            body: {
              type: 'string',
              description: 'New issue body',
            },
            state: {
              type: 'string',
              description: 'Issue state: open or closed',
              enum: ['open', 'closed'],
            },
          },
          required: ['owner', 'repo', 'issueNumber'],
        },
      },
      {
        name: 'create_pull_request',
        description: 'Create a new pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
              description: 'Repository owner',
            },
            repo: {
              type: 'string',
              description: 'Repository name',
            },
            title: {
              type: 'string',
              description: 'Pull request title',
            },
            body: {
              type: 'string',
              description: 'Pull request description',
            },
            head: {
              type: 'string',
              description: 'The name of the branch where your changes are',
            },
            base: {
              type: 'string',
              description: 'The name of the branch you want to merge into (default: main)',
            },
          },
          required: ['owner', 'repo', 'title', 'head'],
        },
      },
      {
        name: 'get_user_info',
        description: 'Get information about the authenticated user',
        inputSchema: {
          type: 'object',
          properties: {},
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
      case 'list_repositories': {
        const type = (args.type as string) || 'owner';
        const sort = (args.sort as string) || 'updated';
        const limit = (args.limit as number) || 30;

        const { data } = await octokit.repos.listForAuthenticatedUser({
          type: type as any,
          sort: sort as any,
          per_page: limit,
        });

        const repos = data.map((repo) => ({
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          private: repo.private,
          url: repo.html_url,
          defaultBranch: repo.default_branch,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(repos, null, 2),
            },
          ],
        };
      }

      case 'create_repository': {
        const name = args.name as string;
        const description = args.description as string;
        const isPrivate = args.private as boolean || false;
        const autoInit = args.autoInit as boolean !== false;

        const { data } = await octokit.repos.createForAuthenticatedUser({
          name,
          description,
          private: isPrivate,
          auto_init: autoInit,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully created repository: ${data.full_name}\nURL: ${data.html_url}`,
            },
          ],
        };
      }

      case 'list_issues': {
        const owner = args.owner as string;
        const repo = args.repo as string;
        const state = (args.state as string) || 'open';
        const limit = (args.limit as number) || 30;

        const { data } = await octokit.issues.listForRepo({
          owner,
          repo,
          state: state as any,
          per_page: limit,
        });

        const issues = data.map((issue) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          body: issue.body,
          labels: issue.labels.map((l: any) => l.name),
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          url: issue.html_url,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issues, null, 2),
            },
          ],
        };
      }

      case 'create_issue': {
        const owner = args.owner as string;
        const repo = args.repo as string;
        const title = args.title as string;
        const body = args.body as string;
        const labels = args.labels as string[] || [];

        const { data } = await octokit.issues.create({
          owner,
          repo,
          title,
          body,
          labels,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully created issue #${data.number}: ${data.title}\nURL: ${data.html_url}`,
            },
          ],
        };
      }

      case 'update_issue': {
        const owner = args.owner as string;
        const repo = args.repo as string;
        const issueNumber = args.issueNumber as number;
        const title = args.title as string;
        const body = args.body as string;
        const state = args.state as 'open' | 'closed';

        const updateData: any = {
          owner,
          repo,
          issue_number: issueNumber,
        };

        if (title) updateData.title = title;
        if (body) updateData.body = body;
        if (state) updateData.state = state;

        const { data } = await octokit.issues.update(updateData);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully updated issue #${data.number}: ${data.title}\nState: ${data.state}\nURL: ${data.html_url}`,
            },
          ],
        };
      }

      case 'create_pull_request': {
        const owner = args.owner as string;
        const repo = args.repo as string;
        const title = args.title as string;
        const body = args.body as string;
        const head = args.head as string;
        const base = (args.base as string) || 'main';

        const { data } = await octokit.pulls.create({
          owner,
          repo,
          title,
          body,
          head,
          base,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully created pull request #${data.number}: ${data.title}\nURL: ${data.html_url}`,
            },
          ],
        };
      }

      case 'get_user_info': {
        const { data } = await octokit.users.getAuthenticated();

        const userInfo = {
          login: data.login,
          name: data.name,
          email: data.email,
          bio: data.bio,
          publicRepos: data.public_repos,
          followers: data.followers,
          following: data.following,
          createdAt: data.created_at,
          url: data.html_url,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(userInfo, null, 2),
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
          text: `Error: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`,
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
  console.error('GitHub Custom MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
