"use strict";
/**
 * Subscription Data Model
 * Represents a vehicle's subscription to a feature
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSubscription = validateSubscription;
exports.createSubscription = createSubscription;
exports.isSubscriptionExpired = isSubscriptionExpired;
exports.isSubscriptionActive = isSubscriptionActive;
/**
 * Validate subscription data
 */
function validateSubscription(subscription) {
    if (!subscription || typeof subscription !== 'object') {
        return false;
    }
    // Required fields
    if (typeof subscription.subscriptionId !== 'string' || subscription.subscriptionId.trim() === '') {
        return false;
    }
    if (typeof subscription.vehicleId !== 'string' || subscription.vehicleId.trim() === '') {
        return false;
    }
    if (typeof subscription.featureId !== 'string' || subscription.featureId.trim() === '') {
        return false;
    }
    const validStatuses = ['PENDING', 'ACTIVE', 'EXPIRED', 'DEACTIVATED', 'FAILED'];
    if (!validStatuses.includes(subscription.status)) {
        return false;
    }
    if (!(subscription.purchasedAt instanceof Date)) {
        return false;
    }
    if (typeof subscription.isPermanent !== 'boolean') {
        return false;
    }
    // Optional date fields validation
    if (subscription.activatedAt !== undefined && !(subscription.activatedAt instanceof Date)) {
        return false;
    }
    if (subscription.expiresAt !== undefined && !(subscription.expiresAt instanceof Date)) {
        return false;
    }
    if (subscription.deactivatedAt !== undefined && !(subscription.deactivatedAt instanceof Date)) {
        return false;
    }
    return true;
}
/**
 * Create a new subscription with validation
 */
function createSubscription(data) {
    const subscription = {
        subscriptionId: data.subscriptionId || '',
        vehicleId: data.vehicleId || '',
        featureId: data.featureId || '',
        status: data.status || 'PENDING',
        purchasedAt: data.purchasedAt || new Date(),
        activatedAt: data.activatedAt,
        expiresAt: data.expiresAt,
        deactivatedAt: data.deactivatedAt,
        isPermanent: data.isPermanent ?? false,
    };
    if (!validateSubscription(subscription)) {
        throw new Error('Invalid subscription data');
    }
    return subscription;
}
/**
 * Check if subscription is expired
 */
function isSubscriptionExpired(subscription) {
    if (subscription.isPermanent) {
        return false;
    }
    if (!subscription.expiresAt) {
        return false;
    }
    return new Date() > subscription.expiresAt;
}
/**
 * Check if subscription is active
 */
function isSubscriptionActive(subscription) {
    return subscription.status === 'ACTIVE' && !isSubscriptionExpired(subscription);
}
