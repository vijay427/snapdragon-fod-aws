/**
 * Transaction Repository
 * Handles CRUD operations for transactions in MongoDB
 */
import { Transaction, TransactionStatus } from '../models/Transaction';
export declare class TransactionRepository {
    private getCollection;
    /**
     * Find transaction by ID
     */
    findById(transactionId: string): Promise<Transaction | null>;
    /**
     * Find transactions by vehicle
     */
    findByVehicle(vehicleId: string, limit?: number): Promise<Transaction[]>;
    /**
     * Find transactions by subscription
     */
    findBySubscription(subscriptionId: string): Promise<Transaction[]>;
    /**
     * Find transactions by status
     */
    findByStatus(status: TransactionStatus, limit?: number): Promise<Transaction[]>;
    /**
     * Find pending transactions
     */
    findPending(): Promise<Transaction[]>;
    /**
     * Create a new transaction
     */
    create(transaction: Transaction): Promise<Transaction>;
    /**
     * Update transaction status
     */
    updateStatus(transactionId: string, status: TransactionStatus, subscriptionId?: string): Promise<Transaction>;
    /**
     * Mark transaction as completed
     */
    markCompleted(transactionId: string, subscriptionId: string): Promise<Transaction>;
    /**
     * Mark transaction as failed
     */
    markFailed(transactionId: string): Promise<Transaction>;
    /**
     * Mark transaction as refunded
     */
    markRefunded(transactionId: string): Promise<Transaction>;
    /**
     * Get total revenue for a vehicle
     */
    getTotalRevenueByVehicle(vehicleId: string): Promise<number>;
    /**
     * Get total revenue for a time period
     */
    getTotalRevenue(startDate: Date, endDate: Date): Promise<number>;
}
//# sourceMappingURL=TransactionRepository.d.ts.map