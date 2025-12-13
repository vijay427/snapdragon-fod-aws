"use strict";
/**
 * MongoDB Atlas Connection Manager
 * Handles connection pooling and configuration for MongoDB Atlas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.closeDatabase = closeDatabase;
exports.getDatabase = getDatabase;
exports.checkDatabaseHealth = checkDatabaseHealth;
const mongodb_1 = require("mongodb");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
// Connection configuration
const CONNECTION_POOL_SIZE = 10;
const CONNECTION_TIMEOUT_MS = 10000;
const SERVER_SELECTION_TIMEOUT_MS = 5000;
// Singleton client instance
let cachedClient = null;
let cachedDb = null;
/**
 * Get MongoDB connection string from AWS Secrets Manager
 */
async function getConnectionString() {
    // Check for local development override
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }
    // Fetch from AWS Secrets Manager
    const secretName = process.env.MONGODB_SECRET_NAME || 'fod-mongodb-connection';
    const region = process.env.AWS_REGION || 'us-east-1';
    const client = new client_secrets_manager_1.SecretsManagerClient({ region });
    try {
        const response = await client.send(new client_secrets_manager_1.GetSecretValueCommand({
            SecretId: secretName,
        }));
        if (!response.SecretString) {
            throw new Error('Secret value is empty');
        }
        const secret = JSON.parse(response.SecretString);
        return secret.connectionString;
    }
    catch (error) {
        console.error('Failed to retrieve MongoDB connection string:', error);
        throw new Error(`Failed to retrieve database credentials: ${error.message}`);
    }
}
/**
 * Connect to MongoDB Atlas with connection pooling
 */
async function connectToDatabase() {
    // Return cached connection if available
    if (cachedClient && cachedDb) {
        return cachedDb;
    }
    try {
        const connectionString = await getConnectionString();
        const dbName = process.env.MONGODB_DATABASE || 'fod-system';
        // MongoDB connection options
        const options = {
            maxPoolSize: CONNECTION_POOL_SIZE,
            minPoolSize: 2,
            connectTimeoutMS: CONNECTION_TIMEOUT_MS,
            serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
            retryWrites: true,
            retryReads: true,
            w: 'majority',
        };
        // Create new client
        const client = new mongodb_1.MongoClient(connectionString, options);
        // Connect to MongoDB
        await client.connect();
        // Verify connection
        await client.db('admin').command({ ping: 1 });
        console.log('Successfully connected to MongoDB Atlas');
        // Cache the connection
        cachedClient = client;
        cachedDb = client.db(dbName);
        return cachedDb;
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
}
/**
 * Close MongoDB connection (for graceful shutdown)
 */
async function closeDatabase() {
    if (cachedClient) {
        await cachedClient.close();
        cachedClient = null;
        cachedDb = null;
        console.log('MongoDB connection closed');
    }
}
/**
 * Get database instance (connects if not already connected)
 */
async function getDatabase() {
    if (!cachedDb) {
        return await connectToDatabase();
    }
    return cachedDb;
}
/**
 * Health check for database connection
 */
async function checkDatabaseHealth() {
    try {
        if (!cachedClient) {
            return false;
        }
        await cachedClient.db('admin').command({ ping: 1 });
        return true;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}
