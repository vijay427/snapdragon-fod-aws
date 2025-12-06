"use strict";
/**
 * Telemetry Repository
 * Handles telemetry event logging in MongoDB
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryRepository = void 0;
const database_1 = require("../config/database");
const collections_1 = require("../config/collections");
const Errors_1 = require("../models/Errors");
class TelemetryRepository {
    async getCollection() {
        const db = await (0, database_1.getDatabase)();
        return db.collection(collections_1.COLLECTIONS.TELEMETRY);
    }
    /**
     * Log a telemetry event
     */
    async logEvent(event) {
        try {
            const collection = await this.getCollection();
            await collection.insertOne(event);
        }
        catch (error) {
            throw new Errors_1.DatabaseError('logEvent', error.message, {
                vehicleId: event.vehicleId,
                eventType: event.eventType,
            });
        }
    }
    /**
     * Log feature activation
     */
    async logActivation(vehicleId, featureId, metadata) {
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
    async logDeactivation(vehicleId, featureId, metadata) {
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
    async logUsage(vehicleId, featureId, metadata) {
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
    async logError(vehicleId, featureId, error) {
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
    async findByVehicle(vehicleId, limit = 100) {
        try {
            const collection = await this.getCollection();
            const results = await collection
                .find({ vehicleId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findByVehicle', error.message, { vehicleId });
        }
    }
    /**
     * Find events by type
     */
    async findByEventType(eventType, limit = 100) {
        try {
            const collection = await this.getCollection();
            const results = await collection
                .find({ eventType })
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findByEventType', error.message, { eventType });
        }
    }
    /**
     * Find events by vehicle and feature
     */
    async findByVehicleAndFeature(vehicleId, featureId, limit = 50) {
        try {
            const collection = await this.getCollection();
            const results = await collection
                .find({ vehicleId, featureId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findByVehicleAndFeature', error.message, {
                vehicleId,
                featureId,
            });
        }
    }
    /**
     * Find events in time range
     */
    async findByTimeRange(startDate, endDate, limit = 1000) {
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
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findByTimeRange', error.message, { startDate, endDate });
        }
    }
    /**
     * Get event count by type
     */
    async getEventCountByType(vehicleId) {
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
            const counts = {};
            results.forEach((result) => {
                counts[result._id] = result.count;
            });
            return counts;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('getEventCountByType', error.message, { vehicleId });
        }
    }
    /**
     * Delete old telemetry events (manual cleanup if TTL not working)
     */
    async deleteOldEvents(daysOld) {
        try {
            const collection = await this.getCollection();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const result = await collection.deleteMany({
                timestamp: { $lt: cutoffDate },
            });
            return result.deletedCount || 0;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('deleteOldEvents', error.message, { daysOld });
        }
    }
}
exports.TelemetryRepository = TelemetryRepository;
//# sourceMappingURL=TelemetryRepository.js.map