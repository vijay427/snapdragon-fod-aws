// Jest setup file
// Configure test environment and global test utilities

// Set test timeout
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.MONGODB_URI = 'mongodb://localhost:27017/fod-test';

// Global test utilities can be added here
