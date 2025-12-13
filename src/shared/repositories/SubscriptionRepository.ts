/**
 * Subscription Repository
 * Handles CRUD operations for subscriptions in MongoDB
 */

import { Collection } from 'mongodb';
import { getDatabase } from '../config/database';
import { COLLECTIONS } from '../config/collections';
import { Subscription, SubscriptionStatus, validateSubscription } from '../models/Subscription';
import { SubscriptionNotFoundError, DatabaseError } from '../models/Errors';

export class SubscriptionRepository {
  private async getCollection(): Promise<Collection> {
    const db = await getDatabase();
    return db.collection(COLLECTIONS.SUBSCRIPTIONS);
  }

  /**
   * Find subscription by ID
   */
  async findById(subscriptionId: string): Promise<Subscription | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOne({ subscriptionId });
      return result as unknown as Subscription | null;
    } catch (error: any) {
      throw new DatabaseError('findById', error.message, { subscriptionId });
    }
  }

  /**
   * Find active subscriptions for a vehicle
   */
  async findActiveByVehicle(vehicleId: string): Promise<Subscription[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection.find({ vehicleId, status: 'ACTIVE' }).toArray();
      return results as unknown as Subscription[];
    } catch (error: any) {
      throw new DatabaseError('findActiveByVehicle', error.message, { vehicleId });
    }
  }

  /**
   * Find subscription by vehicle and feature
   */
  async findByVehicleAndFeature(
    vehicleId: string,
    featureId: string
  ): Promise<Subscription | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOne({ vehicleId, featureId });
      return result as unknown as Subscription | null;
    } catch (error: any) {
      throw new DatabaseError('findByVehicleAndFeature', error.message, {
        vehicleId,
        featureId,
      });
    }
  }

  /**
   * Check if vehicle has active subscription for feature
   */
  async hasActiveSubscription(vehicleId: string, featureId: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const count = await collection.countDocuments({
        vehicleId,
        featureId,
        status: { $in: ['PENDING', 'ACTIVE'] },
      });
      return count > 0;
    } catch (error: any) {
      throw new DatabaseError('hasActiveSubscription', error.message, {
        vehicleId,
        featureId,
      });
    }
  }

  /**
   * Find expired subscriptions
   */
  async findExpired(): Promise<Subscription[]> {
    try {
      const collection = await this.getCollection();
      const now = new Date();
      const results = await collection
        .find({
          status: 'ACTIVE',
          expiresAt: { $lte: now },
        })
        .toArray();
      return results as unknown as Subscription[];
    } catch (error: any) {
      throw new DatabaseError('findExpired', error.message);
    }
  }

  /**
   * Find subscriptions expiring soon
   */
  async findExpiringSoon(hoursAhead: number): Promise<Subscription[]> {
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
      return results as unknown as Subscription[];
    } catch (error: any) {
      throw new DatabaseError('findExpiringSoon', error.message, { hoursAhead });
    }
  }

  /**
   * Create a new subscription
   */
  async create(subscription: Subscription): Promise<Subscription> {
    try {
      if (!validateSubscription(subscription)) {
        throw new Error('Invalid subscription data');
      }

      const collection = await this.getCollection();
      await collection.insertOne(subscription as any);
      return subscription;
    } catch (error: any) {
      throw new DatabaseError('create', error.message, {
        subscriptionId: subscription.subscriptionId,
      });
    }
  }

  /**
   * Update subscription status
   */
  async updateStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
    additionalFields?: Partial<Subscription>
  ): Promise<Subscription> {
    try {
      const collection = await this.getCollection();
      const updates: any = { status, ...additionalFields };

      const result = await collection.findOneAndUpdate(
        { subscriptionId },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new SubscriptionNotFoundError(subscriptionId);
      }

      return result as unknown as Subscription;
    } catch (error: any) {
      if (error instanceof SubscriptionNotFoundError) {
        throw error;
      }
      throw new DatabaseError('updateStatus', error.message, { subscriptionId });
    }
  }

  /**
   * Activate subscription
   */
  async activate(subscriptionId: string): Promise<Subscription> {
    return this.updateStatus(subscriptionId, 'ACTIVE', {
      activatedAt: new Date(),
    });
  }

  /**
   * Deactivate subscription
   */
  async deactivate(subscriptionId: string): Promise<Subscription> {
    return this.updateStatus(subscriptionId, 'DEACTIVATED', {
      deactivatedAt: new Date(),
    });
  }

  /**
   * Mark subscription as expired
   */
  async markExpired(subscriptionId: string): Promise<Subscription> {
    return this.updateStatus(subscriptionId, 'EXPIRED', {
      deactivatedAt: new Date(),
    });
  }

  /**
   * Mark subscription as failed
   */
  async markFailed(subscriptionId: string): Promise<Subscription> {
    return this.updateStatus(subscriptionId, 'FAILED');
  }

  /**
   * Delete subscription (hard delete)
   */
  async delete(subscriptionId: string): Promise<void> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteOne({ subscriptionId });

      if (result.deletedCount === 0) {
        throw new SubscriptionNotFoundError(subscriptionId);
      }
    } catch (error: any) {
      if (error instanceof SubscriptionNotFoundError) {
        throw error;
      }
      throw new DatabaseError('delete', error.message, { subscriptionId });
    }
  }
}
