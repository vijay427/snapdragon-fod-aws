#!/bin/bash

# Snapdragon FOD AWS Deployment Validation Script
# This script validates that all AWS resources are deployed correctly

set -e

echo "=========================================="
echo "FOD System Deployment Validation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is installed${NC}"

# Check AWS credentials
echo ""
echo "Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=$(aws configure get region || echo "us-east-1")
    echo -e "${GREEN}✅ AWS credentials configured${NC}"
    echo "   Account: $ACCOUNT_ID"
    echo "   Region: $REGION"
else
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

# Function to check stack status
check_stack() {
    local stack_name=$1
    local status=$(aws cloudformation describe-stacks --stack-name "$stack_name" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$status" == "CREATE_COMPLETE" ] || [ "$status" == "UPDATE_COMPLETE" ]; then
        echo -e "${GREEN}✅ $stack_name: $status${NC}"
        return 0
    elif [ "$status" == "NOT_FOUND" ]; then
        echo -e "${RED}❌ $stack_name: NOT DEPLOYED${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  $stack_name: $status${NC}"
        return 1
    fi
}

# Check all FOD stacks
echo ""
echo "=========================================="
echo "Checking CloudFormation Stacks"
echo "=========================================="

STACKS=(
    "FOD-Network-dev"
    "FOD-Database-dev"
    "FOD-Compute-dev"
    "FOD-API-dev"
    "FOD-IoT-dev"
    "FOD-Monitoring-dev"
)

STACK_COUNT=0
for stack in "${STACKS[@]}"; do
    if check_stack "$stack"; then
        ((STACK_COUNT++))
    fi
done

echo ""
echo "Stacks deployed: $STACK_COUNT/${#STACKS[@]}"

# Get API Gateway URL
echo ""
echo "=========================================="
echo "API Gateway Information"
echo "=========================================="

API_URL=$(aws cloudformation describe-stacks --stack-name FOD-API-dev --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text 2>/dev/null || echo "")

if [ -n "$API_URL" ]; then
    echo -e "${GREEN}✅ API Gateway deployed${NC}"
    echo "   URL: $API_URL"
    
    # Test catalog endpoint
    echo ""
    echo "Testing /features/catalog endpoint..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}features/catalog" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Catalog endpoint responding (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${RED}❌ Catalog endpoint not responding (HTTP $HTTP_CODE)${NC}"
    fi
else
    echo -e "${RED}❌ API Gateway not found${NC}"
fi

# Check Lambda functions
echo ""
echo "=========================================="
echo "Lambda Functions"
echo "=========================================="

LAMBDAS=(
    "FOD-Compute-dev-CatalogHandler"
    "FOD-Compute-dev-PurchaseHandler"
    "FOD-Compute-dev-ActivationHandler"
    "FOD-Compute-dev-DeactivationHandler"
    "FOD-Compute-dev-AckHandler"
    "FOD-Compute-dev-GetVehicleFeaturesHandler"
    "FOD-Compute-dev-TestActivationHandler"
)

LAMBDA_COUNT=0
for lambda in "${LAMBDAS[@]}"; do
    if aws lambda get-function --function-name "$lambda" &> /dev/null; then
        echo -e "${GREEN}✅ $lambda${NC}"
        ((LAMBDA_COUNT++))
    else
        echo -e "${RED}❌ $lambda${NC}"
    fi
done

echo ""
echo "Lambda functions deployed: $LAMBDA_COUNT/${#LAMBDAS[@]}"

# Check IoT endpoint
echo ""
echo "=========================================="
echo "IoT Core"
echo "=========================================="

IOT_ENDPOINT=$(aws iot describe-endpoint --endpoint-type iot:Data-ATS --query 'endpointAddress' --output text 2>/dev/null || echo "")

if [ -n "$IOT_ENDPOINT" ]; then
    echo -e "${GREEN}✅ IoT Core endpoint: $IOT_ENDPOINT${NC}"
else
    echo -e "${RED}❌ IoT Core endpoint not found${NC}"
fi

# Check Secrets
echo ""
echo "=========================================="
echo "Secrets Manager"
echo "=========================================="

if aws secretsmanager describe-secret --secret-id "FOD-Database-dev/mongodb-connection" &> /dev/null; then
    echo -e "${GREEN}✅ MongoDB connection secret exists${NC}"
else
    echo -e "${RED}❌ MongoDB connection secret not found${NC}"
fi

if aws secretsmanager describe-secret --secret-id "FOD-Database-dev/signing-keys" &> /dev/null; then
    echo -e "${GREEN}✅ Message signing keys secret exists${NC}"
else
    echo -e "${RED}❌ Message signing keys secret not found${NC}"
fi

# Check VPC
echo ""
echo "=========================================="
echo "VPC and Networking"
echo "=========================================="

VPC_ID=$(aws cloudformation describe-stacks --stack-name FOD-Network-dev --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' --output text 2>/dev/null || echo "")

if [ -n "$VPC_ID" ]; then
    echo -e "${GREEN}✅ VPC created: $VPC_ID${NC}"
    
    # Check subnets
    SUBNET_COUNT=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets | length(@)' --output text 2>/dev/null || echo "0")
    echo "   Subnets: $SUBNET_COUNT"
else
    echo -e "${RED}❌ VPC not found${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="

if [ $STACK_COUNT -eq ${#STACKS[@]} ] && [ $LAMBDA_COUNT -eq ${#LAMBDAS[@]} ]; then
    echo -e "${GREEN}✅ All resources deployed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update MongoDB secret with your Atlas connection string"
    echo "2. Create IoT Things and certificates for vehicles"
    echo "3. Test API endpoints"
    echo "4. Configure CloudWatch alarms"
else
    echo -e "${YELLOW}⚠️  Some resources are missing or not deployed${NC}"
    echo ""
    echo "To deploy missing resources:"
    echo "  cd infrastructure"
    echo "  npm run deploy:dev"
fi

echo ""
echo "=========================================="
