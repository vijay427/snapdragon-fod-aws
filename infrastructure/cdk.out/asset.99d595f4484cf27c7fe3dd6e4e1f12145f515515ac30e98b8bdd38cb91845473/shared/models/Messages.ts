/**
 * Message Models for Car-to-Cloud Communication
 * Based on Qualcomm Car-to-Cloud SDK specification
 */

export type MessageType = 
  | 'FEATURE_ACTIVATION' 
  | 'FEATURE_DEACTIVATION' 
  | 'FEATURE_ACTIVATION_ACK'
  | 'FEATURE_DEACTIVATION_ACK'
  | 'STATE_QUERY' 
  | 'STATE_RESPONSE'
  | 'TELEMETRY';

export type FeatureType = 'CONNECTIVITY_TIER' | 'PERFORMANCE_MODE' | 'INFOTAINMENT';

/**
 * Base message structure
 */
export interface BaseMessage {
  messageId: string;
  timestamp: string; // ISO-8601 format
  vehicleId: string;
  messageType: MessageType;
  signature: string;
}

/**
 * Feature Activation Message (Cloud → Vehicle)
 */
export interface FeatureActivationMessage extends BaseMessage {
  messageType: 'FEATURE_ACTIVATION';
  payload: {
    featureId: string;
    featureType: FeatureType;
    activationConfig: {
      tier?: '4G' | '5G';
      mode?: 'SPORT' | 'ECO' | 'COMFORT';
      parameters?: Record<string, any>;
    };
    expiresAt?: string; // ISO-8601 timestamp
    isPermanent: boolean;
  };
}

/**
 * Feature Deactivation Message (Cloud → Vehicle)
 */
export interface FeatureDeactivationMessage extends BaseMessage {
  messageType: 'FEATURE_DEACTIVATION';
  payload: {
    featureId: string;
    reason: 'EXPIRED' | 'REVOKED' | 'USER_REQUESTED' | 'DOWNGRADE';
    restoreConfig?: {
      tier?: '4G';
      mode?: 'COMFORT';
    };
  };
}

/**
 * Feature Activation Acknowledgment (Vehicle → Cloud)
 */
export interface FeatureActivationAckMessage extends BaseMessage {
  messageType: 'FEATURE_ACTIVATION_ACK';
  payload: {
    featureId: string;
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
    activatedAt?: string; // ISO-8601 timestamp
    errorCode?: string;
    errorMessage?: string;
  };
}

/**
 * Feature Deactivation Acknowledgment (Vehicle → Cloud)
 */
export interface FeatureDeactivationAckMessage extends BaseMessage {
  messageType: 'FEATURE_DEACTIVATION_ACK';
  payload: {
    featureId: string;
    status: 'SUCCESS' | 'FAILED';
    deactivatedAt?: string; // ISO-8601 timestamp
    errorCode?: string;
    errorMessage?: string;
  };
}

/**
 * State Query Message (Cloud → Vehicle)
 */
export interface StateQueryMessage extends BaseMessage {
  messageType: 'STATE_QUERY';
  payload: {
    queryType: 'ACTIVE_FEATURES' | 'CONNECTIVITY_STATUS' | 'FULL_STATE';
  };
}

/**
 * State Response Message (Vehicle → Cloud)
 */
export interface StateResponseMessage extends BaseMessage {
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
}

/**
 * Telemetry Message (Vehicle → Cloud)
 */
export interface TelemetryMessage extends BaseMessage {
  messageType: 'TELEMETRY';
  payload: {
    events: Array<{
      eventType: 'FEATURE_USED' | 'FEATURE_ACTIVATED' | 'FEATURE_DEACTIVATED' | 'ERROR';
      featureId: string;
      timestamp: string;
      metadata?: Record<string, any>;
    }>;
  };
}

/**
 * Union type for all message types
 */
export type Message = 
  | FeatureActivationMessage 
  | FeatureDeactivationMessage
  | FeatureActivationAckMessage
  | FeatureDeactivationAckMessage
  | StateQueryMessage
  | StateResponseMessage
  | TelemetryMessage;

/**
 * Validate base message structure
 */
export function validateBaseMessage(message: any): boolean {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (typeof message.messageId !== 'string' || message.messageId.trim() === '') {
    return false;
  }

  if (typeof message.timestamp !== 'string') {
    return false;
  }

  if (typeof message.vehicleId !== 'string' || message.vehicleId.trim() === '') {
    return false;
  }

  if (typeof message.messageType !== 'string') {
    return false;
  }

  if (typeof message.signature !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validate feature activation message
 */
export function validateFeatureActivationMessage(message: any): message is FeatureActivationMessage {
  if (!validateBaseMessage(message)) {
    return false;
  }

  if (message.messageType !== 'FEATURE_ACTIVATION') {
    return false;
  }

  const payload = message.payload;
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  if (typeof payload.featureId !== 'string' || payload.featureId.trim() === '') {
    return false;
  }

  const validTypes: FeatureType[] = ['CONNECTIVITY_TIER', 'PERFORMANCE_MODE', 'INFOTAINMENT'];
  if (!validTypes.includes(payload.featureType)) {
    return false;
  }

  if (!payload.activationConfig || typeof payload.activationConfig !== 'object') {
    return false;
  }

  if (typeof payload.isPermanent !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Create feature activation message
 */
export function createFeatureActivationMessage(
  vehicleId: string,
  featureId: string,
  featureType: FeatureType,
  config: FeatureActivationMessage['payload']['activationConfig'],
  isPermanent: boolean,
  expiresAt?: Date
): Omit<FeatureActivationMessage, 'messageId' | 'signature'> {
  return {
    timestamp: new Date().toISOString(),
    vehicleId,
    messageType: 'FEATURE_ACTIVATION',
    payload: {
      featureId,
      featureType,
      activationConfig: config,
      expiresAt: expiresAt?.toISOString(),
      isPermanent,
    },
  };
}

/**
 * Create feature deactivation message
 */
export function createFeatureDeactivationMessage(
  vehicleId: string,
  featureId: string,
  reason: FeatureDeactivationMessage['payload']['reason'],
  restoreConfig?: FeatureDeactivationMessage['payload']['restoreConfig']
): Omit<FeatureDeactivationMessage, 'messageId' | 'signature'> {
  return {
    timestamp: new Date().toISOString(),
    vehicleId,
    messageType: 'FEATURE_DEACTIVATION',
    payload: {
      featureId,
      reason,
      restoreConfig,
    },
  };
}
