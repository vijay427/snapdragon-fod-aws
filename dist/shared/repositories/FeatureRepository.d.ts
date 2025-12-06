/**
 * Feature Repository
 * Handles CRUD operations for features in MongoDB
 */
import { Feature } from '../models/Feature';
export declare class FeatureRepository {
    private getCollection;
    /**
     * Find feature by ID
     */
    findById(featureId: string): Promise<Feature | null>;
    /**
     * Find all active features
     */
    findAllActive(): Promise<Feature[]>;
    /**
     * Find features by type
     */
    findByType(featureType: string): Promise<Feature[]>;
    /**
     * Create a new feature
     */
    create(feature: Feature): Promise<Feature>;
    /**
     * Update a feature
     */
    update(featureId: string, updates: Partial<Feature>): Promise<Feature>;
    /**
     * Delete a feature (soft delete by setting isActive to false)
     */
    delete(featureId: string): Promise<void>;
    /**
     * Check if feature exists and is active
     */
    isAvailable(featureId: string): Promise<boolean>;
}
//# sourceMappingURL=FeatureRepository.d.ts.map