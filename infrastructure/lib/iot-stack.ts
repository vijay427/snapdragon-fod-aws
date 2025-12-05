import * as cdk from 'aws-cdk-lib';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface IoTStackProps extends cdk.StackProps {
  ackHandler: lambda.Function;
}

export class IoTStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IoTStackProps) {
    super(scope, id, props);

    // IoT Topic Rule for vehicle acknowledgments
    const ackRule = new iot.CfnTopicRule(this, 'VehicleAckRule', {
      topicRulePayload: {
        sql: "SELECT * FROM 'vehicle/+/feature/ack'",
        description: 'Route vehicle acknowledgments to ACK handler',
        actions: [
          {
            lambda: {
              functionArn: props.ackHandler.functionArn,
            },
          },
        ],
        ruleDisabled: false,
      },
    });

    // Grant IoT permission to invoke Lambda
    // Use wildcard for sourceArn to avoid circular dependency
    props.ackHandler.addPermission('IoTInvokePermission', {
      principal: new cdk.aws_iam.ServicePrincipal('iot.amazonaws.com'),
      sourceArn: `arn:aws:iot:${this.region}:${this.account}:rule/*`,
    });

    // IoT Policy for vehicles (to be attached to certificates)
    const vehiclePolicy = new iot.CfnPolicy(this, 'VehiclePolicy', {
      policyName: `${this.stackName}-VehiclePolicy`,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['iot:Connect'],
            Resource: [`arn:aws:iot:${this.region}:${this.account}:client/\${iot:Connection.Thing.ThingName}`],
          },
          {
            Effect: 'Allow',
            Action: ['iot:Subscribe'],
            Resource: [
              `arn:aws:iot:${this.region}:${this.account}:topicfilter/vehicle/\${iot:Connection.Thing.ThingName}/feature/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['iot:Receive'],
            Resource: [
              `arn:aws:iot:${this.region}:${this.account}:topic/vehicle/\${iot:Connection.Thing.ThingName}/feature/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['iot:Publish'],
            Resource: [
              `arn:aws:iot:${this.region}:${this.account}:topic/vehicle/\${iot:Connection.Thing.ThingName}/feature/ack`,
              `arn:aws:iot:${this.region}:${this.account}:topic/vehicle/\${iot:Connection.Thing.ThingName}/telemetry`,
            ],
          },
        ],
      },
    });

    // Output IoT endpoint
    new cdk.CfnOutput(this, 'IoTEndpoint', {
      value: `${this.account}.iot.${this.region}.amazonaws.com`,
      description: 'IoT Core endpoint for vehicle connections',
      exportName: `${this.stackName}-IoTEndpoint`,
    });
  }
}
