/**
 * Transaction Data Model
 * Represents a payment transaction for feature purchase
 */
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export interface Transaction {
    transactionId: string;
    vehicleId: string;
    featureId: string;
    subscriptionId?: string;
    amount: number;
    status: TransactionStatus;
    paymentMethod?: string;
    timestamp: Date;
}
/**
 * Validate transaction data
 */
export declare function validateTransaction(transaction: any): transaction is Transaction;
/**
 * Create a new transaction with validation
 */
export declare function createTransaction(data: Partial<Transaction>): Transaction;
//# sourceMappingURL=Transaction.d.ts.map