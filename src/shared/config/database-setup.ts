/**
 * Database Setup Script
 * Initializes MongoDB Atlas database with collections, indexes, and seed data
 */

import { connectToDatabase, closeDatabase } from './database';
import { createCollections, createIndexes, COLLECTIONS } from './collections';

/**
 * Seed initial feature catalog
 */
async function seedFeatures(): Promise<void> {
  const db = await connectToDatabase();
  const featuresCollection = db.collection(COLLECTIONS.FEATURES);

  const features = [
    {
      featureId: 'CONNECTIVITY_5G',
      name: '5G Connectivity Upgrade',
      description: 'Upgrade from 4G to 5G connectivity for faster data speeds',
      featureType: 'CONNECTIVITY_TIER',
      price: 99.99,
      duration: 0, // Permanent
      isActive: true,
      metadata: {
        tier: '5G',
        maxSpeed: '1Gbps',
      },
    },
    {
      featureId: 'SPORT_MODE_WEEKEND',
      name: 'Sport Mode - Weekend Pass',
      description: 'Unlock sport mode performance for the weekend',
      featureType: 'PERFORMANCE_MODE',
      price: 29.99,
      duration: 48, // 48 hours
      isActive: true,
      metadata: {
        mode: 'SPORT',
        throttleResponse: 'AGGRESSIVE',
        suspensionStiffness: 'FIRM',
        steeringWeight: 'HEAVY',
      },
    },
    {
      featureId: 'SPORT_MODE_MONTHLY',
      name: 'Sport Mode - Monthly',
      description: 'Unlock sport mode performance for 30 days',
      featureType: 'PERFORMANCE_MODE',
      price: 99.99,
      duration: 720, // 30 days
      isActive: true,
      metadata: {
        mode: 'SPORT',
        throttleResponse: 'AGGRESSIVE',
        suspensionStiffness: 'FIRM',
        steeringWeight: 'HEAVY',
      },
    },
    {
      featureId: 'ECO_MODE',
      name: 'Eco Mode',
      description: 'Optimize vehicle for maximum efficiency',
      featureType: 'PERFORMANCE_MODE',
      price: 0,
      duration: 0, // Permanent, free feature
      isActive: true,
      metadata: {
        mode: 'ECO',
        throttleResponse: 'SMOOTH',
        regenerativeBraking: 'MAXIMUM',
      },
    },
    {
      featureId: 'PREMIUM_AUDIO',
      name: 'Premium Audio System',
      description: 'Unlock premium audio features and equalizer',
      featureType: 'INFOTAINMENT',
      price: 199.99,
      duration: 0, // Permanent
      isActive: true,
      metadata: {
        channels: '7.1',
        equalizer: 'ADVANCED',
        spatialAudio: true,
      },
    },
  ];

  // Insert features if they don't exist
  for (const feature of features) {
    await featuresCollection.updateOne(
      { featureId: feature.featureId },
      { $setOnInsert: feature },
      { upsert: true }
    );
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${features.length} features`);
}

/**
 * Main setup function
 */
export async function setupDatabase(): Promise<void> {
  try {
    // eslint-disable-next-line no-console
    console.log('Starting database setup...');

    // Connect to database
    const db = await connectToDatabase();
    // eslint-disable-next-line no-console
    console.log('Connected to MongoDB Atlas');

    // Create collections with validation
    await createCollections(db);
    // eslint-disable-next-line no-console
    console.log('Collections created/updated');

    // Create indexes
    await createIndexes(db);
    // eslint-disable-next-line no-console
    console.log('Indexes created');

    // Seed initial data
    await seedFeatures();
    // eslint-disable-next-line no-console
    console.log('Initial data seeded');

    // eslint-disable-next-line no-console
    console.log('Database setup completed successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database setup failed:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run setup if executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('Setup complete');
      process.exit(0);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Setup failed:', error);
      process.exit(1);
    });
}
