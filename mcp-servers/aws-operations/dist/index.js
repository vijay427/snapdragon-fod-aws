#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { CloudFormationClient, DescribeStacksCommand, ListStacksCommand, DescribeStackEventsCommand, } from '@aws-sdk/client-cloudformation';
import { LambdaClient, ListFunctionsCommand, } from '@aws-sdk/client-lambda';
import { CloudWatchClient, GetMetricStatisticsCommand, } from '@aws-sdk/client-cloudwatch';
const region = process.env.AWS_REGION || 'us-east-1';
const cfnClient = new CloudFormationClient({ region });
const lambdaClient = new LambdaClient({ region });
const cwClient = new CloudWatchClient({ region });
const server = new Server({
    name: 'aws-operations-mcp',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_stack_status',
                description: 'Get the status of a CloudFormation stack',
                inputSchema: {
                    type: 'object',
                    properties: {
                        stackName: {
                            type: 'string',
                            description: 'Name of the CloudFormation stack',
                        },
                    },
                    required: ['stackName'],
                },
            },
            {
                name: 'list_fod_stacks',
                description: 'List all FOD CloudFormation stacks',
                inputSchema: {
                    type: 'object',
                    properties: {
                        environment: {
                            type: 'string',
                            description: 'Environment (dev, staging, prod)',
                            default: 'dev',
                        },
                    },
                },
            },
            {
                name: 'get_stack_outputs',
                description: 'Get outputs from a CloudFormation stack',
                inputSchema: {
                    type: 'object',
                    properties: {
                        stackName: {
                            type: 'string',
                            description: 'Name of the CloudFormation stack',
                        },
                    },
                    required: ['stackName'],
                },
            },
            {
                name: 'get_lambda_metrics',
                description: 'Get CloudWatch metrics for a Lambda function',
                inputSchema: {
                    type: 'object',
                    properties: {
                        functionName: {
                            type: 'string',
                            description: 'Name of the Lambda function',
                        },
                        metricName: {
                            type: 'string',
                            description: 'Metric name (Invocations, Errors, Duration, Throttles)',
                            enum: ['Invocations', 'Errors', 'Duration', 'Throttles'],
                        },
                        hours: {
                            type: 'number',
                            description: 'Number of hours to look back',
                            default: 1,
                        },
                    },
                    required: ['functionName', 'metricName'],
                },
            },
            {
                name: 'list_lambda_functions',
                description: 'List all Lambda functions with FOD prefix',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'get_deployment_events',
                description: 'Get recent CloudFormation stack events',
                inputSchema: {
                    type: 'object',
                    properties: {
                        stackName: {
                            type: 'string',
                            description: 'Name of the CloudFormation stack',
                        },
                        limit: {
                            type: 'number',
                            description: 'Number of events to retrieve',
                            default: 20,
                        },
                    },
                    required: ['stackName'],
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args) {
        throw new Error('Missing arguments');
    }
    try {
        switch (name) {
            case 'get_stack_status': {
                const command = new DescribeStacksCommand({
                    StackName: args.stackName,
                });
                const response = await cfnClient.send(command);
                const stack = response.Stacks?.[0];
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                stackName: stack?.StackName,
                                status: stack?.StackStatus,
                                creationTime: stack?.CreationTime,
                                lastUpdatedTime: stack?.LastUpdatedTime,
                                outputs: stack?.Outputs,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'list_fod_stacks': {
                const env = args.environment || 'dev';
                const command = new ListStacksCommand({
                    StackStatusFilter: [
                        'CREATE_COMPLETE',
                        'UPDATE_COMPLETE',
                        'CREATE_IN_PROGRESS',
                        'UPDATE_IN_PROGRESS',
                    ],
                });
                const response = await cfnClient.send(command);
                const fodStacks = response.StackSummaries?.filter((s) => s.StackName?.startsWith(`FOD-`) && s.StackName?.endsWith(`-${env}`));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(fodStacks?.map((s) => ({
                                name: s.StackName,
                                status: s.StackStatus,
                                creationTime: s.CreationTime,
                            })), null, 2),
                        },
                    ],
                };
            }
            case 'get_stack_outputs': {
                const command = new DescribeStacksCommand({
                    StackName: args.stackName,
                });
                const response = await cfnClient.send(command);
                const outputs = response.Stacks?.[0]?.Outputs;
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(outputs, null, 2),
                        },
                    ],
                };
            }
            case 'get_lambda_metrics': {
                const endTime = new Date();
                const startTime = new Date(endTime.getTime() - (args.hours || 1) * 60 * 60 * 1000);
                const command = new GetMetricStatisticsCommand({
                    Namespace: 'AWS/Lambda',
                    MetricName: args.metricName,
                    Dimensions: [
                        {
                            Name: 'FunctionName',
                            Value: args.functionName,
                        },
                    ],
                    StartTime: startTime,
                    EndTime: endTime,
                    Period: 300, // 5 minutes
                    Statistics: ['Sum', 'Average', 'Maximum'],
                });
                const response = await cwClient.send(command);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                functionName: args.functionName,
                                metricName: args.metricName,
                                datapoints: response.Datapoints,
                            }, null, 2),
                        },
                    ],
                };
            }
            case 'list_lambda_functions': {
                const command = new ListFunctionsCommand({});
                const response = await lambdaClient.send(command);
                const fodFunctions = response.Functions?.filter((f) => f.FunctionName?.startsWith('FOD-'));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(fodFunctions?.map((f) => ({
                                name: f.FunctionName,
                                runtime: f.Runtime,
                                lastModified: f.LastModified,
                                memorySize: f.MemorySize,
                                timeout: f.Timeout,
                            })), null, 2),
                        },
                    ],
                };
            }
            case 'get_deployment_events': {
                const command = new DescribeStackEventsCommand({
                    StackName: args.stackName,
                });
                const response = await cfnClient.send(command);
                const events = response.StackEvents?.slice(0, args.limit || 20);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(events?.map((e) => ({
                                timestamp: e.Timestamp,
                                resourceType: e.ResourceType,
                                logicalResourceId: e.LogicalResourceId,
                                resourceStatus: e.ResourceStatus,
                                resourceStatusReason: e.ResourceStatusReason,
                            })), null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
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
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('AWS Operations MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
