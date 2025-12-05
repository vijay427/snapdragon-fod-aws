import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  purchaseHandler: lambda.Function;
  activationHandler: lambda.Function;
  deactivationHandler: lambda.Function;
  catalogHandler: lambda.Function;
  getVehicleFeaturesHandler: lambda.Function;
  testActivationHandler: lambda.Function;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create REST API
    this.api = new apigateway.RestApi(this, 'FOD-API', {
      restApiName: `${this.stackName}-API`,
      description: 'Feature on Demand API',
      deployOptions: {
        stageName: 'v1',
        throttlingRateLimit: 50,
        throttlingBurstLimit: 100,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // /features resource
    const features = this.api.root.addResource('features');

    // POST /features/purchase
    const purchase = features.addResource('purchase');
    purchase.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.purchaseHandler, {
        proxy: true,
      })
    );

    // POST /features/activate
    const activate = features.addResource('activate');
    activate.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.activationHandler, {
        proxy: true,
      })
    );

    // GET /features/catalog
    const catalog = features.addResource('catalog');
    catalog.addMethod(
      'GET',
      new apigateway.LambdaIntegration(props.catalogHandler, {
        proxy: true,
      })
    );

    // /vehicles resource
    const vehicles = this.api.root.addResource('vehicles');
    const vehicle = vehicles.addResource('{vehicleId}');
    const vehicleFeatures = vehicle.addResource('features');

    // GET /vehicles/{vehicleId}/features
    vehicleFeatures.addMethod(
      'GET',
      new apigateway.LambdaIntegration(props.getVehicleFeaturesHandler, {
        proxy: true,
      })
    );

    // DELETE /vehicles/{vehicleId}/features/{featureId}
    const vehicleFeature = vehicleFeatures.addResource('{featureId}');
    vehicleFeature.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(props.deactivationHandler, {
        proxy: true,
      })
    );

    // POST /test-activation - Test endpoint for complete activation flow
    const testActivation = this.api.root.addResource('test-activation');
    testActivation.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.testActivationHandler, {
        proxy: true,
      })
    );

    // Output API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: `${this.stackName}-ApiUrl`,
    });
  }
}
