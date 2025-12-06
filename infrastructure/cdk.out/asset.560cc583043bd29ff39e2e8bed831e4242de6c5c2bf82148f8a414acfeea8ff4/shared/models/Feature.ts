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
  duration: number; // Duration in hours (0 = permanent)
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * Validate feature data
 */
export function validateFeature(feature: any): feature is Feature {
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

  const validTypes: FeatureType[] = ['CONNECTIVITY_TIER', 'PERFORMANCE_MODE', 'INFOTAINMENT'];
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
export function createFeature(data: Partial<Feature>): Feature {
  const feature: Feature = {
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
