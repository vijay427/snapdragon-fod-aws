/**
 * Test Activation Handler Lambda Function
 * Simplified JavaScript version for easier deployment
 * Orchestrates complete activation flow via HTTP Bridge
 */

const https = require('https');
const http = require('http');

// Environment variables
const HTTP_BRIDGE_URL = process.env.HTTP_BRIDGE_URL || '';
const MONGODB_URI = process.env.MONGODB_URI || '';

/**
 * Make HTTP request to HTTP Bridge
 */
//TODO: Add caching layer using Redis or ElastiCache for better performance
function makeHttpRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Test Activation Handler invoked', { event });

  try {
    // Parse request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { vehicleId, featureId, userId, duration } = body;

    // Validate input
    if (!vehicleId || !featureId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'vehicleId and featureId are required',
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Check if HTTP Bridge URL is configured
    if (!HTTP_BRIDGE_URL) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'HTTP_BRIDGE_URL not configured',
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }

    console.log('Activating feature via HTTP Bridge', {
      vehicleId,
      featureId,
      httpBridgeUrl: HTTP_BRIDGE_URL,
    });

    // Call HTTP Bridge to activate feature
    const activationUrl = `${HTTP_BRIDGE_URL}/api/vehicle/${vehicleId}/activate`;
    const activationData = {
      featureId,
      duration: duration || 48,
    };

    const response = await makeHttpRequest(activationUrl, 'POST', activationData);

    console.log('HTTP Bridge response', { response });

    if (response.statusCode === 200 || response.statusCode === 201) {
      // Success - feature activated
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: true,
          data: {
            vehicleId,
            featureId,
            status: 'ACTIVATED',
            activatedAt: new Date().toISOString(),
            expiresAt: duration
              ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
              : null,
            bridgeResponse: response.data,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    } else {
      // HTTP Bridge returned error
      return {
        statusCode: response.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: 'ACTIVATION_FAILED',
            message: 'Failed to activate feature via HTTP Bridge',
            details: response.data,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }
  } catch (error) {
    console.error('Error in test activation handler', { error: error.message, stack: error.stack });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
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
