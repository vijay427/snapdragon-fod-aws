/**
 * Activation Handler Lambda Function (JavaScript)
 * Sends activation messages to IoT Core for vehicle feature activation
 * Version: 1.1.0 - Enhanced logging and error handling
 */

exports.handler = async (event) => {
  const timestamp = new Date().toISOString();
  const correlationId = `activation-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  console.log('Activation handler triggered:', {
    correlationId,
    timestamp,
    event: JSON.stringify(event)
  });
  
  try {
    // Parse event body if it exists
    const body = event.body ? JSON.parse(event.body) : event;
    const { vehicleId, featureId } = body;
    
    // Basic validation
    if (!vehicleId || !featureId) {
      console.warn('Missing required parameters:', { correlationId, vehicleId, featureId });
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'vehicleId and featureId are required',
          correlationId,
          timestamp
        }),
      };
    }
    
    // Log successful activation (placeholder for IoT Core integration)
    console.log('Feature activation processed:', {
      correlationId,
      vehicleId,
      featureId,
      timestamp
    });
    
    // In production, this would send messages to IoT Core
    // await iotCore.publish({
    //   topic: `vehicle/${vehicleId}/feature/activate`,
    //   payload: { featureId, timestamp, correlationId }
    // });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Activation handler executed successfully',
        data: {
          vehicleId,
          featureId,
          correlationId,
          timestamp
        }
      }),
    };
  } catch (error) {
    console.error('Activation handler error:', {
      correlationId,
      error: error.message,
      stack: error.stack
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        correlationId,
        timestamp
      }),
    };
  }
};
