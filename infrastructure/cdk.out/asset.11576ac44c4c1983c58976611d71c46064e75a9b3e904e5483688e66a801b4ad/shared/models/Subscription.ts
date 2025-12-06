/**
 * Subscription Data Model
 * Represents a vehicle's subscription to a feature
 */

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'DEACTIVATED' | 'FAILED';

export interface Subscription {
  subscriptionId: string;
  vehicleId: string;
  featureId: string;
  status: SubscriptionStatus;
  purchasedAt: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  deactivatedAt?: Date;
  isPermanent: boolean;
}

/**
 * Validate subscription data
 */
export function validateSubscription(subscription: any): subscription is Subscription {
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

  const validStatuses: SubscriptionStatus[] = ['PENDING', 'ACTIVE', 'EXPIRED', 'DEACTIVATED', 'FAILED'];
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
export function createSubscription(data: Partial<Subscription>): Subscription {
  const subscription: Subscription = {
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
export function isSubscriptionExpired(subscription: Subscription): boolean {
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
export function isSubscriptionActive(subscription: Subscription): boolean {
  return subscription.status === 'ACTIVE' && !isSubscriptionExpired(subscription);
}
