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
export function validateTransaction(transaction: any): transaction is Transaction {
  if (!transaction || typeof transaction !== 'object') {
    return false;
  }

  // Required fields
  if (typeof transaction.transactionId !== 'string' || transaction.transactionId.trim() === '') {
    return false;
  }

  if (typeof transaction.vehicleId !== 'string' || transaction.vehicleId.trim() === '') {
    return false;
  }

  if (typeof transaction.featureId !== 'string' || transaction.featureId.trim() === '') {
    return false;
  }

  if (typeof transaction.amount !== 'number' || transaction.amount < 0) {
    return false;
  }

  const validStatuses: TransactionStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
  if (!validStatuses.includes(transaction.status)) {
    return false;
  }

  if (!(transaction.timestamp instanceof Date)) {
    return false;
  }

  // Optional fields validation
  if (transaction.subscriptionId !== undefined && typeof transaction.subscriptionId !== 'string') {
    return false;
  }

  if (transaction.paymentMethod !== undefined && typeof transaction.paymentMethod !== 'string') {
    return false;
  }

  return true;
}

/**
 * Create a new transaction with validation
 */
export function createTransaction(data: Partial<Transaction>): Transaction {
  const transaction: Transaction = {
    transactionId: data.transactionId || '',
    vehicleId: data.vehicleId || '',
    featureId: data.featureId || '',
    subscriptionId: data.subscriptionId,
    amount: data.amount ?? 0,
    status: data.status || 'PENDING',
    paymentMethod: data.paymentMethod,
    timestamp: data.timestamp || new Date(),
  };

  if (!validateTransaction(transaction)) {
    throw new Error('Invalid transaction data');
  }

  return transaction;
}
