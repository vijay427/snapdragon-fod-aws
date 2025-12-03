---
inclusion: always
---

# AWS Resource Creation and Security Standards

## Purpose
This document defines the coding and security standards for creating AWS resources in the FOD system. All AWS resource creation code must reference and comply with these standards.

## AWS Resource Standards

### 1. IAM and Access Control
- **Principle of Least Privilege**: Grant only the minimum permissions required
- **No Hardcoded Credentials**: Use IAM roles, AWS Secrets Manager, or Parameter Store
- **MFA Required**: Enable MFA for all human users accessing AWS console
- **Role-Based Access**: Use IAM roles for service-to-service communication
- **Resource Policies**: Apply resource-based policies for cross-account access

### 2. Lambda Functions
```typescript
// REQUIRED: All Lambda functions must include
- Runtime: Node.js 18.x or Python 3.11+ (latest stable)
- Timeout: Maximum 30 seconds for API operations, 5 minutes for batch
- Memory: Minimum 512MB for production workloads
- Environment Variables: Encrypted using AWS KMS
- VPC Configuration: Deploy in private subnets with NAT gateway
- Dead Letter Queue: Configure SQS DLQ for failed invocations
- Reserved Concurrency: Set limits to prevent runaway costs
```

**Example Lambda Configuration:**
```typescript
const lambdaFunction = new lambda.Function(this, 'FeatureActivation', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  timeout: Duration.seconds(30),
  memorySize: 512,
  environment: {
    ENCRYPTION_KEY_ID: kmsKey.keyId,
    DB_CONNECTION: secretsManager.secretArn
  },
  vpc: vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  deadLetterQueue: dlq,
  reservedConcurrentExecutions: 100
});
```

### 3. API Gateway
- **Authentication**: Use AWS IAM, Cognito, or Lambda authorizers
- **Rate Limiting**: Implement throttling (burst: 100, rate: 50 req/sec)
- **CORS**: Configure only for required origins
- **Request Validation**: Enable request/response validation models
- **Logging**: Enable CloudWatch Logs with INFO level minimum
- **WAF**: Attach AWS WAF for DDoS protection

### 4. DynamoDB / Database
- **Encryption**: Enable encryption at rest using AWS KMS
- **Backup**: Enable point-in-time recovery (PITR)
- **Capacity**: Use on-demand billing for unpredictable workloads
- **Global Tables**: Consider for multi-region deployments
- **Indexes**: Limit GSIs to essential queries only
- **TTL**: Enable TTL for time-limited features

**For MongoDB Atlas:**
- Use VPC peering or PrivateLink
- Enable encryption in transit (TLS 1.2+)
- Configure IP whitelist for AWS VPC CIDR blocks
- Enable audit logging

### 5. IoT Core (for Car-to-Cloud Communication)
- **Device Certificates**: Use X.509 certificates for device authentication
- **Policies**: Attach least-privilege IoT policies to certificates
- **Topics**: Use hierarchical topic structure: `vehicle/{vehicleId}/feature/{action}`
- **Rules**: Validate message format before processing
- **Logging**: Enable CloudWatch Logs for connection and message logs

### 6. Secrets Management
- **AWS Secrets Manager**: Store database credentials, API keys, certificates
- **Rotation**: Enable automatic rotation for database credentials (30 days)
- **KMS Encryption**: Use customer-managed KMS keys
- **Access Logging**: Enable CloudTrail for secret access auditing

### 7. Networking
- **VPC**: Deploy all resources in VPC with public/private subnet separation
- **Security Groups**: Deny all by default, allow specific ports only
- **NACLs**: Use as additional layer for subnet-level filtering
- **VPC Endpoints**: Use for AWS service communication (S3, DynamoDB, Secrets Manager)
- **TLS**: Enforce TLS 1.3 for all external communications

### 8. Monitoring and Logging
- **CloudWatch Metrics**: Enable detailed monitoring for all services
- **CloudWatch Alarms**: Set alarms for error rates, latency, throttling
- **CloudTrail**: Enable for all API calls with log file validation
- **X-Ray**: Enable distributed tracing for Lambda and API Gateway
- **Log Retention**: Minimum 90 days for compliance

### 9. Cost Optimization
- **Tagging**: Tag all resources with: Environment, Project, Owner, CostCenter
- **Budget Alerts**: Set up AWS Budgets with 80% and 100% thresholds
- **Reserved Capacity**: Use for predictable workloads
- **Lifecycle Policies**: Archive old logs to S3 Glacier

### 10. Disaster Recovery
- **Backup Strategy**: Automated daily backups with 30-day retention
- **Multi-AZ**: Deploy critical services across multiple availability zones
- **RTO/RPO**: Target RTO < 1 hour, RPO < 15 minutes
- **Runbooks**: Document recovery procedures

## Security Checklist for Code Reviews

Before deploying any AWS resource:
- [ ] No hardcoded credentials or secrets
- [ ] IAM roles follow least privilege
- [ ] Encryption enabled at rest and in transit
- [ ] Logging and monitoring configured
- [ ] Resource tags applied
- [ ] Security groups restrict access appropriately
- [ ] Backup and recovery tested
- [ ] Cost estimates reviewed
- [ ] Compliance requirements met (if applicable)

## Compliance Requirements

### Data Privacy
- **PII Handling**: Encrypt all personally identifiable information
- **Data Residency**: Store data in appropriate AWS regions per regulations
- **Retention**: Implement data retention policies per legal requirements

### Automotive Standards
- **ISO 26262**: Follow functional safety guidelines for critical features
- **UNECE WP.29**: Comply with cybersecurity regulations for connected vehicles
