"use strict";
/**
 * Transaction Repository
 * Handles CRUD operations for transactions in MongoDB
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
const database_1 = require("../config/database");
const collections_1 = require("../config/collections");
const Transaction_1 = require("../models/Transaction");
const Errors_1 = require("../models/Errors");
class TransactionRepository {
    async getCollection() {
        const db = await (0, database_1.getDatabase)();
        return db.collection(collections_1.COLLECTIONS.TRANSACTIONS);
    }
    /**
     * Find transaction by ID
     */
    async findById(transactionId) {
        try {
            const collection = await this.getCollection();
            const result = await collection.findOne({ transactionId });
            return result;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findById', error.message, { transactionId });
        }
    }
    /**
     * Find transactions by vehicle
     */
    async findByVehicle(vehicleId, limit = 50) {
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
     * Find transactions by subscription
     */
    async findBySubscription(subscriptionId) {
        try {
            const collection = await this.getCollection();
            const results = await collection
                .find({ subscriptionId })
                .sort({ timestamp: -1 })
                .toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findBySubscription', error.message, { subscriptionId });
        }
    }
    /**
     * Find transactions by status
     */
    async findByStatus(status, limit = 100) {
        try {
            const collection = await this.getCollection();
            const results = await collection
                .find({ status })
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();
            return results;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('findByStatus', error.message, { status });
        }
    }
    /**
     * Find pending transactions
     */
    async findPending() {
        return this.findByStatus('PENDING');
    }
    /**
     * Create a new transaction
     */
    async create(transaction) {
        try {
            if (!(0, Transaction_1.validateTransaction)(transaction)) {
                throw new Error('Invalid transaction data');
            }
            const collection = await this.getCollection();
            await collection.insertOne(transaction);
            return transaction;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('create', error.message, {
                transactionId: transaction.transactionId,
            });
        }
    }
    /**
     * Update transaction status
     */
    async updateStatus(transactionId, status, subscriptionId) {
        try {
            const collection = await this.getCollection();
            const updates = { status };
            if (subscriptionId) {
                updates.subscriptionId = subscriptionId;
            }
            const result = await collection.findOneAndUpdate({ transactionId }, { $set: updates }, { returnDocument: 'after' });
            if (!result) {
                throw new Errors_1.TransactionNotFoundError(transactionId);
            }
            return result;
        }
        catch (error) {
            if (error instanceof Errors_1.TransactionNotFoundError) {
                throw error;
            }
            throw new Errors_1.DatabaseError('updateStatus', error.message, { transactionId });
        }
    }
    /**
     * Mark transaction as completed
     */
    async markCompleted(transactionId, subscriptionId) {
        return this.updateStatus(transactionId, 'COMPLETED', subscriptionId);
    }
    /**
     * Mark transaction as failed
     */
    async markFailed(transactionId) {
        return this.updateStatus(transactionId, 'FAILED');
    }
    /**
     * Mark transaction as refunded
     */
    async markRefunded(transactionId) {
        return this.updateStatus(transactionId, 'REFUNDED');
    }
    /**
     * Get total revenue for a vehicle
     */
    async getTotalRevenueByVehicle(vehicleId) {
        try {
            const collection = await this.getCollection();
            const result = await collection
                .aggregate([
                {
                    $match: {
                        vehicleId,
                        status: 'COMPLETED',
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                    },
                },
            ])
                .toArray();
            return result.length > 0 ? result[0].total : 0;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('getTotalRevenueByVehicle', error.message, { vehicleId });
        }
    }
    /**
     * Get total revenue for a time period
     */
    async getTotalRevenue(startDate, endDate) {
        try {
            const collection = await this.getCollection();
            const result = await collection
                .aggregate([
                {
                    $match: {
                        status: 'COMPLETED',
                        timestamp: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                    },
                },
            ])
                .toArray();
            return result.length > 0 ? result[0].total : 0;
        }
        catch (error) {
            throw new Errors_1.DatabaseError('getTotalRevenue', error.message, { startDate, endDate });
        }
    }
}
exports.TransactionRepository = TransactionRepository;
