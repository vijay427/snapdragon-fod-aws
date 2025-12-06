/**
 * Subscription Repository
 * Handles CRUD operations for subscriptions in MongoDB
 */
import { Subscription, SubscriptionStatus } from '../models/Subscription';
export declare class SubscriptionRepository {
    private getCollection;
    /**
     * Find subscription by ID
     */
    findById(subscriptionId: string): Promise<Subscription | null>;
    /**
     * Find active subscriptions for a vehicle
     */
    findActiveByVehicle(vehicleId: string): Promise<Subscription[]>;
    /**
     * Find subscription by vehicle and feature
     */
    findByVehicleAndFeature(vehicleId: string, featureId: string): Promise<Subscription | null>;
    /**
     * Check if vehicle has active subscription for feature
     */
    hasActiveSubscription(vehicleId: string, featureId: string): Promise<boolean>;
    /**
     * Find expired subscriptions
     */
    findExpired(): Promise<Subscription[]>;
    /**
     * Find subscriptions expiring soon
     */
    findExpiringSoon(hoursAhead: number): Promise<Subscription[]>;
    /**
     * Create a new subscription
     */
    create(subscription: Subscription): Promise<Subscription>;
    /**
     * Update subscription status
     */
    updateStatus(subscriptionId: string, status: SubscriptionStatus, additionalFields?: Partial<Subscription>): Promise<Subscription>;
    /**
     * Activate subscription
     */
    activate(subscriptionId: string): Promise<Subscription>;
    /**
     * Deactivate subscription
     */
    deactivate(subscriptionId: string): Promise<Subscription>;
    /**
     * Mark subscription as expired
     */
    markExpired(subscriptionId: string): Promise<Subscription>;
    /**
     * Mark subscription as failed
     */
    markFailed(subscriptionId: string): Promise<Subscription>;
    /**
     * Delete subscription (hard delete)
     */
    delete(subscriptionId: string): Promise<void>;
}
//# sourceMappingURL=SubscriptionRepository.d.ts.map