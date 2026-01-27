import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import { IWalletRepository } from '../interfaces/wallet-repository.interface';
import { ITransactionRepository } from '../interfaces/transaction-repository.interface';
import {
  toMinorUnits,
  fromMinorUnits,
} from '../../../common/utils/money.util';
import { TransactionAmountValidator } from '../../../common/utils/transaction-amount.validator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TransactionType } from '@/common/enums';

/**
 * Transaction Service
 * Handles all transaction-related business logic
 */
@Injectable()
export class TransactionService {
  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepo: IWalletRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepo: ITransactionRepository,
    @InjectConnection() private readonly connection: Connection,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Finds wallet by ID and throws NotFoundException if not found
   * Used for operations that need wallet existence check before processing
   * @private
   */
  private async findWalletOrFail(walletId: string) {
    const wallet = await this.walletRepo.findWalletById(walletId);
    if (!wallet) {
      this.logger.warn(`Wallet not found: ${walletId}`, 'TransactionService');
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  /**
   * Creates a transaction record and returns formatted response
   * Can be used by other services (e.g., WalletService for initial transactions)
   * 
   * @param {string} walletId - Wallet ID
   * @param {number} amountMinorUnits - Transaction amount in minor units
   * @param {number} newBalanceMinorUnits - New balance after transaction in minor units
   * @param {TransactionType} transactionType - Transaction type (CREDIT/DEBIT)
   * @param {string} [description] - Optional transaction description
   * @param {ClientSession} [session] - Optional MongoDB session for transactions
   * @returns {Promise<Object>} Transaction result with balance and transactionId
   */
  async createTransactionRecord(
    walletId: string,
    amountMinorUnits: number,
    newBalanceMinorUnits: number,
    transactionType: TransactionType,
    description?: string,
    session?: ClientSession,
  ): Promise<{ balance: number; transactionId: string }> {
    const transaction = await this.transactionRepo.createTransaction(
      walletId,
      amountMinorUnits,
      newBalanceMinorUnits,
      transactionType,
      description,
      session,
    );

    return {
      balance: fromMinorUnits(newBalanceMinorUnits),
      transactionId: transaction._id.toString(),
    };
  }

  /**
   * Processes a debit transaction with atomic balance update
   * Uses MongoDB transactions to ensure both transaction record creation and balance update succeed or fail together
   * Flow: 1. Create transaction record, 2. Update wallet balance atomically
   * @private
   */
  private async processDebitTransaction(
    walletId: string,
    amountMinorUnits: number,
    description?: string,
  ): Promise<{ balance: number; transactionId: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Step 1: Get current wallet to calculate new balance
      // We need this to create the transaction record with correct balance
      const wallet = await this.walletRepo.findWalletById(walletId);
      if (!wallet) {
        await session.abortTransaction();
        throw new NotFoundException('Wallet not found');
      }

      // Validate sufficient funds
      if (wallet.balanceMinorUnits < amountMinorUnits) {
        await session.abortTransaction();
        this.logger.warn(
          `Insufficient funds: walletId=${walletId}, required=${amountMinorUnits}, available=${wallet.balanceMinorUnits}`,
          'TransactionService',
        );
        throw new ConflictException('Insufficient funds');
      }

      const newBalanceMinorUnits = wallet.balanceMinorUnits - amountMinorUnits;

      // Step 2: Create transaction record FIRST (within transaction)
      const transaction = await this.transactionRepo.createTransaction(
        walletId,
        amountMinorUnits,
        newBalanceMinorUnits,
        TransactionType.DEBIT,
        description,
        session,
      );

      // Step 3: Update wallet balance atomically (within same transaction)
      // The condition ensures wallet still exists and has sufficient funds
      const updatedWallet = await this.walletRepo.updateBalanceAtomic(
        walletId,
        -amountMinorUnits,
        { balanceMinorUnits: { $gte: amountMinorUnits } },
        session,
      );

      if (!updatedWallet) {
        await session.abortTransaction();
        this.logger.warn(
          `Concurrent update detected: walletId=${walletId}, amount=${amountMinorUnits}`,
          'TransactionService',
        );
        throw new ConflictException('Concurrent update detected');
      }

      // Commit transaction - both operations succeed or both fail
      await session.commitTransaction();

      return {
        balance: fromMinorUnits(newBalanceMinorUnits),
        transactionId: transaction._id.toString(),
      };
    } catch (error) {
      // Rollback on any error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Processes a credit transaction with atomic balance update
   * Uses MongoDB transactions to ensure both transaction record creation and balance update succeed or fail together
   * Flow: 1. Create transaction record, 2. Update wallet balance atomically
   * @private
   */
  private async processCreditTransaction(
    walletId: string,
    amountMinorUnits: number,
    description?: string,
  ): Promise<{ balance: number; transactionId: string }> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Step 1: Get current wallet to calculate new balance
      const wallet = await this.walletRepo.findWalletById(walletId);
      if (!wallet) {
        await session.abortTransaction();
        this.logger.warn(`Wallet not found: walletId=${walletId}`, 'TransactionService');
        throw new NotFoundException('Wallet not found');
      }

      const newBalanceMinorUnits = wallet.balanceMinorUnits + amountMinorUnits;

      // Step 2: Create transaction record FIRST (within transaction)
      const transaction = await this.transactionRepo.createTransaction(
        walletId,
        amountMinorUnits,
        newBalanceMinorUnits,
        TransactionType.CREDIT,
        description,
        session,
      );

      // Step 3: Update wallet balance atomically (within same transaction)
      const updatedWallet = await this.walletRepo.updateBalanceAtomic(
        walletId,
        amountMinorUnits,
        undefined,
        session,
      );

      if (!updatedWallet) {
        await session.abortTransaction();
        this.logger.warn(`Wallet not found during balance update: walletId=${walletId}`, 'TransactionService');
        throw new NotFoundException('Wallet not found');
      }

      // Commit transaction - both operations succeed or both fail
      await session.commitTransaction();

      return {
        balance: fromMinorUnits(newBalanceMinorUnits),
        transactionId: transaction._id.toString(),
      };
    } catch (error) {
      // Rollback on any error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Execute a credit or debit transaction on a wallet
   * 
   * Processes a transaction atomically with balance update to prevent race conditions.
   * For debit transactions, checks for sufficient funds and uses atomic updates with conditions.
   * 
   * @param {string} walletId - Wallet ID to transact on (UUID v4)
   * @param {number} amount - Transaction amount (positive for CREDIT, negative for DEBIT)
   * @param {string} [description] - Optional transaction description
   * @returns {Promise<Object>} Transaction result
   * @returns {number} balance - New balance after transaction
   * @returns {string} transactionId - Created transaction ID
   * @throws {BadRequestException} If amount is invalid (0, negative for credit, > 4 decimal places)
   * @throws {NotFoundException} If wallet not found
   * @throws {ConflictException} If insufficient funds (for debit) or concurrent update detected
   * 
   * @example
   * ```ts
   * // Credit transaction
   * const result = await transactionService.transact('wallet-id', 50.25, 'Payment received');
   * console.log(result.balance); // New balance
   * 
   * // Debit transaction
   * const result2 = await transactionService.transact('wallet-id', -25.50, 'Payment made');
   * ```
   */
  async transact(
    walletId: string,
    amount: number,
    description?: string,
  ): Promise<{ balance: number; transactionId: string }> {
    this.logger.log(
      `Processing transaction: walletId=${walletId}, amount=${amount}`,
      'TransactionService',
    );

    // Validate amount using common validator
    TransactionAmountValidator.validate(amount);

    // Determine transaction type
    const amountMinorUnits = toMinorUnits(Math.abs(amount));
    const isCredit = amount >= 0;

    // Process transaction - wallet existence checked in updateBalanceAtomic
    // This eliminates redundant DB call (previously: findById + findOneAndUpdate)
    if (isCredit) {
      return this.processCreditTransaction(walletId, amountMinorUnits, description);
    } else {
      return this.processDebitTransaction(walletId, amountMinorUnits, description);
    }
  }

  /**
   * Get paginated transactions for a wallet with filtering and sorting
   * 
   * Retrieves transactions with server-side pagination, sorting, searching, and filtering.
   * Validates date range (fromDate must be <= toDate) and ensures wallet exists.
   * 
   * @param {string} walletId - Wallet ID to get transactions for (UUID v4)
   * @param {number} skip - Number of records to skip (for pagination)
   * @param {number} limit - Maximum number of records to return
   * @param {string} [sortBy] - Field to sort by ('date', 'amount')
   * @param {'asc' | 'desc'} [sortOrder] - Sort order (default: 'desc')
   * @param {string} [search] - Search query (searches in transaction description)
   * @param {'CREDIT' | 'DEBIT'} [type] - Filter by transaction type
   * @param {Date} [fromDate] - Filter transactions from this date (inclusive)
   * @param {Date} [toDate] - Filter transactions up to this date (inclusive)
   * @returns {Promise<Object>} Paginated transactions result
   * @returns {Transaction[]} items - Array of transaction objects (converted from minor units)
   * @returns {number} total - Total number of transactions matching filters
   * @throws {BadRequestException} If date range is invalid (fromDate > toDate)
   * @throws {NotFoundException} If wallet not found
   * 
   * @example
   * ```ts
   * const result = await transactionService.getTransactions(
   *   'wallet-id',
   *   0,    // skip
   *   25,   // limit
   *   'date',  // sortBy
   *   'desc',  // sortOrder
   *   'payment', // search
   *   'CREDIT', // type filter
   *   new Date('2026-01-01'), // fromDate
   *   new Date('2026-01-31')  // toDate
   * );
   * console.log(result.items); // Transactions array
   * console.log(result.total); // Total count
   * ```
   */
  async getTransactions(
    walletId: string,
    skip: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    search?: string,
    type?: 'CREDIT' | 'DEBIT',
    fromDate?: Date,
    toDate?: Date,
  ) {
    // Validate date range: fromDate cannot be greater than toDate
    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException(
        'Invalid date range: "from" date cannot be greater than "to" date',
      );
    }

    // Ensure wallet exists
    await this.findWalletOrFail(walletId);

    const { items, total } = await this.transactionRepo.findTransactions(
      walletId,
      skip,
      limit,
      sortBy,
      sortOrder,
      search,
      type,
      fromDate,
      toDate,
    );

    return {
      items: items.map((tx) => ({
        id: tx._id.toString(),
        walletId: tx.walletId,
        amount: fromMinorUnits(tx.amountMinorUnits),
        balance: fromMinorUnits(tx.balanceMinorUnits),
        description: tx.description,
        date: tx.date,
        type: tx.type,
      })),
      total,
    };
  }

  /**
   * Export all transactions for a wallet
   * @deprecated Use ExportService.exportTransactionsSync() or ExportService.startAsyncExport() instead
   * This method is kept for backward compatibility but should not be used for large datasets
   */
  async exportTransactions(walletId: string) {
    this.logger.warn(
      'exportTransactions() is deprecated. Use ExportService for production exports.',
      'TransactionService',
    );

    // Ensure wallet exists
    await this.findWalletOrFail(walletId);

    const transactions = await this.transactionRepo.findAllTransactions(walletId);

    return transactions.map((tx) => ({
      id: tx._id.toString(),
      walletId: tx.walletId,
      amount: fromMinorUnits(tx.amountMinorUnits),
      balance: fromMinorUnits(tx.balanceMinorUnits),
      description: tx.description || '',
      date: tx.date.toISOString(),
      type: tx.type,
    }));
  }

  /**
   * Get transaction summary (totals) for a wallet
   */
  /**
   * Get transaction summary (totals) for a wallet
   * 
   * Returns aggregated statistics: total credits, total debits, and total transaction count.
   * Uses MongoDB aggregation for efficient calculation on the database side.
   * Converts amounts from minor units to major units for API response.
   * 
   * @param {string} walletId - Wallet ID to get summary for (UUID v4)
   * @returns {Promise<Object>} Transaction summary
   * @returns {number} totalCredits - Total credits amount (converted from minor units)
   * @returns {number} totalDebits - Total debits amount (converted from minor units)
   * @returns {number} totalTransactions - Total number of transactions
   * @throws {NotFoundException} If wallet not found
   * 
   * @example
   * ```ts
   * const summary = await transactionService.getTransactionSummary('wallet-id');
   * console.log(summary.totalCredits); // Total credits
   * console.log(summary.totalDebits);  // Total debits
   * console.log(summary.totalTransactions); // Transaction count
   * ```
   */
  async getTransactionSummary(walletId: string) {
    // Ensure wallet exists
    await this.findWalletOrFail(walletId);

    const summary = await this.transactionRepo.getTransactionSummary(walletId);

    return {
      totalCredits: fromMinorUnits(summary.totalCredits),
      totalDebits: fromMinorUnits(summary.totalDebits),
      totalTransactions: summary.totalTransactions,
    };
  }
}
