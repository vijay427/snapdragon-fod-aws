/**
 * Transaction Repository
 * Handles CRUD operations for transactions in MongoDB
 */

import { Collection } from 'mongodb';
import { getDatabase } from '../config/database';
import { COLLECTIONS } from '../config/collections';
import { Transaction, TransactionStatus, validateTransaction } from '../models/Transaction';
import { TransactionNotFoundError, DatabaseError } from '../models/Errors';

export class TransactionRepository {
  private async getCollection(): Promise<Collection> {
    const db = await getDatabase();
    return db.collection(COLLECTIONS.TRANSACTIONS);
  }

  /**
   * Find transaction by ID
   */
  async findById(transactionId: string): Promise<Transaction | null> {
    try {
      const collection = await this.getCollection();
      const result = await collection.findOne({ transactionId });
      return result as unknown as Transaction | null;
    } catch (error: any) {
      throw new DatabaseError('findById', error.message, { transactionId });
    }
  }

  /**
   * Find transactions by vehicle
   */
  async findByVehicle(vehicleId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection
        .find({ vehicleId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return results as unknown as Transaction[];
    } catch (error: any) {
      throw new DatabaseError('findByVehicle', error.message, { vehicleId });
    }
  }

  /**
   * Find transactions by subscription
   */
  async findBySubscription(subscriptionId: string): Promise<Transaction[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection.find({ subscriptionId }).sort({ timestamp: -1 }).toArray();
      return results as unknown as Transaction[];
    } catch (error: any) {
      throw new DatabaseError('findBySubscription', error.message, { subscriptionId });
    }
  }

  /**
   * Find transactions by status
   */
  async findByStatus(status: TransactionStatus, limit: number = 100): Promise<Transaction[]> {
    try {
      const collection = await this.getCollection();
      const results = await collection
        .find({ status })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      return results as unknown as Transaction[];
    } catch (error: any) {
      throw new DatabaseError('findByStatus', error.message, { status });
    }
  }

  /**
   * Find pending transactions
   */
  async findPending(): Promise<Transaction[]> {
    return this.findByStatus('PENDING');
  }

  /**
   * Create a new transaction
   */
  async create(transaction: Transaction): Promise<Transaction> {
    try {
      if (!validateTransaction(transaction)) {
        throw new Error('Invalid transaction data');
      }

      const collection = await this.getCollection();
      await collection.insertOne(transaction as any);
      return transaction;
    } catch (error: any) {
      throw new DatabaseError('create', error.message, {
        transactionId: transaction.transactionId,
      });
    }
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    transactionId: string,
    status: TransactionStatus,
    subscriptionId?: string
  ): Promise<Transaction> {
    try {
      const collection = await this.getCollection();
      const updates: any = { status };
      if (subscriptionId) {
        updates.subscriptionId = subscriptionId;
      }

      const result = await collection.findOneAndUpdate(
        { transactionId },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new TransactionNotFoundError(transactionId);
      }

      return result as unknown as Transaction;
    } catch (error: any) {
      if (error instanceof TransactionNotFoundError) {
        throw error;
      }
      throw new DatabaseError('updateStatus', error.message, { transactionId });
    }
  }

  /**
   * Mark transaction as completed
   */
  async markCompleted(transactionId: string, subscriptionId: string): Promise<Transaction> {
    return this.updateStatus(transactionId, 'COMPLETED', subscriptionId);
  }

  /**
   * Mark transaction as failed
   */
  async markFailed(transactionId: string): Promise<Transaction> {
    return this.updateStatus(transactionId, 'FAILED');
  }

  /**
   * Mark transaction as refunded
   */
  async markRefunded(transactionId: string): Promise<Transaction> {
    return this.updateStatus(transactionId, 'REFUNDED');
  }

  /**
   * Get total revenue for a vehicle
   */
  async getTotalRevenueByVehicle(vehicleId: string): Promise<number> {
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
    } catch (error: any) {
      throw new DatabaseError('getTotalRevenueByVehicle', error.message, { vehicleId });
    }
  }

  /**
   * Get total revenue for a time period
   */
  async getTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
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
    } catch (error: any) {
      throw new DatabaseError('getTotalRevenue', error.message, { startDate, endDate });
    }
  }
}
