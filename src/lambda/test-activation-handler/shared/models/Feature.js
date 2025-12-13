"use strict";
/**
 * Feature Data Model
 * Represents a purchasable feature in the FOD system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeature = validateFeature;
exports.createFeature = createFeature;
/**
 * Validate feature data
 */
function validateFeature(feature) {
    if (!feature || typeof feature !== 'object') {
        return false;
    }
    // Required fields
    if (typeof feature.featureId !== 'string' || feature.featureId.trim() === '') {
        return false;
    }
    if (typeof feature.name !== 'string' || feature.name.trim() === '') {
        return false;
    }
    if (typeof feature.description !== 'string') {
        return false;
    }
    const validTypes = ['CONNECTIVITY_TIER', 'PERFORMANCE_MODE', 'INFOTAINMENT'];
    if (!validTypes.includes(feature.featureType)) {
        return false;
    }
    if (typeof feature.price !== 'number' || feature.price < 0) {
        return false;
    }
    if (typeof feature.duration !== 'number' || feature.duration < 0) {
        return false;
    }
    if (typeof feature.isActive !== 'boolean') {
        return false;
    }
    return true;
}
/**
 * Create a new feature with validation
 */
function createFeature(data) {
    const feature = {
        featureId: data.featureId || '',
        name: data.name || '',
        description: data.description || '',
        featureType: data.featureType || 'PERFORMANCE_MODE',
        price: data.price ?? 0,
        duration: data.duration ?? 0,
        isActive: data.isActive ?? true,
        metadata: data.metadata,
    };
    if (!validateFeature(feature)) {
        throw new Error('Invalid feature data');
    }
    return feature;
}
