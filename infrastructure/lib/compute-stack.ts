import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class ComputeStack extends cdk.Stack {
  public readonly purchaseHandler: lambda.Function;
  public readonly activationHandler: lambda.Function;
  public readonly deactivationHandler: lambda.Function;
  public readonly ackHandler: lambda.Function;
  public readonly catalogHandler: lambda.Function;
  public readonly getVehicleFeaturesHandler: lambda.Function;
  public readonly testActivationHandler: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Common environment variables
    const commonEnv = {
      NODE_ENV: 'production',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      MONGODB_SECRET_NAME: 'DatabaseStack/mongodb-connection',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://fod-user:fod-user@cluster.mongodb.net/fod-system?retryWrites=true&w=majority',
    };

    // Catalog Handler Lambda (with TypeScript bundling)
    this.catalogHandler = new lambdaNodejs.NodejsFunction(this, 'CatalogHandler', {
      entry: path.join(__dirname, '../../src/lambda/catalog-handler/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnv,
      description: 'Returns feature catalog',
      functionName: `${this.stackName}-CatalogHandler`,
      bundling: {
        minify: false,
        sourceMap: true,
        externalModules: ['aws-sdk'],
      },
    });

    // Get Vehicle Features Handler Lambda (with TypeScript bundling)
    this.getVehicleFeaturesHandler = new lambdaNodejs.NodejsFunction(this, 'GetVehicleFeaturesHandler', {
      entry: path.join(__dirname, '../../src/lambda/get-vehicle-features-handler/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: commonEnv,
      description: 'Returns active features for a vehicle',
      functionName: `${this.stackName}-GetVehicleFeaturesHandler`,
      bundling: {
        minify: false,
        sourceMap: true,
        externalModules: ['aws-sdk'],
      },
    });

    // Purchase Handler Lambda (JavaScript with node_modules)
    this.purchaseHandler = new lambda.Function(this, 'PurchaseHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../..')),
      handler: 'src/lambda/purchase-handler/index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: commonEnv,
      description: 'Handles feature purchase requests',
      functionName: `${this.stackName}-PurchaseHandler`,
    });

    // Activation Handler Lambda (JavaScript with node_modules)
    this.activationHandler = new lambda.Function(this, 'ActivationHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../..')),
      handler: 'src/lambda/activation-handler/index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: commonEnv,
      description: 'Handles feature activation after purchase',
      functionName: `${this.stackName}-ActivationHandler`,
    });

    // Deactivation Handler Lambda (JavaScript with node_modules)
    this.deactivationHandler = new lambda.Function(this, 'DeactivationHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../..')),
      handler: 'src/lambda/deactivation-handler/index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: commonEnv,
      description: 'Handles feature deactivation and expiration',
      functionName: `${this.stackName}-DeactivationHandler`,
    });

    // ACK Handler Lambda (JavaScript with node_modules)
    this.ackHandler = new lambda.Function(this, 'AckHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../..')),
      handler: 'src/lambda/ack-handler/index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: commonEnv,
      description: 'Processes acknowledgments from vehicles',
      functionName: `${this.stackName}-AckHandler`,
    });

    // Test Activation Handler Lambda (JavaScript with node_modules)
    this.testActivationHandler = new lambda.Function(this, 'TestActivationHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../..')),
      handler: 'src/lambda/test-activation-handler/index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: {
        ...commonEnv,
        HTTP_BRIDGE_URL: process.env.HTTP_BRIDGE_URL || '',
        HTTP_BRIDGE_API_KEY: process.env.HTTP_BRIDGE_API_KEY || '',
        HTTP_BRIDGE_TIMEOUT: '30000',
      },
      description: 'Test endpoint for complete activation flow via HTTP Bridge',
      functionName: `${this.stackName}-TestActivationHandler`,
    });

    // Output Lambda ARNs
    new cdk.CfnOutput(this, 'PurchaseHandlerArn', {
      value: this.purchaseHandler.functionArn,
      exportName: `${this.stackName}-PurchaseHandlerArn`,
    });

    new cdk.CfnOutput(this, 'ActivationHandlerArn', {
      value: this.activationHandler.functionArn,
      exportName: `${this.stackName}-ActivationHandlerArn`,
    });

    new cdk.CfnOutput(this, 'TestActivationHandlerArn', {
      value: this.testActivationHandler.functionArn,
      exportName: `${this.stackName}-TestActivationHandlerArn`,
    });
  }
}
