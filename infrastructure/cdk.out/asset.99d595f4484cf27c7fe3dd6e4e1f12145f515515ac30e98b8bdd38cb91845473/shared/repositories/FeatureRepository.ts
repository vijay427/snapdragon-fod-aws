/**
 * Feature Repository
 * Handles CRUD operations for features in MongoDB
 */

import { Collection } from 'mongodb';
import { getDatabase } from '../config/database';
import { COLLECTIONS } from '../config/collections';
import { Feature, validateFeature } from '../models/Feature';
import { FeatureNotFoundError, DatabaseError } from '../models/Errors';

export class FeatureRepository {
  private async getCollection(): Promise<Collection> {
    const db = await getDatabase();
    return db.collection(COLLECTIONS.FEATURES);
  }

  /**
   * Find feature by ID
   */
  async findById(featureId: string): Promise<Feature | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOne({ featureId });
      return result as Feature | null;
    } catch (error: any) {
      throw new DatabaseError('findById', error.message, { featureId });
    }
  }

  /**
   * Find all active features
   */
  async findAllActive(): Promise<Feature[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection.find({ isActive: true }).toArray();
      return results as unknown as Feature[];
    } catch (error: any) {
      throw new DatabaseError('findAllActive', error.message);
    }
  }

  /**
   * Find features by type
   */
  async findByType(featureType: string): Promise<Feature[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection.find({ featureType, isActive: true }).toArray();
      return results as unknown as Feature[];
    } catch (error: any) {
      throw new DatabaseError('findByType', error.message, { featureType });
    }
  }

  /**
   * Create a new feature
   */
  async create(feature: Feature): Promise<Feature> {
    try {
      if (!validateFeature(feature)) {
        throw new Error('Invalid feature data');
      }

      const collection = await this.getCollection();
      await collection.insertOne(feature as any);
      return feature;
    } catch (error: any) {
      throw new DatabaseError('create', error.message, { featureId: feature.featureId });
    }
  }

  /**
   * Update a feature
   */
  async update(featureId: string, updates: Partial<Feature>): Promise<Feature> {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOneAndUpdate(
        { featureId },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new FeatureNotFoundError(featureId);
      }

      return result as unknown as Feature;
    } catch (error: any) {
      if (error instanceof FeatureNotFoundError) {
        throw error;
      }
      throw new DatabaseError('update', error.message, { featureId });
    }
  }

  /**
   * Delete a feature (soft delete by setting isActive to false)
   */
  async delete(featureId: string): Promise<void> {
    try {
      const collection = await this.getCollection();
      const result = await collection.updateOne({ featureId }, { $set: { isActive: false } });

      if (result.matchedCount === 0) {
        throw new FeatureNotFoundError(featureId);
      }
    } catch (error: any) {
      if (error instanceof FeatureNotFoundError) {
        throw error;
      }
      throw new DatabaseError('delete', error.message, { featureId });
    }
  }

  /**
   * Check if feature exists and is active
   */
  async isAvailable(featureId: string): Promise<boolean> {
    try {
      const feature = await this.findById(featureId);
      return feature !== null && feature.isActive;
    } catch (error: any) {
      throw new DatabaseError('isAvailable', error.message, { featureId });
    }
  }
}
