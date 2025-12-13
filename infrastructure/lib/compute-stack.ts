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

    // Common exclusion patterns for Lambda assets - CRITICAL: Prevent recursive inclusion
    const commonExclusions = [
      // CRITICAL: Prevent recursive CDK output inclusion
      '**/cdk.out/**',
      'cdk.out/**',
      'cdk.out',
      
      // CRITICAL: Prevent infrastructure directory inclusion
      '**/infrastructure/**',
      'infrastructure/**',
      'infrastructure',
      
      // Node modules and build artifacts
      '**/node_modules/**',
      'node_modules/**',
      'node_modules',
      '**/dist/**',
      'dist/**',
      'dist',
      
      // Version control and CI/CD
      '**/.git/**',
      '.git/**',
      '.git',
      '**/.github/**',
      '.github/**',
      '.github',
      
      // Test files
      '**/*.test.ts',
      '**/*.test.js',
      '*.test.ts',
      '*.test.js',
      '**/*.spec.ts',
      '**/*.spec.js',
      '*.spec.ts',
      '*.spec.js',
      '**/tests/**',
      'tests/**',
      'tests',
      '**/coverage/**',
      'coverage/**',
      'coverage',
      '**/.nyc_output/**',
      '.nyc_output/**',
      '.nyc_output',
      
      // Documentation and config files
      '**/*.md',
      '*.md',
      '**/docs/**',
      'docs/**',
      'docs',
      'jest.config.*',
      'tsconfig.json',
      '.eslintrc.*',
      '.prettierrc.*',
      
      // Environment and system files
      '.env*',
      '.DS_Store',
      '*.log',
      '**/.vscode/**',
      '.vscode/**',
      '.vscode',
      
      // Project-specific exclusions
      '**/mcp-servers/**',
      'mcp-servers/**',
      'mcp-servers',
      '**/scripts/**',
      'scripts/**',
      'scripts',
      '*.ps1',
      '*.bat',
      '*.exe',
      'FOD-System-Postman-Collection.json',
      'DEPLOYMENT_STATUS.md',
      'QUALCOMM_*.md',
      '*.html',
      'api-test-ui.html',
      'test-simulator.js',
      'push-to-github.ps1',
      'ngrok.exe',
      '.lambda-changes.json',
      
      // Kiro-specific exclusions
      '**/.kiro/**',
      '.kiro/**',
      '.kiro'
    ];

    // Helper method to create Lambda asset with proper exclusions
    const createLambdaAsset = (functionName: string): lambda.Code => {
      return lambda.Code.fromAsset(path.join(__dirname, `../../src/lambda/${functionName}`), {
        exclude: commonExclusions,
        ignoreMode: cdk.IgnoreMode.GLOB,
        followSymlinks: cdk.SymlinkFollowMode.NEVER,
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c', [
              'echo "Starting Lambda bundling for ' + functionName + '"',
              'cp -r /asset-input/* /asset-output/ 2>/dev/null || true',
              'cd /asset-output',
              'find . -name "cdk.out" -type d -exec rm -rf {} + 2>/dev/null || true',
              'find . -name "infrastructure" -type d -exec rm -rf {} + 2>/dev/null || true',
              'find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true',
              'find . -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true',
              'find . -name "*.test.*" -type f -delete 2>/dev/null || true',
              'find . -name "*.spec.*" -type f -delete 2>/dev/null || true',
              'echo "Bundling complete for ' + functionName + '"'
            ].join(' && ')
          ],
          user: 'root'
        }
      });
    };

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
      logRetention: logs.RetentionDays.THREE_MONTHS,
      bundling: {
        minify: true,
        sourceMap: false,
        externalModules: ['aws-sdk'],
        nodeModules: ['mongodb'],
        target: 'es2020',
        format: lambdaNodejs.OutputFormat.CJS,
        mainFields: ['main'],
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (inputDir: string, outputDir: string) => [
            `cp -r ${inputDir}/../../src/shared ${outputDir}/shared 2>/dev/null || true`
          ]
        }
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
      logRetention: logs.RetentionDays.THREE_MONTHS,
      bundling: {
        minify: true,
        sourceMap: false,
        externalModules: ['aws-sdk'],
        nodeModules: ['mongodb'],
        target: 'es2020',
        format: lambdaNodejs.OutputFormat.CJS,
        mainFields: ['main'],
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (inputDir: string, outputDir: string) => [
            `cp -r ${inputDir}/../../src/shared ${outputDir}/shared 2>/dev/null || true`
          ]
        }
      },
    });

    // Purchase Handler Lambda (JavaScript with individual bundling)
    this.purchaseHandler = new lambda.Function(this, 'PurchaseHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: createLambdaAsset('purchase-handler'),
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: commonEnv,
      description: 'Handles feature purchase requests',
      functionName: `${this.stackName}-PurchaseHandler`,
    });

    // Activation Handler Lambda (JavaScript with individual bundling)
    this.activationHandler = new lambda.Function(this, 'ActivationHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: createLambdaAsset('activation-handler'),
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: commonEnv,
      description: 'Handles feature activation after purchase',
      functionName: `${this.stackName}-ActivationHandler`,
    });

    // Deactivation Handler Lambda (JavaScript with individual bundling)
    this.deactivationHandler = new lambda.Function(this, 'DeactivationHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: createLambdaAsset('deactivation-handler'),
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: commonEnv,
      description: 'Handles feature deactivation and expiration',
      functionName: `${this.stackName}-DeactivationHandler`,
    });

    // ACK Handler Lambda (JavaScript with individual bundling)
    this.ackHandler = new lambda.Function(this, 'AckHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: createLambdaAsset('ack-handler'),
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: commonEnv,
      description: 'Processes acknowledgments from vehicles',
      functionName: `${this.stackName}-AckHandler`,
    });

    // Test Activation Handler Lambda (JavaScript with individual bundling)
    this.testActivationHandler = new lambda.Function(this, 'TestActivationHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: createLambdaAsset('test-activation-handler'),
      handler: 'index.handler',
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
