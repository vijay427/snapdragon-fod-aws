"use strict";
/**
 * Message Models for Car-to-Cloud Communication
 * Based on Qualcomm Car-to-Cloud SDK specification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBaseMessage = validateBaseMessage;
exports.validateFeatureActivationMessage = validateFeatureActivationMessage;
exports.createFeatureActivationMessage = createFeatureActivationMessage;
exports.createFeatureDeactivationMessage = createFeatureDeactivationMessage;
/**
 * Validate base message structure
 */
function validateBaseMessage(message) {
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
function validateFeatureActivationMessage(message) {
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
    const validTypes = ['CONNECTIVITY_TIER', 'PERFORMANCE_MODE', 'INFOTAINMENT'];
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
function createFeatureActivationMessage(vehicleId, featureId, featureType, config, isPermanent, expiresAt) {
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
function createFeatureDeactivationMessage(vehicleId, featureId, reason, restoreConfig) {
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
//# sourceMappingURL=Messages.js.map