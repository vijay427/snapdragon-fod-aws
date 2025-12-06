"use strict";
/**
 * Feature Repository
 * Handles CRUD operations for features in MongoDB
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureRepository = void 0;
const database_1 = require("../config/database");
const collections_1 = require("../config/collections");
const Feature_1 = require("../models/Feature");
const Errors_1 = require("../models/Errors");
class FeatureRepository {
    async getCollection() {
        const db = await (0, database_1.getDatabase)();
        return db.collection(collections_1.COLLECTIONS.FEATURES);
    }
    /**
     * Find feature by ID
     */
    async findById(featureId) {
        try {
            const collection = await this.getCollection();
            const result = await collection.findOne({ featureId });
            return result;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findById', error.message, { featureId });
        }
    }
    /**
     * Find all active features
     */
    async findAllActive() {
        try {
            const collection = await this.getCollection();
            const results = await collection.find({ isActive: true }).toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findAllActive', error.message);
        }
    }
    /**
     * Find features by type
     */
    async findByType(featureType) {
        try {
            const collection = await this.getCollection();
            const results = await collection.find({ featureType, isActive: true }).toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findByType', error.message, { featureType });
        }
    }
    /**
     * Create a new feature
     */
    async create(feature) {
        try {
            if (!(0, Feature_1.validateFeature)(feature)) {
                throw new Error('Invalid feature data');
            }
            const collection = await this.getCollection();
            await collection.insertOne(feature);
            return feature;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('create', error.message, { featureId: feature.featureId });
        }
    }
    /**
     * Update a feature
     */
    async update(featureId, updates) {
        try {
            const collection = await this.getCollection();
            const result = await collection.findOneAndUpdate({ featureId }, { $set: updates }, { returnDocument: 'after' });
            if (!result) {
                throw new Errors_1.FeatureNotFoundError(featureId);
            }
            return result;
        }
        catch (error) {
            if (error instanceof Errors_1.FeatureNotFoundError) {
                throw error;
            }
            throw new Errors_1.DatabaseError('update', error.message, { featureId });
        }
    }
    /**
     * Delete a feature (soft delete by setting isActive to false)
     */
    async delete(featureId) {
        try {
            const collection = await this.getCollection();
            const result = await collection.updateOne({ featureId }, { $set: { isActive: false } });
            if (result.matchedCount === 0) {
                throw new Errors_1.FeatureNotFoundError(featureId);
            }
        }
        catch (error) {
            if (error instanceof Errors_1.FeatureNotFoundError) {
                throw error;
            }
            throw new Errors_1.DatabaseError('delete', error.message, { featureId });
        }
    }
    /**
     * Check if feature exists and is active
     */
    async isAvailable(featureId) {
        try {
            const feature = await this.findById(featureId);
            return feature !== null && feature.isActive;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('isAvailable', error.message, { featureId });
        }
    }
}
exports.FeatureRepository = FeatureRepository;
//# sourceMappingURL=FeatureRepository.js.map