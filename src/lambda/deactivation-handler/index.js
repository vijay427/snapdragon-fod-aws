/**
 * Deactivation Handler Lambda Function (JavaScript)
 * Placeholder - sends deactivation messages to vehicles
 */

exports.handler = async (event) => {
  console.log('Deactivation handler triggered:', JSON.stringify(event));
  
  // For now, just log and return success
  // In production, this would send deactivation messages to IoT Core
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Deactivation handler executed',
    }),
  };
};
