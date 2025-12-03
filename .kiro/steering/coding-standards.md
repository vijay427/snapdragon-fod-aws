---
inclusion: always
---

# Coding Standards for FOD System

## Purpose
Follow these coding standards and error handling patterns when generating code for the Feature on Demand system.

## General Principles

1. **Write Clean, Readable Code**: Code is read more often than written
2. **Fail Fast**: Validate inputs early and throw meaningful errors
3. **Idempotency**: Design operations to be safely retried
4. **Logging**: Log at appropriate levels with structured context
5. **Testing**: Write tests before or alongside implementation

## Language-Specific Standards

### TypeScript/Node.js

#### File Structure
```typescript
// 1. Imports (grouped: external, internal, types)
import { DynamoDB } from 'aws-sdk';
import { FeatureActivationService } from './services';
import { ActivationRequest, ActivationResponse } from './types';

// 2. Constants
const MAX_RETRY_ATTEMPTS = 3;
const ACTIVATION_TIMEOUT_MS = 30000;

// 3. Types/Interfaces
interface VehicleState {
  vehicleId: string;
  activeFeatures: string[];
  connectivityTier: 'TIER_4G' | 'TIER_5G';
}

// 4. Main logic
export class FeatureActivationHandler {
  // Implementation
}

// 5. Helper functions
function validateActivationRequest(req: ActivationRequest): void {
  // Validation logic
}
```

#### Naming Conventions
- **Classes**: PascalCase - `FeatureActivationService`
- **Functions/Methods**: camelCase - `activateFeature()`
- **Constants**: UPPER_SNAKE_CASE - `MAX_RETRY_ATTEMPTS`
- **Interfaces**: PascalCase with 'I' prefix optional - `ActivationRequest`
- **Files**: kebab-case - `feature-activation-service.ts`

#### Error Handling Pattern
```typescript
// Custom error classes
export class FeatureActivationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly vehicleId: string,
    public readonly featureId: string
  ) {
    super(message);
    this.name = 'FeatureActivationError';
  }
}

// Usage in functions
export async function activateFeature(
  vehicleId: string,
  featureId: string
): Promise<ActivationResponse> {
  // Input validation
  if (!vehicleId || !featureId) {
    throw new FeatureActivationError(
      'Vehicle ID and Feature ID are required',
      'INVALID_INPUT',
      vehicleId,
      featureId
    );
  }

  try {
    // Business logic
    const result = await featureService.activate(vehicleId, featureId);
    
    // Success logging
    logger.info('Feature activated successfully', {
      vehicleId,
      featureId,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    // Error logging with context
    logger.error('Feature activation failed', {
      vehicleId,
      featureId,
      error: error.message,
      stack: error.stack
    });
    
    // Re-throw with context
    if (error instanceof FeatureActivationError) {
      throw error;
    }
    
    throw new FeatureActivationError(
      `Failed to activate feature: ${error.message}`,
      'ACTIVATION_FAILED',
      vehicleId,
      featureId
    );
  }
}
```

#### Async/Await Best Practices
```typescript
// GOOD: Proper error handling
async function processActivation(request: ActivationRequest): Promise<void> {
  try {
    await validateRequest(request);
    await processPayment(request);
    await activateFeature(request);
  } catch (error) {
    await rollbackTransaction(request);
    throw error;
  }
}

// GOOD: Parallel operations when possible
async function fetchVehicleData(vehicleId: string): Promise<VehicleData> {
  const [state, features, telemetry] = await Promise.all([
    getVehicleState(vehicleId),
    getActiveFeatures(vehicleId),
    getTelemetry(vehicleId)
  ]);
  
  return { state, features, telemetry };
}

// BAD: Sequential when parallel is possible
async function fetchVehicleDataBad(vehicleId: string): Promise<VehicleData> {
  const state = await getVehicleState(vehicleId);
  const features = await getActiveFeatures(vehicleId);
  const telemetry = await getTelemetry(vehicleId);
  return { state, features, telemetry };
}
```

### Python

#### File Structure
```python
"""
Feature Activation Service
Handles activation of on-demand features for vehicles.
"""

# 1. Standard library imports
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# 2. Third-party imports
import boto3
from botocore.exceptions import ClientError

# 3. Local imports
from .models import ActivationRequest, VehicleState
from .exceptions import FeatureActivationError

# 4. Constants
MAX_RETRY_ATTEMPTS = 3
ACTIVATION_TIMEOUT_SECONDS = 30

# 5. Logger setup
logger = logging.getLogger(__name__)

# 6. Main logic
class FeatureActivationService:
    """Service for managing feature activations."""
    
    def __init__(self, dynamodb_client):
        self.dynamodb = dynamodb_client
```

#### Naming Conventions
- **Classes**: PascalCase - `FeatureActivationService`
- **Functions/Methods**: snake_case - `activate_feature()`
- **Constants**: UPPER_SNAKE_CASE - `MAX_RETRY_ATTEMPTS`
- **Files**: snake_case - `feature_activation_service.py`

#### Error Handling Pattern
```python
# Custom exceptions
class FeatureActivationError(Exception):
    """Base exception for feature activation errors."""
    
    def __init__(self, message: str, code: str, vehicle_id: str, feature_id: str):
        super().__init__(message)
        self.code = code
        self.vehicle_id = vehicle_id
        self.feature_id = feature_id

# Usage in functions
def activate_feature(vehicle_id: str, feature_id: str) -> Dict:
    """
    Activate a feature for a vehicle.
    
    Args:
        vehicle_id: Unique identifier for the vehicle
        feature_id: Identifier for the feature to activate
        
    Returns:
        Activation response with status and timestamp
        
    Raises:
        FeatureActivationError: If activation fails
    """
    # Input validation
    if not vehicle_id or not feature_id:
        raise FeatureActivationError(
            "Vehicle ID and Feature ID are required",
            "INVALID_INPUT",
            vehicle_id,
            feature_id
        )
    
    try:
        # Business logic
        result = feature_service.activate(vehicle_id, feature_id)
        
        # Success logging
        logger.info(
            "Feature activated successfully",
            extra={
                "vehicle_id": vehicle_id,
                "feature_id": feature_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        return result
        
    except Exception as e:
        # Error logging with context
        logger.error(
            "Feature activation failed",
            extra={
                "vehicle_id": vehicle_id,
                "feature_id": feature_id,
                "error": str(e)
            },
            exc_info=True
        )
        
        # Re-raise with context
        if isinstance(e, FeatureActivationError):
            raise
        
        raise FeatureActivationError(
            f"Failed to activate feature: {str(e)}",
            "ACTIVATION_FAILED",
            vehicle_id,
            feature_id
        ) from e
```

## Logging Standards

### Log Levels
- **ERROR**: System errors, failed operations, exceptions
- **WARN**: Degraded functionality, retries, deprecated usage
- **INFO**: Important business events (activation, deactivation, purchases)
- **DEBUG**: Detailed diagnostic information (development only)

### Structured Logging
```typescript
// GOOD: Structured with context
logger.info('Feature activated', {
  vehicleId: 'VIN123',
  featureId: 'SPORT_MODE',
  duration: '48h',
  timestamp: new Date().toISOString()
});

// BAD: Unstructured string
logger.info('Feature SPORT_MODE activated for VIN123 for 48h');
```

## Testing Standards

### Unit Tests
```typescript
describe('FeatureActivationService', () => {
  describe('activateFeature', () => {
    it('should activate feature successfully with valid inputs', async () => {
      // Arrange
      const vehicleId = 'VIN123';
      const featureId = 'SPORT_MODE';
      
      // Act
      const result = await service.activateFeature(vehicleId, featureId);
      
      // Assert
      expect(result.status).toBe('ACTIVATED');
      expect(result.vehicleId).toBe(vehicleId);
    });
    
    it('should throw error when vehicle ID is missing', async () => {
      // Arrange & Act & Assert
      await expect(
        service.activateFeature('', 'SPORT_MODE')
      ).rejects.toThrow(FeatureActivationError);
    });
  });
});
```

## API Response Standards

### Success Response
```typescript
{
  "success": true,
  "data": {
    "vehicleId": "VIN123",
    "featureId": "SPORT_MODE",
    "status": "ACTIVATED",
    "expiresAt": "2024-12-10T00:00:00Z"
  },
  "timestamp": "2024-12-03T10:30:00Z"
}
```

### Error Response
```typescript
{
  "success": false,
  "error": {
    "code": "ACTIVATION_FAILED",
    "message": "Failed to activate feature: insufficient balance",
    "details": {
      "vehicleId": "VIN123",
      "featureId": "SPORT_MODE"
    }
  },
  "timestamp": "2024-12-03T10:30:00Z"
}
```

## Code Review Checklist

Before submitting code:
- [ ] Follows naming conventions
- [ ] Includes proper error handling
- [ ] Has structured logging
- [ ] Includes unit tests
- [ ] No hardcoded values (use config/env vars)
- [ ] Async operations handled correctly
- [ ] Input validation implemented
- [ ] Documentation/comments for complex logic
- [ ] No console.log or print statements (use logger)
- [ ] Passes linter without warnings
