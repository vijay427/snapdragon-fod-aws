"use strict";
/**
 * Test Activation Handler Lambda Function
 * Orchestrates complete activation flow: purchase → subscription → HTTP Bridge → simulator
 * For testing without IoT Core infrastructure
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const axios_1 = __importStar(require("axios"));
const uuid_1 = require("uuid");
const TransactionRepository_1 = require("../../shared/repositories/TransactionRepository");
const SubscriptionRepository_1 = require("../../shared/repositories/SubscriptionRepository");
// Environment variables
const HTTP_BRIDGE_URL = process.env.HTTP_BRIDGE_URL || '';
const HTTP_BRIDGE_API_KEY = process.env.HTTP_BRIDGE_API_KEY;
const HTTP_BRIDGE_TIMEOUT = parseInt(process.env.HTTP_BRIDGE_TIMEOUT || '30000', 10);
// Initialize repositories
const transactionRepo = new TransactionRepository_1.TransactionRepository();
const subscriptionRepo = new SubscriptionRepository_1.SubscriptionRepository();
// Correlation ID for request tracing
function generateCorrelationId() {
    return `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
// CORS headers
const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
};
async function handler(event) {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    const timing = {};
    // eslint-disable-next-line no-console
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
                        correlationId,
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
                        correlationId,
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
                        correlationId,
                    },
                }),
            };
        }
        timing.validation = Date.now() - validationStart;
        // Step 1: Create transaction
        const transactionStart = Date.now();
        const transactionId = (0, uuid_1.v4)();
        const transaction = {
            transactionId,
            vehicleId,
            featureId,
            amount: 99.99, // Mock amount
            status: 'COMPLETED',
            paymentMethod: 'TEST',
            timestamp: new Date(),
        };
        await transactionRepo.create(transaction);
        // eslint-disable-next-line no-console
        console.log('Transaction created', { correlationId, transactionId });
        timing.transaction = Date.now() - transactionStart;
        // Step 2: Create subscription
        const subscriptionStart = Date.now();
        const subscriptionId = (0, uuid_1.v4)();
        const purchasedAt = new Date();
        const activatedAt = new Date();
        const expiresAt = isPermanent
            ? undefined
            : duration
                ? new Date(activatedAt.getTime() + duration * 60 * 60 * 1000)
                : undefined;
        const subscription = {
            subscriptionId,
            vehicleId,
            featureId,
            status: 'ACTIVE',
            purchasedAt,
            activatedAt,
            expiresAt,
            isPermanent: isPermanent ?? false,
        };
        await subscriptionRepo.create(subscription);
        // eslint-disable-next-line no-console
        console.log('Subscription created', { correlationId, subscriptionId });
        timing.subscription = Date.now() - subscriptionStart;
        // Step 3: Call HTTP Bridge to activate feature on simulator
        const activationStart = Date.now();
        if (!HTTP_BRIDGE_URL) {
            throw new Error('HTTP_BRIDGE_URL environment variable not configured');
        }
        const bridgeHeaders = {
            'Content-Type': 'application/json',
        };
        if (HTTP_BRIDGE_API_KEY) {
            bridgeHeaders['Authorization'] = `Bearer ${HTTP_BRIDGE_API_KEY}`;
        }
        const activationResponse = await axios_1.default.post(`${HTTP_BRIDGE_URL}/api/vehicle/${vehicleId}/activate`, {
            featureId,
            duration,
        }, {
            headers: bridgeHeaders,
            timeout: HTTP_BRIDGE_TIMEOUT,
        });
        // eslint-disable-next-line no-console
        console.log('Feature activated on simulator', {
            correlationId,
            vehicleId,
            featureId,
            response: activationResponse.data,
        });
        timing.activation = Date.now() - activationStart;
        // Step 4: Verify vehicle state
        const verificationStart = Date.now();
        const stateResponse = await axios_1.default.get(`${HTTP_BRIDGE_URL}/api/vehicle/${vehicleId}/state`, {
            headers: bridgeHeaders,
            timeout: HTTP_BRIDGE_TIMEOUT,
        });
        // eslint-disable-next-line no-console
        console.log('Vehicle state retrieved', {
            correlationId,
            vehicleId,
            state: stateResponse.data,
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
                        timestamp: transaction.timestamp.toISOString(),
                    },
                    subscription: {
                        subscriptionId: subscription.subscriptionId,
                        featureId: subscription.featureId,
                        activatedAt: subscription.activatedAt?.toISOString(),
                        expiresAt: subscription.expiresAt?.toISOString(),
                        isPermanent: subscription.isPermanent,
                    },
                    activation: {
                        vehicleId,
                        featureId,
                        status: 'ACTIVATED',
                        activatedAt: activationResponse.data?.data?.activatedAt,
                    },
                    vehicleState: stateResponse.data?.data,
                    timing: {
                        totalMs: totalTime,
                        steps: timing,
                    },
                },
                correlationId,
                timestamp: new Date().toISOString(),
            }),
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('Test activation failed', {
            correlationId,
            error: errorMessage,
            stack: errorStack,
        });
        // Determine error type and status code
        let statusCode = 500;
        let errorCode = 'INTERNAL_ERROR';
        let errorDetails = undefined;
        if (error instanceof axios_1.AxiosError) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                statusCode = 503;
                errorCode = 'BRIDGE_UNAVAILABLE';
            }
            else if (error.response?.status === 503) {
                statusCode = 503;
                errorCode = 'MCP_UNAVAILABLE';
            }
            errorDetails = error.response?.data;
        }
        else if (error instanceof Error && error.name === 'ValidationError') {
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
                    message: errorMessage,
                    details: errorDetails,
                    correlationId,
                },
                timestamp: new Date().toISOString(),
            }),
        };
    }
}
//# sourceMappingURL=index.js.map