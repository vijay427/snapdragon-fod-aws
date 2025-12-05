import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
  public readonly mongoDbSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create secret for MongoDB Atlas connection string
    // Note: After deployment, update this secret with your actual MongoDB Atlas connection string
    // Format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
    this.mongoDbSecret = new secretsmanager.Secret(this, 'MongoDBConnectionString', {
      secretName: `${this.stackName}/mongodb-connection`,
      description: 'MongoDB Atlas connection string for FOD system',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          connectionString: 'mongodb+srv://fod-user:REPLACE_WITH_PASSWORD@cluster.mongodb.net/fod-system?retryWrites=true&w=majority',
          database: 'fod-system',
          username: 'fod-user',
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Create secret for message signing keys
    const signingKeySecret = new secretsmanager.Secret(this, 'MessageSigningKeys', {
      secretName: `${this.stackName}/signing-keys`,
      description: 'ECDSA keys for message signing and verification',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          algorithm: 'ECDSA-SHA256',
        }),
        generateStringKey: 'privateKey',
        excludePunctuation: true,
        includeSpace: false,
      },
    });

    // Output secret ARNs
    new cdk.CfnOutput(this, 'MongoDBSecretArn', {
      value: this.mongoDbSecret.secretArn,
      description: 'MongoDB connection secret ARN',
      exportName: `${this.stackName}-MongoDBSecretArn`,
    });

    new cdk.CfnOutput(this, 'SigningKeySecretArn', {
      value: signingKeySecret.secretArn,
      description: 'Message signing key secret ARN',
      exportName: `${this.stackName}-SigningKeySecretArn`,
    });
  }
}
