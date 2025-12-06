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
export declare function validateSubscription(subscription: any): subscription is Subscription;
/**
 * Create a new subscription with validation
 */
export declare function createSubscription(data: Partial<Subscription>): Subscription;
/**
 * Check if subscription is expired
 */
export declare function isSubscriptionExpired(subscription: Subscription): boolean;
/**
 * Check if subscription is active
 */
export declare function isSubscriptionActive(subscription: Subscription): boolean;
//# sourceMappingURL=Subscription.d.ts.map