/**
 * Feature Data Model
 * Represents a purchasable feature in the FOD system
 */
export type FeatureType = 'CONNECTIVITY_TIER' | 'PERFORMANCE_MODE' | 'INFOTAINMENT';
export interface Feature {
    featureId: string;
    name: string;
    description: string;
    featureType: FeatureType;
    price: number;
    duration: number;
    isActive: boolean;
    metadata?: Record<string, any>;
}
/**
 * Validate feature data
 */
export declare function validateFeature(feature: any): feature is Feature;
/**
 * Create a new feature with validation
 */
export declare function createFeature(data: Partial<Feature>): Feature;
//# sourceMappingURL=Feature.d.ts.map