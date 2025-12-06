#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ComputeStack } from '../lib/compute-stack';
import { ApiStack } from '../lib/api-stack';
import { IoTStack } from '../lib/iot-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

// Get environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

const stackPrefix = app.node.tryGetContext('stackPrefix') || 'FOD';
const environment = app.node.tryGetContext('environment') || 'dev';

// Network Stack - VPC, Subnets, Security Groups
const networkStack = new NetworkStack(app, `${stackPrefix}-Network-${environment}`, {
  env,
  description: 'Network infrastructure for FOD system',
});

// Database Stack - MongoDB Atlas connection configuration
const databaseStack = new DatabaseStack(app, `${stackPrefix}-Database-${environment}`, {
  env,
  description: 'Database configuration for FOD system',
});

// Compute Stack - Lambda functions
const computeStack = new ComputeStack(app, `${stackPrefix}-Compute-${environment}`, {
  env,
  vpc: networkStack.vpc,
  description: 'Lambda functions for FOD system',
});
computeStack.addDependency(networkStack);
computeStack.addDependency(databaseStack);

// API Stack - API Gateway and Cognito
const apiStack = new ApiStack(app, `${stackPrefix}-API-${environment}`, {
  env,
  purchaseHandler: computeStack.purchaseHandler,
  activationHandler: computeStack.activationHandler,
  deactivationHandler: computeStack.deactivationHandler,
  catalogHandler: computeStack.catalogHandler,
  getVehicleFeaturesHandler: computeStack.getVehicleFeaturesHandler,
  testActivationHandler: computeStack.testActivationHandler,
  description: 'API Gateway and authentication for FOD system',
});
apiStack.addDependency(computeStack);

// IoT Stack - AWS IoT Core configuration
const iotStack = new IoTStack(app, `${stackPrefix}-IoT-${environment}`, {
  env,
  ackHandler: computeStack.ackHandler,
  description: 'IoT Core infrastructure for vehicle communication',
});
iotStack.addDependency(computeStack);

// Monitoring Stack - CloudWatch dashboards and alarms
const monitoringStack = new MonitoringStack(app, `${stackPrefix}-Monitoring-${environment}`, {
  env,
  purchaseHandler: computeStack.purchaseHandler,
  activationHandler: computeStack.activationHandler,
  deactivationHandler: computeStack.deactivationHandler,
  api: apiStack.api,
  description: 'Monitoring and observability for FOD system',
});
monitoringStack.addDependency(apiStack);
monitoringStack.addDependency(iotStack);

// CI/CD Pipeline Stack (optional - only deploy if GitHub token is configured)
const githubOwner = app.node.tryGetContext('githubOwner') || process.env.GITHUB_OWNER;
const githubRepo = app.node.tryGetContext('githubRepo') || process.env.GITHUB_REPO || 'snapdragon-fod-aws';
const githubBranch = app.node.tryGetContext('githubBranch') || process.env.GITHUB_BRANCH || 'main';

if (githubOwner) {
  const pipelineStack = new PipelineStack(app, `${stackPrefix}-Pipeline-${environment}`, {
    env,
    environment,
    githubOwner,
    githubRepo,
    githubBranch,
    description: 'CI/CD pipeline for automated Lambda deployment',
  });
  pipelineStack.addDependency(monitoringStack);
}

// Add tags to all stacks
cdk.Tags.of(app).add('Project', 'Snapdragon-FOD');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
