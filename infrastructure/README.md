# FOD Infrastructure

AWS CDK infrastructure for Snapdragon Feature on Demand system.

## Stacks

1. **NetworkStack**: VPC, subnets, security groups
2. **DatabaseStack**: MongoDB Atlas connection secrets
3. **ComputeStack**: Lambda functions
4. **ApiStack**: API Gateway
5. **IoTStack**: AWS IoT Core
6. **MonitoringStack**: CloudWatch dashboards and alarms

## Deployment

```bash
cd infrastructure
npm install
npm run build
npm run deploy:dev
```

## Configuration

Set context in cdk.json or via command line:
- `stackPrefix`: Prefix for all stacks (default: FOD)
- `environment`: dev or prod (default: dev)
