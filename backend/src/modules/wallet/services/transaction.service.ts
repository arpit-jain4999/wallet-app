import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { IWalletRepository } from '../interfaces/wallet-repository.interface';
import { ITransactionRepository } from '../interfaces/transaction-repository.interface';
import {
  toMinorUnits,
  fromMinorUnits,
  validateAmount,
} from '../../../common/utils/money.util';
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
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  /**
   * Validates transaction amount
   * @private
   */
  private validateTransactionAmount(amount: number): void {
    const validation = validateAmount(Math.abs(amount));
    if (!validation.valid) {
      this.logger.warn(`Invalid transaction amount: ${validation.error}`, 'TransactionService');
      throw new BadRequestException(validation.error);
    }
  }

  /**
   * Finds wallet by ID and throws NotFoundException if not found
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
   * @private
   */
  private async createTransactionRecord(
    walletId: string,
    amountMinorUnits: number,
    newBalanceMinorUnits: number,
    transactionType: TransactionType,
    description?: string,
  ): Promise<{ balance: number; transactionId: string }> {
    const transaction = await this.transactionRepo.createTransaction(
      walletId,
      amountMinorUnits,
      newBalanceMinorUnits,
      transactionType,
      description,
    );

    return {
      balance: fromMinorUnits(newBalanceMinorUnits),
      transactionId: transaction._id.toString(),
    };
  }

  /**
   * Processes a debit transaction with atomic balance update
   * @private
   */
  private async processDebitTransaction(
    walletId: string,
    amountMinorUnits: number,
    currentBalance: number,
    description?: string,
  ): Promise<{ balance: number; transactionId: string }> {
    // Check sufficient funds
    if (currentBalance < amountMinorUnits) {
      this.logger.warn(
        `Insufficient funds: walletId=${walletId}, required=${amountMinorUnits}, available=${currentBalance}`,
        'TransactionService',
      );
      throw new ConflictException('Insufficient funds');
    }

    // Atomic update with condition to prevent race conditions
    const updatedWallet = await this.walletRepo.updateBalanceAtomic(
      walletId,
      -amountMinorUnits,
      { balanceMinorUnits: { $gte: amountMinorUnits } },
    );

    if (!updatedWallet) {
      this.logger.warn(
        `Concurrent update detected or insufficient funds: walletId=${walletId}`,
        'TransactionService',
      );
      throw new ConflictException('Insufficient funds or concurrent update');
    }

    return this.createTransactionRecord(
      walletId,
      amountMinorUnits,
      updatedWallet.balanceMinorUnits,
      TransactionType.DEBIT,
      description,
    );
  }

  /**
   * Processes a credit transaction with atomic balance update
   * @private
   */
  private async processCreditTransaction(
    walletId: string,
    amountMinorUnits: number,
    description?: string,
  ): Promise<{ balance: number; transactionId: string }> {
    // Atomic update for credit
    const updatedWallet = await this.walletRepo.updateBalanceAtomic(
      walletId,
      amountMinorUnits,
    );

    if (!updatedWallet) {
      this.logger.warn(`Wallet not found during credit: walletId=${walletId}`, 'TransactionService');
      throw new NotFoundException('Wallet not found');
    }

    return this.createTransactionRecord(
      walletId,
      amountMinorUnits,
      updatedWallet.balanceMinorUnits,
      TransactionType.CREDIT,
      description,
    );
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

    // Validate amount
    this.validateTransactionAmount(amount);

    // Find wallet or fail
    const wallet = await this.findWalletOrFail(walletId);

    // Determine transaction type
    const amountMinorUnits = toMinorUnits(Math.abs(amount));
    const isCredit = amount >= 0;

    // Process transaction based on type
    if (isCredit) {
      return this.processCreditTransaction(walletId, amountMinorUnits, description);
    } else {
      return this.processDebitTransaction(
        walletId,
        amountMinorUnits,
        wallet.balanceMinorUnits,
        description,
      );
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
