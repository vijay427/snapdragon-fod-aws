/**
 * Test Activation Handler Lambda Function
 * Orchestrates complete activation flow: purchase → subscription → HTTP Bridge → simulator
 * For testing without IoT Core infrastructure
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { TransactionRepository } from '../../shared/repositories/TransactionRepository';
import { SubscriptionRepository } from '../../shared/repositories/SubscriptionRepository';
import { Transaction, Subscription } from '../../shared/models';

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI || '';
const HTTP_BRIDGE_URL = process.env.HTTP_BRIDGE_URL || '';
const HTTP_BRIDGE_API_KEY = process.env.HTTP_BRIDGE_API_KEY;
const HTTP_BRIDGE_TIMEOUT = parseInt(process.env.HTTP_BRIDGE_TIMEOUT || '30000', 10);

// Initialize repositories
const transactionRepo = new TransactionRepository();
const subscriptionRepo = new SubscriptionRepository();

// Correlation ID for request tracing
function generateCorrelationId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// CORS headers
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const correlationId = generateCorrelationId();
  const startTime = Date.now();
  const timing: Record<string, number> = {};

  console.log('Test activation request received', { correlationId, event: JSON.stringify(event) });

  try {
    // Parse and validate request
    const validationStart = Date.now();
    
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: { 
            code: 'INVALID_REQUEST', 
            message: 'Request body required',
            correlationId
          },
        }),
      };
    }

    const body = JSON.parse(event.body);
    const { vehicleId, featureId, userId, duration, isPermanent } = body;

    // Input validation
    if (!vehicleId || !featureId || !userId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'vehicleId, featureId, and userId are required',
            correlationId
          },
        }),
      };
    }

    if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'duration must be a positive number',
            correlationId
          },
        }),
      };
    }

    timing.validation = Date.now() - validationStart;

    // Step 1: Create transaction
    const transactionStart = Date.now();
    const transactionId = uuidv4();
    const transaction: Transaction = {
      transactionId,
      vehicleId,
      featureId,
      amount: 99.99, // Mock amount
      status: 'COMPLETED',
      paymentMethod: 'TEST',
      timestamp: new Date()
    };

    await transactionRepo.create(transaction);
    console.log('Transaction created', { correlationId, transactionId });
    timing.transaction = Date.now() - transactionStart;

    // Step 2: Create subscription
    const subscriptionStart = Date.now();
    const subscriptionId = uuidv4();
    const purchasedAt = new Date();
    const activatedAt = new Date();
    const expiresAt = isPermanent ? undefined : (duration ? new Date(activatedAt.getTime() + duration * 60 * 60 * 1000) : undefined);

    const subscription: Subscription = {
      subscriptionId,
      vehicleId,
      featureId,
      status: 'ACTIVE',
      purchasedAt,
      activatedAt,
      expiresAt,
      isPermanent: isPermanent || false
    };

    await subscriptionRepo.create(subscription);
    console.log('Subscription created', { correlationId, subscriptionId });
    timing.subscription = Date.now() - subscriptionStart;

    // Step 3: Call HTTP Bridge to activate feature on simulator
    const activationStart = Date.now();
    
    if (!HTTP_BRIDGE_URL) {
      throw new Error('HTTP_BRIDGE_URL environment variable not configured');
    }

    const bridgeHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (HTTP_BRIDGE_API_KEY) {
      bridgeHeaders['Authorization'] = `Bearer ${HTTP_BRIDGE_API_KEY}`;
    }

    const activationResponse = await axios.post(
      `${HTTP_BRIDGE_URL}/api/vehicle/${vehicleId}/activate`,
      {
        featureId,
        duration
      },
      {
        headers: bridgeHeaders,
        timeout: HTTP_BRIDGE_TIMEOUT
      }
    );

    console.log('Feature activated on simulator', { 
      correlationId, 
      vehicleId, 
      featureId,
      response: activationResponse.data
    });
    timing.activation = Date.now() - activationStart;

    // Step 4: Verify vehicle state
    const verificationStart = Date.now();
    const stateResponse = await axios.get(
      `${HTTP_BRIDGE_URL}/api/vehicle/${vehicleId}/state`,
      {
        headers: bridgeHeaders,
        timeout: HTTP_BRIDGE_TIMEOUT
      }
    );

    console.log('Vehicle state retrieved', { 
      correlationId, 
      vehicleId,
      state: stateResponse.data
    });
    timing.verification = Date.now() - verificationStart;

    // Build complete response
    const totalTime = Date.now() - startTime;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        data: {
          transaction: {
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            timestamp: transaction.timestamp.toISOString()
          },
          subscription: {
            subscriptionId: subscription.subscriptionId,
            featureId: subscription.featureId,
            activatedAt: subscription.activatedAt?.toISOString(),
            expiresAt: subscription.expiresAt?.toISOString(),
            isPermanent: subscription.isPermanent
          },
          activation: {
            vehicleId,
            featureId,
            status: 'ACTIVATED',
            activatedAt: activationResponse.data.data.activatedAt
          },
          vehicleState: stateResponse.data.data,
          timing: {
            totalMs: totalTime,
            steps: timing
          }
        },
        correlationId,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error: any) {
    console.error('Test activation failed', { 
      correlationId, 
      error: error.message,
      stack: error.stack
    });

    // Determine error type and status code
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      statusCode = 503;
      errorCode = 'BRIDGE_UNAVAILABLE';
    } else if (error.response?.status === 503) {
      statusCode = 503;
      errorCode = 'MCP_UNAVAILABLE';
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
    }

    return {
      statusCode,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: {
          code: errorCode,
          message: error.message,
          details: error.response?.data,
          correlationId
        },
        timestamp: new Date().toISOString()
      }),
    };
  }
}

