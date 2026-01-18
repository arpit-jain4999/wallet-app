import { TransactionDocument } from '../schemas/transaction.schema';

/**
 * Transaction Repository Interface
 * Defines contract for transaction data access operations
 */
export interface ITransactionRepository {
  /**
   * Create a new transaction
   */
  createTransaction(
    walletId: string,
    amountMinorUnits: number,
    balanceMinorUnits: number,
    type: 'CREDIT' | 'DEBIT',
    description?: string,
  ): Promise<TransactionDocument>;

  /**
   * Find transactions with pagination, sorting, and filtering
   */
  findTransactions(
    walletId: string,
    skip: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    search?: string,
    type?: 'CREDIT' | 'DEBIT',
    fromDate?: Date,
    toDate?: Date,
  ): Promise<{ items: TransactionDocument[]; total: number }>;

  /**
   * Find all transactions for a wallet (for export)
   */
  findAllTransactions(walletId: string): Promise<TransactionDocument[]>;

  /**
   * Get transaction summary (totals)
   */
  getTransactionSummary(walletId: string): Promise<{
    totalCredits: number;
    totalDebits: number;
    totalTransactions: number;
  }>;
}
