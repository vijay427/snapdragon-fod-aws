import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface PipelineStackProps extends cdk.StackProps {
  environment: string;
  githubRepo: string;
  githubOwner: string;
  githubBranch: string;
  notificationEmail?: string;
}

export class PipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // S3 Bucket for pipeline artifacts (encrypted, versioned)
    this.artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `fod-pipeline-artifacts-${props.environment}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // GitHub OAuth token from Secrets Manager
    const githubToken = secretsmanager.Secret.fromSecretNameV2(
      this,
      'GitHubToken',
      'github-oauth-token'
    );

    // CodeBuild project for building Lambda functions
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `FOD-Build-${props.environment}`,
      description: 'Build FOD Lambda functions and prepare deployment artifacts',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      environmentVariables: {
        ENVIRONMENT: {
          value: props.environment,
        },
        MONGODB_URI: {
          value: 'DatabaseStack/mongodb-connection',
          type: codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: [
              'echo "Installing dependencies..."',
              'npm ci',
              'cd infrastructure',
              'npm ci',
              'cd ..',
            ],
          },
          pre_build: {
            commands: [
              'echo "Running linter..."',
              'npm run lint',
              'echo "Running tests..."',
              'npm run test',
            ],
          },
          build: {
            commands: [
              'echo "Building TypeScript..."',
              'npm run build',
              'echo "Build completed successfully"',
            ],
          },
          post_build: {
            commands: [
              'echo "Preparing artifacts..."',
              'echo "Build completed at $(date)"',
            ],
          },
        },
        artifacts: {
          files: [
            '**/*',
          ],
          'exclude-paths': [
            'node_modules/**/*',
            '.git/**/*',
            'tests/**/*',
          ],
        },
        cache: {
          paths: [
            'node_modules/**/*',
            'infrastructure/node_modules/**/*',
          ],
        },
      }),
      cache: codebuild.Cache.bucket(this.artifactBucket, {
        prefix: 'build-cache',
      }),
    });

    // Grant permissions to read MongoDB secret
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:DatabaseStack/mongodb-connection*`,
        ],
      })
    );

    // CodeBuild project for CDK deployment
    const deployProject = new codebuild.PipelineProject(this, 'DeployProject', {
      projectName: `FOD-Deploy-${props.environment}`,
      description: 'Deploy FOD infrastructure using AWS CDK',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      environmentVariables: {
        ENVIRONMENT: {
          value: props.environment,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: [
              'npm install -g aws-cdk',
              'cd infrastructure',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'echo "Synthesizing CDK stacks..."',
              'cdk synth',
              'echo "Deploying CDK stacks..."',
              'cdk deploy --all --require-approval never',
            ],
          },
        },
      }),
    });

    // Grant CDK deployment permissions
    deployProject.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:*',
          'lambda:*',
          'apigateway:*',
          'iot:*',
          'ec2:*',
          'logs:*',
          'iam:*',
          's3:*',
          'dynamodb:*',
          'cloudwatch:*',
          'secretsmanager:GetSecretValue',
        ],
        resources: ['*'],
      })
    );

    // Pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create the pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'FODPipeline', {
      pipelineName: `FOD-Pipeline-${props.environment}`,
      artifactBucket: this.artifactBucket,
      restartExecutionOnUpdate: true,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: props.githubOwner,
              repo: props.githubRepo,
              branch: props.githubBranch,
              oauthToken: githubToken.secretValue,
              output: sourceOutput,
              trigger: codepipeline_actions.GitHubTrigger.NONE, // Manual trigger only
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build_Lambda_Functions',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Deploy_CDK_Stacks',
              project: deployProject,
              input: buildOutput,
            }),
          ],
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'CodePipeline name',
      exportName: `${this.stackName}-PipelineName`,
    });

    new cdk.CfnOutput(this, 'PipelineConsoleUrl', {
      value: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${this.pipeline.pipelineName}/view`,
      description: 'Pipeline console URL',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
    });

    // Add tags for cost tracking
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Project', 'FOD-System');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
