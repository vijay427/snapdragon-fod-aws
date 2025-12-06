import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';
import * as fs from 'fs';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

interface LambdaConfig {
  name: string;
  directory: string;
  description: string;
  timeout?: number;
  memorySize?: number;
  environment?: { [key: string]: string };
}

export class ComputeStackDynamic extends cdk.Stack {
  public readonly lambdaFunctions: Map<string, lambda.Function> = new Map();

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Common environment variables
    const commonEnv = {
      NODE_ENV: 'production',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      MONGODB_SECRET_NAME: 'DatabaseStack/mongodb-connection',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://fod-user:fod-user@cluster.mongodb.net/fod-system?retryWrites=true&w=majority',
    };

    // Automatically discover all Lambda functions
    const lambdaConfigs = this.discoverLambdaFunctions();

    // Create Lambda functions dynamically
    lambdaConfigs.forEach(config => {
      const lambdaFunction = this.createLambdaFunction(config, commonEnv);
      this.lambdaFunctions.set(config.name, lambdaFunction);

      // Create CloudFormation output
      new cdk.CfnOutput(this, `${config.name}Arn`, {
        value: lambdaFunction.functionArn,
        exportName: `${this.stackName}-${config.name}Arn`,
      });
    });

    // Output summary
    new cdk.CfnOutput(this, 'TotalLambdaFunctions', {
      value: this.lambdaFunctions.size.toString(),
      description: 'Total number of Lambda functions deployed',
    });
  }

  /**
   * Discover all Lambda functions in src/lambda directory
   */
  private discoverLambdaFunctions(): LambdaConfig[] {
    const lambdaDir = path.join(__dirname, '../../src/lambda');
    const configs: LambdaConfig[] = [];

    try {
      const entries = fs.readdirSync(lambdaDir, { withFileTypes: true });

      entries.forEach(entry => {
        if (entry.isDirectory()) {
          const lambdaPath = path.join(lambdaDir, entry.name);
          const indexTs = path.join(lambdaPath, 'index.ts');
          const indexJs = path.join(lambdaPath, 'index.js');

          // Check if Lambda has an entry point
          if (fs.existsSync(indexTs) || fs.existsSync(indexJs)) {
            configs.push({
              name: this.toPascalCase(entry.name),
              directory: entry.name,
              description: this.generateDescription(entry.name),
              timeout: this.getTimeout(entry.name),
              memorySize: 512,
              environment: this.getCustomEnvironment(entry.name),
            });
          }
        }
      });

      console.log(`✅ Discovered ${configs.length} Lambda functions`);
      configs.forEach(config => console.log(`   • ${config.directory} → ${config.name}`));

    } catch (error) {
      console.error('❌ Error discovering Lambda functions:', error);
    }

    return configs;
  }

  /**
   * Create a Lambda function based on configuration
   */
  private createLambdaFunction(
    config: LambdaConfig,
    commonEnv: { [key: string]: string }
  ): lambda.Function {
    const entryPath = path.join(__dirname, `../../src/lambda/${config.directory}/index.ts`);
    const environment = { ...commonEnv, ...config.environment };

    // Use NodejsFunction for TypeScript bundling
    if (fs.existsSync(entryPath)) {
      return new lambdaNodejs.NodejsFunction(this, config.name, {
        entry: entryPath,
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        memorySize: config.memorySize || 512,
        timeout: cdk.Duration.seconds(config.timeout || 30),
        environment,
        description: config.description,
        functionName: `${this.stackName}-${config.name}`,
        logRetention: logs.RetentionDays.THREE_MONTHS,
        bundling: {
          minify: false,
          sourceMap: true,
          externalModules: ['aws-sdk'],
        },
      });
    }

    // Fallback to regular Function for JavaScript
    return new lambda.Function(this, config.name, {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../..')),
      handler: `src/lambda/${config.directory}/index.handler`,
      memorySize: config.memorySize || 512,
      timeout: cdk.Duration.seconds(config.timeout || 30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment,
      description: config.description,
      functionName: `${this.stackName}-${config.name}`,
    });
  }

  /**
   * Convert kebab-case to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Generate description from Lambda name
   */
  private generateDescription(directory: string): string {
    const descriptions: { [key: string]: string } = {
      'purchase-handler': 'Handles feature purchase requests',
      'activation-handler': 'Handles feature activation after purchase',
      'deactivation-handler': 'Handles feature deactivation and expiration',
      'ack-handler': 'Processes acknowledgments from vehicles',
      'catalog-handler': 'Returns feature catalog',
      'get-vehicle-features-handler': 'Returns active features for a vehicle',
      'test-activation-handler': 'Test endpoint for complete activation flow via HTTP Bridge',
    };

    return descriptions[directory] || `Lambda function for ${directory}`;
  }

  /**
   * Get custom timeout for specific Lambda functions
   */
  private getTimeout(directory: string): number {
    const timeouts: { [key: string]: number } = {
      'test-activation-handler': 60,
      'purchase-handler': 45,
    };

    return timeouts[directory] || 30;
  }

  /**
   * Get custom environment variables for specific Lambda functions
   */
  private getCustomEnvironment(directory: string): { [key: string]: string } {
    if (directory === 'test-activation-handler') {
      return {
        HTTP_BRIDGE_URL: process.env.HTTP_BRIDGE_URL || '',
        HTTP_BRIDGE_API_KEY: process.env.HTTP_BRIDGE_API_KEY || '',
        HTTP_BRIDGE_TIMEOUT: '30000',
      };
    }

    return {};
  }

  /**
   * Get Lambda function by name
   */
  public getLambdaFunction(name: string): lambda.Function | undefined {
    return this.lambdaFunctions.get(name);
  }

  /**
   * Get all Lambda function names
   */
  public getLambdaFunctionNames(): string[] {
    return Array.from(this.lambdaFunctions.keys());
  }
}
