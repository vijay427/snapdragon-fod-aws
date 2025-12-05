/**
 * Purchase Handler Lambda Function (JavaScript)
 * Handles feature purchase requests from API Gateway
 */

const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable not set');
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedDb = client.db(process.env.MONGODB_DATABASE || 'fod-system');
  console.log('Connected to MongoDB');
  return cachedDb;
}

// Mock payment processing
async function processPayment(amount, paymentMethod) {
  console.log('Processing payment:', { amount, paymentMethod });
  
  if (amount <= 0) {
    throw new Error('Invalid amount');
  }

  // Simulate 90% success rate
  const success = Math.random() > 0.1;
  if (!success) {
    throw new Error('Payment declined by processor');
  }

  return true;
}

exports.handler = async (event) => {
  console.log('Purchase request received:', JSON.stringify(event));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body is required',
          },
        }),
      };
    }

    const body = JSON.parse(event.body);
    const { vehicleId, featureId, paymentMethod } = body;

    // Validate inputs
    if (!vehicleId || !featureId || !paymentMethod) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'vehicleId, featureId, and paymentMethod are required',
          },
        }),
      };
    }

    console.log('Processing purchase:', { vehicleId, featureId, paymentMethod });

    // Connect to MongoDB
    const db = await connectToDatabase();

    // 1. Find feature
    const feature = await db.collection('features').findOne({ featureId });
    if (!feature) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'FEATURE_NOT_FOUND',
            message: `Feature ${featureId} not found`,
          },
        }),
      };
    }

    if (!feature.isActive) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'FEATURE_NOT_AVAILABLE',
            message: `Feature ${featureId} is not available`,
          },
        }),
      };
    }

    // 2. Check for existing subscription
    const existing = await db.collection('subscriptions').findOne({
      vehicleId,
      featureId,
      status: { $in: ['PENDING', 'ACTIVE'] },
    });

    if (existing) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'DUPLICATE_SUBSCRIPTION',
            message: 'Vehicle already has an active subscription for this feature',
          },
        }),
      };
    }

    // 3. Create transaction
    const transactionId = `txn_${uuidv4()}`;
    const transaction = {
      transactionId,
      vehicleId,
      featureId,
      amount: feature.price,
      status: 'PENDING',
      paymentMethod,
      timestamp: new Date(),
    };

    await db.collection('transactions').insertOne(transaction);
    console.log('Transaction created:', transactionId);

    // 4. Process payment
    try {
      await processPayment(feature.price, paymentMethod);
      console.log('Payment processed successfully');
    } catch (error) {
      // Mark transaction as failed
      await db.collection('transactions').updateOne(
        { transactionId },
        { $set: { status: 'FAILED', failedAt: new Date() } }
      );
      throw error;
    }

    // 5. Create subscription
    const subscriptionId = `sub_${uuidv4()}`;
    const expiresAt = feature.duration > 0
      ? new Date(Date.now() + feature.duration * 60 * 60 * 1000)
      : null;

    const subscription = {
      subscriptionId,
      vehicleId,
      featureId,
      status: 'PENDING',
      purchasedAt: new Date(),
      expiresAt,
      isPermanent: feature.duration === 0,
    };

    await db.collection('subscriptions').insertOne(subscription);
    console.log('Subscription created:', subscriptionId);

    // 6. Update transaction
    await db.collection('transactions').updateOne(
      { transactionId },
      {
        $set: {
          status: 'COMPLETED',
          subscriptionId,
          completedAt: new Date(),
        },
      }
    );

    // 7. Log telemetry
    await db.collection('telemetry').insertOne({
      vehicleId,
      eventType: 'FEATURE_ACTIVATED',
      featureId,
      timestamp: new Date(),
      metadata: {
        subscriptionId,
        transactionId,
        amount: feature.price,
      },
    });

    // 8. Return success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          transactionId,
          subscriptionId,
          vehicleId,
          featureId,
          amount: feature.price,
          status: 'PENDING',
          expiresAt: expiresAt?.toISOString(),
          isPermanent: feature.duration === 0,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Purchase failed:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
