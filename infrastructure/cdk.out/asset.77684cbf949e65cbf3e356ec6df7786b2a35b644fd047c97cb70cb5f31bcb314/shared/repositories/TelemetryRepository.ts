/**
 * Telemetry Repository
 * Handles telemetry event logging in MongoDB
 */

import { Collection } from 'mongodb';
import { getDatabase } from '../config/database';
import { COLLECTIONS } from '../config/collections';
import { DatabaseError } from '../models/Errors';

export type TelemetryEventType =
  | 'FEATURE_ACTIVATED'
  | 'FEATURE_DEACTIVATED'
  | 'FEATURE_USED'
  | 'ERROR'
  | 'STATE_CHANGE';

export interface TelemetryEvent {
  vehicleId: string;
  eventType: TelemetryEventType;
  featureId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class TelemetryRepository {
  private async getCollection(): Promise<Collection> {
    const db = await getDatabase();
    return db.collection(COLLECTIONS.TELEMETRY);
  }

  /**
   * Log a telemetry event
   */
  async logEvent(event: TelemetryEvent): Promise<void> {
    try {
      const collection = await this.getCollection();
      await collection.insertOne(event as any);
    } catch (error: any) {
      throw new DatabaseError('logEvent', error.message, {
        vehicleId: event.vehicleId,
        eventType: event.eventType,
      });
    }
  }

  /**
   * Log feature activation
   */
  async logActivation(
    vehicleId: string,
    featureId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      vehicleId,
      eventType: 'FEATURE_ACTIVATED',
      featureId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Log feature deactivation
   */
  async logDeactivation(
    vehicleId: string,
    featureId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      vehicleId,
      eventType: 'FEATURE_DEACTIVATED',
      featureId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Log feature usage
   */
  async logUsage(
    vehicleId: string,
    featureId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      vehicleId,
      eventType: 'FEATURE_USED',
      featureId,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Log error event
   */
  async logError(vehicleId: string, featureId: string, error: any): Promise<void> {
    await this.logEvent({
      vehicleId,
      eventType: 'ERROR',
      featureId,
      timestamp: new Date(),
      metadata: {
        error: error.message || String(error),
        code: error.code,
      },
    });
  }

  /**
   * Find events by vehicle
   */
  async findByVehicle(vehicleId: string, limit: number = 100): Promise<TelemetryEvent[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection
        .find({ vehicleId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return results as unknown as TelemetryEvent[];
    } catch (error: any) {
      throw new DatabaseError('findByVehicle', error.message, { vehicleId });
    }
  }

  /**
   * Find events by type
   */
  async findByEventType(
    eventType: TelemetryEventType,
    limit: number = 100
  ): Promise<TelemetryEvent[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection
        .find({ eventType })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return results as unknown as TelemetryEvent[];
    } catch (error: any) {
      throw new DatabaseError('findByEventType', error.message, { eventType });
    }
  }

  /**
   * Find events by vehicle and feature
   */
  async findByVehicleAndFeature(
    vehicleId: string,
    featureId: string,
    limit: number = 50
  ): Promise<TelemetryEvent[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection
        .find({ vehicleId, featureId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return results as unknown as TelemetryEvent[];
    } catch (error: any) {
      throw new DatabaseError('findByVehicleAndFeature', error.message, {
        vehicleId,
        featureId,
      });
    }
  }

  /**
   * Find events in time range
   */
  async findByTimeRange(
    startDate: Date,
    endDate: Date,
    limit: number = 1000
  ): Promise<TelemetryEvent[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection
        .find({
          timestamp: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return results as unknown as TelemetryEvent[];
    } catch (error: any) {
      throw new DatabaseError('findByTimeRange', error.message, { startDate, endDate });
    }
  }

  /**
   * Get event count by type
   */
  async getEventCountByType(vehicleId: string): Promise<Record<string, number>> {
    try {
      const collection = await this.getCollection();
      const results = await collection
        .aggregate([
          { $match: { vehicleId } },
          {
            $group: {
              _id: '$eventType',
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const counts: Record<string, number> = {};
      results.forEach((result) => {
        counts[result._id] = result.count;
      });

      return counts;
    } catch (error: any) {
      throw new DatabaseError('getEventCountByType', error.message, { vehicleId });
    }
  }

  /**
   * Delete old telemetry events (manual cleanup if TTL not working)
   */
  async deleteOldEvents(daysOld: number): Promise<number> {
    try {
      const collection = await this.getCollection();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await collection.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      return result.deletedCount || 0;
    } catch (error: any) {
      throw new DatabaseError('deleteOldEvents', error.message, { daysOld });
    }
  }
}
