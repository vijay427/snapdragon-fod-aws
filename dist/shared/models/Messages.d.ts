/**
 * Message Models for Car-to-Cloud Communication
 * Based on Qualcomm Car-to-Cloud SDK specification
 */
export type MessageType = 'FEATURE_ACTIVATION' | 'FEATURE_DEACTIVATION' | 'FEATURE_ACTIVATION_ACK' | 'FEATURE_DEACTIVATION_ACK' | 'STATE_QUERY' | 'STATE_RESPONSE' | 'TELEMETRY';
export type FeatureType = 'CONNECTIVITY_TIER' | 'PERFORMANCE_MODE' | 'INFOTAINMENT';
/**
 * Base message structure
 */
export interface BaseMessage {
    messageId: string;
    timestamp: string;
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
        expiresAt?: string;
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
        activatedAt?: string;
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
        deactivatedAt?: string;
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
export type Message = FeatureActivationMessage | FeatureDeactivationMessage | FeatureActivationAckMessage | FeatureDeactivationAckMessage | StateQueryMessage | StateResponseMessage | TelemetryMessage;
/**
 * Validate base message structure
 */
export declare function validateBaseMessage(message: any): boolean;
/**
 * Validate feature activation message
 */
export declare function validateFeatureActivationMessage(message: any): message is FeatureActivationMessage;
/**
 * Create feature activation message
 */
export declare function createFeatureActivationMessage(vehicleId: string, featureId: string, featureType: FeatureType, config: FeatureActivationMessage['payload']['activationConfig'], isPermanent: boolean, expiresAt?: Date): Omit<FeatureActivationMessage, 'messageId' | 'signature'>;
/**
 * Create feature deactivation message
 */
export declare function createFeatureDeactivationMessage(vehicleId: string, featureId: string, reason: FeatureDeactivationMessage['payload']['reason'], restoreConfig?: FeatureDeactivationMessage['payload']['restoreConfig']): Omit<FeatureDeactivationMessage, 'messageId' | 'signature'>;
//# sourceMappingURL=Messages.d.ts.map