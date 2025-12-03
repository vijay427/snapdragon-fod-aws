---
inclusion: always
---

# Qualcomm Car-to-Cloud SDK API Reference

## Purpose
This document provides reference documentation for Qualcomm Car-to-Cloud SDK APIs. Follow these patterns when communicating with Snapdragon Digital Chassis and generating Qualcomm integration code.

## SDK Overview

The Qualcomm Car-to-Cloud SDK enables bidirectional communication between cloud services (AWS) and the Snapdragon Digital Chassis in vehicles. The SDK provides APIs for:
- Feature activation/deactivation
- Vehicle state management
- Telemetry reporting
- Configuration updates

## API Communication Pattern

### Message Format
All messages between AWS and Snapdragon Chip follow this structure:

```json
{
  "messageId": "uuid-v4",
  "timestamp": "ISO-8601 timestamp",
  "vehicleId": "unique-vehicle-identifier",
  "messageType": "FEATURE_ACTIVATION | FEATURE_DEACTIVATION | STATE_QUERY | CONFIG_UPDATE",
  "payload": {
    // Message-specific data
  },
  "signature": "cryptographic-signature"
}
```

## Core APIs

### 1. Feature Activation API

**Cloud to Vehicle (AWS → Snapdragon)**

```typescript
interface FeatureActivationMessage {
  messageId: string;
  timestamp: string;
  vehicleId: string;
  messageType: 'FEATURE_ACTIVATION';
  payload: {
    featureId: string;
    featureType: 'CONNECTIVITY_TIER' | 'PERFORMANCE_MODE' | 'INFOTAINMENT';
    activationConfig: {
      tier?: '4G' | '5G';  // For connectivity upgrades
      mode?: 'SPORT' | 'ECO' | 'COMFORT';  // For performance modes
      parameters?: Record<string, any>;  // Feature-specific params
    };
    expiresAt?: string;  // ISO-8601 timestamp for time-limited features
    isPermanent: boolean;
  };
  signature: string;
}
```

**Example: 5G Connectivity Activation**
```json
{
  "messageId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-12-03T10:30:00Z",
  "vehicleId": "VIN1234567890",
  "messageType": "FEATURE_ACTIVATION",
  "payload": {
    "featureId": "CONNECTIVITY_5G",
    "featureType": "CONNECTIVITY_TIER",
    "activationConfig": {
      "tier": "5G"
    },
    "isPermanent": true
  },
  "signature": "base64-encoded-signature"
}
```

**Example: Sport Mode Activation (Weekend)**
```json
{
  "messageId": "660e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2024-12-06T18:00:00Z",
  "vehicleId": "VIN1234567890",
  "messageType": "FEATURE_ACTIVATION",
  "payload": {
    "featureId": "SPORT_MODE",
    "featureType": "PERFORMANCE_MODE",
    "activationConfig": {
      "mode": "SPORT",
      "parameters": {
        "throttleResponse": "AGGRESSIVE",
        "suspensionStiffness": "FIRM",
        "steeringWeight": "HEAVY"
      }
    },
    "expiresAt": "2024-12-08T23:59:59Z",
    "isPermanent": false
  },
  "signature": "base64-encoded-signature"
}
```

**Vehicle Response (Snapdragon → AWS)**
```typescript
interface FeatureActivationResponse {
  messageId: string;  // Original message ID
  timestamp: string;
  vehicleId: string;
  messageType: 'FEATURE_ACTIVATION_ACK';
  payload: {
    featureId: string;
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
    activatedAt?: string;
    errorCode?: string;
    errorMessage?: string;
  };
  signature: string;
}
```

### 2. Feature Deactivation API

**Cloud to Vehicle (AWS → Snapdragon)**

```typescript
interface FeatureDeactivationMessage {
  messageId: string;
  timestamp: string;
  vehicleId: string;
  messageType: 'FEATURE_DEACTIVATION';
  payload: {
    featureId: string;
    reason: 'EXPIRED' | 'REVOKED' | 'USER_REQUESTED' | 'DOWNGRADE';
    restoreConfig?: {
      tier?: '4G';  // Restore to base tier
      mode?: 'COMFORT';  // Restore to default mode
    };
  };
  signature: string;
}
```

**Example: Sport Mode Expiration**
```json
{
  "messageId": "770e8400-e29b-41d4-a716-446655440002",
  "timestamp": "2024-12-09T00:00:00Z",
  "vehicleId": "VIN1234567890",
  "messageType": "FEATURE_DEACTIVATION",
  "payload": {
    "featureId": "SPORT_MODE",
    "reason": "EXPIRED",
    "restoreConfig": {
      "mode": "COMFORT"
    }
  },
  "signature": "base64-encoded-signature"
}
```

### 3. Vehicle State Query API

**Cloud to Vehicle (AWS → Snapdragon)**

```typescript
interface StateQueryMessage {
  messageId: string;
  timestamp: string;
  vehicleId: string;
  messageType: 'STATE_QUERY';
  payload: {
    queryType: 'ACTIVE_FEATURES' | 'CONNECTIVITY_STATUS' | 'FULL_STATE';
  };
  signature: string;
}
```

**Vehicle Response (Snapdragon → AWS)**
```typescript
interface StateQueryResponse {
  messageId: string;
  timestamp: string;
  vehicleId: string;
  messageType: 'STATE_RESPONSE';
  payload: {
    activeFeatures: Array<{
      featureId: string;
      featureType: string;
      activatedAt: string;
      expiresAt?: string;
    }>;
    connectivityTier: '4G' | '5G';
    performanceMode: 'SPORT' | 'ECO' | 'COMFORT';
    systemHealth: 'HEALTHY' | 'DEGRADED' | 'ERROR';
  };
  signature: string;
}
```

### 4. Telemetry Reporting API

**Vehicle to Cloud (Snapdragon → AWS)**

```typescript
interface TelemetryMessage {
  messageId: string;
  timestamp: string;
  vehicleId: string;
  messageType: 'TELEMETRY';
  payload: {
    events: Array<{
      eventType: 'FEATURE_USED' | 'FEATURE_ACTIVATED' | 'FEATURE_DEACTIVATED' | 'ERROR';
      featureId: string;
      timestamp: string;
      metadata?: Record<string, any>;
    }>;
  };
  signature: string;
}
```

**Example: Sport Mode Usage Telemetry**
```json
{
  "messageId": "880e8400-e29b-41d4-a716-446655440003",
  "timestamp": "2024-12-07T14:30:00Z",
  "vehicleId": "VIN1234567890",
  "messageType": "TELEMETRY",
  "payload": {
    "events": [
      {
        "eventType": "FEATURE_USED",
        "featureId": "SPORT_MODE",
        "timestamp": "2024-12-07T14:00:00Z",
        "metadata": {
          "duration": 1800,
          "averageSpeed": 85,
          "maxSpeed": 120
        }
      }
    ]
  },
  "signature": "base64-encoded-signature"
}
```

## SDK Integration Patterns

### TypeScript/Node.js Integration

```typescript
import { CarToCloudSDK } from '@qualcomm/car-to-cloud-sdk';

// Initialize SDK
const sdk = new CarToCloudSDK({
  vehicleId: process.env.VEHICLE_ID,
  certificatePath: '/path/to/cert.pem',
  privateKeyPath: '/path/to/private-key.pem',
  endpoint: 'wss://iot.aws.region.amazonaws.com',
  region: 'us-east-1'
});

// Send feature activation
async function activateFeature(featureId: string, config: any) {
  const message: FeatureActivationMessage = {
    messageId: generateUUID(),
    timestamp: new Date().toISOString(),
    vehicleId: sdk.vehicleId,
    messageType: 'FEATURE_ACTIVATION',
    payload: {
      featureId,
      featureType: 'PERFORMANCE_MODE',
      activationConfig: config,
      isPermanent: false,
      expiresAt: calculateExpiration(48) // 48 hours
    },
    signature: await sdk.sign(message)
  };
  
  return await sdk.send(message);
}

// Listen for incoming messages
sdk.on('message', async (message) => {
  switch (message.messageType) {
    case 'FEATURE_ACTIVATION':
      await handleFeatureActivation(message);
      break;
    case 'FEATURE_DEACTIVATION':
      await handleFeatureDeactivation(message);
      break;
    case 'STATE_QUERY':
      await handleStateQuery(message);
      break;
  }
});

// Handle feature activation
async function handleFeatureActivation(message: FeatureActivationMessage) {
  try {
    // Validate signature
    const isValid = await sdk.verify(message);
    if (!isValid) {
      throw new Error('Invalid message signature');
    }
    
    // Apply feature configuration
    await applyFeatureConfig(message.payload);
    
    // Send acknowledgment
    const response: FeatureActivationResponse = {
      messageId: message.messageId,
      timestamp: new Date().toISOString(),
      vehicleId: sdk.vehicleId,
      messageType: 'FEATURE_ACTIVATION_ACK',
      payload: {
        featureId: message.payload.featureId,
        status: 'SUCCESS',
        activatedAt: new Date().toISOString()
      },
      signature: await sdk.sign(response)
    };
    
    await sdk.send(response);
  } catch (error) {
    // Send error response
    await sendErrorResponse(message.messageId, error);
  }
}
```

### Python Integration

```python
from qualcomm_car_to_cloud import CarToCloudSDK
from datetime import datetime, timedelta
import uuid

# Initialize SDK
sdk = CarToCloudSDK(
    vehicle_id=os.environ['VEHICLE_ID'],
    certificate_path='/path/to/cert.pem',
    private_key_path='/path/to/private-key.pem',
    endpoint='wss://iot.aws.region.amazonaws.com',
    region='us-east-1'
)

# Send feature activation
async def activate_feature(feature_id: str, config: dict):
    message = {
        'messageId': str(uuid.uuid4()),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'vehicleId': sdk.vehicle_id,
        'messageType': 'FEATURE_ACTIVATION',
        'payload': {
            'featureId': feature_id,
            'featureType': 'PERFORMANCE_MODE',
            'activationConfig': config,
            'isPermanent': False,
            'expiresAt': (datetime.utcnow() + timedelta(hours=48)).isoformat() + 'Z'
        }
    }
    
    message['signature'] = await sdk.sign(message)
    return await sdk.send(message)

# Message handler
@sdk.on_message
async def handle_message(message: dict):
    message_type = message['messageType']
    
    if message_type == 'FEATURE_ACTIVATION':
        await handle_feature_activation(message)
    elif message_type == 'FEATURE_DEACTIVATION':
        await handle_feature_deactivation(message)
    elif message_type == 'STATE_QUERY':
        await handle_state_query(message)
```

## Security Requirements

### Message Signing
- All messages MUST be signed using ECDSA with SHA-256
- Private keys MUST be stored in secure hardware (TPM/HSM)
- Signatures MUST be verified before processing any message

### Certificate Management
- Use X.509 certificates for device authentication
- Certificates MUST be rotated every 365 days
- Revoked certificates MUST be checked against CRL

### Encryption
- All communication MUST use TLS 1.3
- Message payloads MAY be additionally encrypted for sensitive data

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_SIGNATURE` | Message signature verification failed | Reject message, log security event |
| `FEATURE_NOT_SUPPORTED` | Feature not available on this vehicle | Return error to cloud |
| `INSUFFICIENT_RESOURCES` | Cannot activate due to resource constraints | Return error, suggest alternatives |
| `EXPIRED_MESSAGE` | Message timestamp too old | Reject message |
| `CONFLICTING_FEATURE` | Feature conflicts with active feature | Return error with conflict details |
| `HARDWARE_ERROR` | Hardware failure prevents activation | Return error, log diagnostic data |

## Best Practices

1. **Idempotency**: Design activation handlers to be idempotent - activating an already-active feature should succeed
2. **Graceful Degradation**: If a feature partially fails, activate what's possible and report partial success
3. **Offline Handling**: Cache activation messages when offline, process when connectivity restored
4. **Time Synchronization**: Ensure vehicle clock is synchronized (NTP) for accurate expiration handling
5. **Logging**: Log all activation/deactivation events with full context for debugging
6. **Testing**: Use simulator mode for development and testing without real hardware
