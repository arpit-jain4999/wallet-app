import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { WalletRepository } from './wallet.repo';
import {
  toMinorUnits,
  fromMinorUnits,
  validateAmount,
} from '../../common/utils/money.util';
import { v4 as uuidv4 } from 'uuid';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TransactionType } from '@/common/enums';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepo: WalletRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async setupWallet(name: string, balance?: number) {
    this.logger.log(`Setting up wallet for: ${name}`, 'WalletService');
    const initialBalance = balance || 0;
    
    // Validate initial balance
    this.validateTransactionAmount(initialBalance);

    const balanceMinorUnits = toMinorUnits(initialBalance);
    const walletId = uuidv4();

    const wallet = await this.walletRepo.createWallet(
      name,
      balanceMinorUnits,
      walletId,
    );

    this.logger.log(`Wallet created successfully: ${walletId}`, 'WalletService');

    // Create initial transaction if balance > 0
    let transactionId: string | undefined;
    if (balanceMinorUnits > 0) {
      const result = await this.createTransactionRecord(
        walletId,
        balanceMinorUnits,
        balanceMinorUnits,
        TransactionType.CREDIT,
        'Setup',
      );
      transactionId = result.transactionId;
    }

    return {
      id: walletId,
      balance: fromMinorUnits(wallet.balanceMinorUnits),
      name: wallet.name,
      date: wallet.createdAt || new Date(),
      transactionId,
    };
  }

  async getWallet(walletId: string) {
    this.logger.log(`Fetching wallet: ${walletId}`, 'WalletService');
    const wallet = await this.findWalletOrFail(walletId);

    return {
      id: wallet.walletId,
      balance: fromMinorUnits(wallet.balanceMinorUnits),
      name: wallet.name,
      date: wallet.updatedAt || wallet.createdAt || new Date(),
    };
  }

  /**
   * Validates transaction amount
   * @private
   */
  private validateTransactionAmount(amount: number): void {
    const validation = validateAmount(Math.abs(amount));
    if (!validation.valid) {
      this.logger.warn(`Invalid transaction amount: ${validation.error}`, 'WalletService');
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
      this.logger.warn(`Wallet not found: ${walletId}`, 'WalletService');
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
    const transaction = await this.walletRepo.createTransaction(
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
        'WalletService',
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
        'WalletService',
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
      this.logger.warn(`Wallet not found during credit: walletId=${walletId}`, 'WalletService');
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
   * Processes a transaction (credit or debit) on a wallet
   */
  async transact(
    walletId: string,
    amount: number,
    description?: string,
  ): Promise<{ balance: number; transactionId: string }> {
    this.logger.log(
      `Processing transaction: walletId=${walletId}, amount=${amount}`,
      'WalletService',
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

    const { items, total } = await this.walletRepo.findTransactions(
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

  async exportTransactions(walletId: string) {
    // Ensure wallet exists
    await this.findWalletOrFail(walletId);

    const transactions = await this.walletRepo.findAllTransactions(walletId);

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

  async getTransactionSummary(walletId: string) {
    // Ensure wallet exists
    await this.findWalletOrFail(walletId);

    const summary = await this.walletRepo.getTransactionSummary(walletId);

    return {
      totalCredits: fromMinorUnits(summary.totalCredits),
      totalDebits: fromMinorUnits(summary.totalDebits),
      totalTransactions: summary.totalTransactions,
    };
  }
}
