import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  purchaseHandler: lambda.Function;
  activationHandler: lambda.Function;
  deactivationHandler: lambda.Function;
  api: apigateway.RestApi;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'FOD-Dashboard', {
      dashboardName: `${this.stackName}-Dashboard`,
    });

    // Lambda metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          props.purchaseHandler.metricInvocations(),
          props.activationHandler.metricInvocations(),
          props.deactivationHandler.metricInvocations(),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          props.purchaseHandler.metricErrors(),
          props.activationHandler.metricErrors(),
          props.deactivationHandler.metricErrors(),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [
          props.purchaseHandler.metricDuration(),
          props.activationHandler.metricDuration(),
          props.deactivationHandler.metricDuration(),
        ],
      })
    );

    // API Gateway metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests',
        left: [props.api.metricCount()],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Latency',
        left: [props.api.metricLatency()],
      })
    );

    // Alarms
    // High error rate alarm
    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRate', {
      metric: props.purchaseHandler.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when error rate is high',
      alarmName: `${this.stackName}-HighErrorRate`,
    });

    // High latency alarm
    const latencyAlarm = new cloudwatch.Alarm(this, 'HighLatency', {
      metric: props.api.metricLatency({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10000, // 10 seconds
      evaluationPeriods: 2,
      alarmDescription: 'Alert when API latency is high',
      alarmName: `${this.stackName}-HighLatency`,
    });

    // Output dashboard URL
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
