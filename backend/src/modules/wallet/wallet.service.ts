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
} from '../../common/utils/money.util';
import { TransactionAmountValidator } from '../../common/utils/transaction-amount.validator';
import { TransactionService } from './services/transaction.service';
import { v4 as uuidv4 } from 'uuid';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TransactionType } from '@/common/enums';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly transactionService: TransactionService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async setupWallet(name: string, balance?: number) {
    this.logger.log(`Setting up wallet for: ${name}`, 'WalletService');
    const initialBalance = balance || 0;
    
    // Validate initial balance (only if provided and non-zero)
    if (initialBalance > 0) {
      TransactionAmountValidator.validate(initialBalance);
    }

    const balanceMinorUnits = toMinorUnits(initialBalance);
    const walletId = uuidv4();

    const wallet = await this.walletRepo.createWallet(
      name,
      balanceMinorUnits,
      walletId,
    );

    this.logger.log(`Wallet created successfully: ${walletId}`, 'WalletService');

    // Create initial transaction if balance > 0
    // Use TransactionService to avoid code duplication
    let transactionId: string | undefined;
    if (balanceMinorUnits > 0) {
      const result = await this.transactionService.createTransactionRecord(
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
   * Processes a debit transaction with atomic balance update
   * Uses atomic update with condition to check wallet existence and sufficient funds in one operation
   * @private
   */
  private async processDebitTransaction(
    walletId: string,
    amountMinorUnits: number,
    description?: string,
  ): Promise<{ balance: number; transactionId: string }> {
    // Atomic update with condition - checks wallet exists AND sufficient funds in one operation
    // The condition { balanceMinorUnits: { $gte: amountMinorUnits } } ensures:
    // 1. Wallet exists (query matches)
    // 2. Sufficient funds (condition matches)
    const updatedWallet = await this.walletRepo.updateBalanceAtomic(
      walletId,
      -amountMinorUnits,
      { balanceMinorUnits: { $gte: amountMinorUnits } },
    );

    if (!updatedWallet) {
      this.logger.warn(
        `Transaction failed: walletId=${walletId}, amount=${amountMinorUnits} (insufficient funds or wallet not found)`,
        'WalletService',
      );
      throw new ConflictException('Insufficient funds or wallet not found');
    }

    return this.transactionService.createTransactionRecord(
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

    return this.transactionService.createTransactionRecord(
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
