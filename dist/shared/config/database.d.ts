/**
 * MongoDB Atlas Connection Manager
 * Handles connection pooling and configuration for MongoDB Atlas
 */
import { Db } from 'mongodb';
/**
 * Connect to MongoDB Atlas with connection pooling
 */
export declare function connectToDatabase(): Promise<Db>;
/**
 * Close MongoDB connection (for graceful shutdown)
 */
export declare function closeDatabase(): Promise<void>;
/**
 * Get database instance (connects if not already connected)
 */
export declare function getDatabase(): Promise<Db>;
/**
 * Health check for database connection
 */
export declare function checkDatabaseHealth(): Promise<boolean>;
//# sourceMappingURL=database.d.ts.map