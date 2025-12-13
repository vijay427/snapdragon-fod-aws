"use strict";
/**
 * Subscription Repository
 * Handles CRUD operations for subscriptions in MongoDB
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRepository = void 0;
const database_1 = require("../config/database");
const collections_1 = require("../config/collections");
const Subscription_1 = require("../models/Subscription");
const Errors_1 = require("../models/Errors");
class SubscriptionRepository {
    async getCollection() {
        const db = await (0, database_1.getDatabase)();
        return db.collection(collections_1.COLLECTIONS.SUBSCRIPTIONS);
    }
    /**
     * Find subscription by ID
     */
    async findById(subscriptionId) {
        try {
            const collection = await this.getCollection();
            const result = await collection.findOne({ subscriptionId });
            return result;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findById', error.message, { subscriptionId });
        }
    }
    /**
     * Find active subscriptions for a vehicle
     */
    async findActiveByVehicle(vehicleId) {
        try {
            const collection = await this.getCollection();
            const results = await collection.find({ vehicleId, status: 'ACTIVE' }).toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findActiveByVehicle', error.message, { vehicleId });
        }
    }
    /**
     * Find subscription by vehicle and feature
     */
    async findByVehicleAndFeature(vehicleId, featureId) {
        try {
            const collection = await this.getCollection();
            const result = await collection.findOne({ vehicleId, featureId });
            return result;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findByVehicleAndFeature', error.message, {
                vehicleId,
                featureId,
            });
        }
    }
    /**
     * Check if vehicle has active subscription for feature
     */
    async hasActiveSubscription(vehicleId, featureId) {
        try {
            const collection = await this.getCollection();
            const count = await collection.countDocuments({
                vehicleId,
                featureId,
                status: { $in: ['PENDING', 'ACTIVE'] },
            });
            return count > 0;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('hasActiveSubscription', error.message, {
                vehicleId,
                featureId,
            });
        }
    }
    /**
     * Find expired subscriptions
     */
    async findExpired() {
        try {
            const collection = await this.getCollection();
            const now = new Date();
            const results = await collection
                .find({
                status: 'ACTIVE',
                expiresAt: { $lte: now },
            })
                .toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findExpired', error.message);
        }
    }
    /**
     * Find subscriptions expiring soon
     */
    async findExpiringSoon(hoursAhead) {
        try {
            const collection = await this.getCollection();
            const now = new Date();
            const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
            const results = await collection
                .find({
                status: 'ACTIVE',
                expiresAt: {
                    $gte: now,
                    $lte: futureTime,
                },
            })
                .toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findExpiringSoon', error.message, { hoursAhead });
        }
    }
    /**
     * Create a new subscription
     */
    async create(subscription) {
        try {
            if (!(0, Subscription_1.validateSubscription)(subscription)) {
                throw new Error('Invalid subscription data');
            }
            const collection = await this.getCollection();
            await collection.insertOne(subscription);
            return subscription;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('create', error.message, {
                subscriptionId: subscription.subscriptionId,
            });
        }
    }
    /**
     * Update subscription status
     */
    async updateStatus(subscriptionId, status, additionalFields) {
        try {
            const collection = await this.getCollection();
            const updates = { status, ...additionalFields };
            const result = await collection.findOneAndUpdate({ subscriptionId }, { $set: updates }, { returnDocument: 'after' });
            if (!result) {
                throw new Errors_1.SubscriptionNotFoundError(subscriptionId);
            }
            return result;
        }
        catch (error) {
            if (error instanceof Errors_1.SubscriptionNotFoundError) {
                throw error;
            }
            throw new Errors_1.DatabaseError('updateStatus', error.message, { subscriptionId });
        }
    }
    /**
     * Activate subscription
     */
    async activate(subscriptionId) {
        return this.updateStatus(subscriptionId, 'ACTIVE', {
            activatedAt: new Date(),
        });
    }
    /**
     * Deactivate subscription
     */
    async deactivate(subscriptionId) {
        return this.updateStatus(subscriptionId, 'DEACTIVATED', {
            deactivatedAt: new Date(),
        });
    }
    /**
     * Mark subscription as expired
     */
    async markExpired(subscriptionId) {
        return this.updateStatus(subscriptionId, 'EXPIRED', {
            deactivatedAt: new Date(),
        });
    }
    /**
     * Mark subscription as failed
     */
    async markFailed(subscriptionId) {
        return this.updateStatus(subscriptionId, 'FAILED');
    }
    /**
     * Delete subscription (hard delete)
     */
    async delete(subscriptionId) {
        try {
            const collection = await this.getCollection();
            const result = await collection.deleteOne({ subscriptionId });
            if (result.deletedCount === 0) {
                throw new Errors_1.SubscriptionNotFoundError(subscriptionId);
            }
        }
        catch (error) {
            if (error instanceof Errors_1.SubscriptionNotFoundError) {
                throw error;
            }
            throw new Errors_1.DatabaseError('delete', error.message, { subscriptionId });
        }
    }
}
exports.SubscriptionRepository = SubscriptionRepository;
