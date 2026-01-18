import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import { v4 as uuidv4 } from 'uuid';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TransactionType } from '@/common/enums';

/**
 * Wallet Service
 * Handles wallet-related business logic
 */
@Injectable()
export class WalletService {
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
   * Setup a new wallet with initial balance
   */
  async setupWallet(name: string, balance?: number) {
    this.logger.log(`Setting up wallet for: ${name}`, 'WalletService');
    const initialBalance = balance || 0;
    
    // Validate initial balance (only if provided and non-zero)
    if (initialBalance > 0) {
      this.validateTransactionAmount(initialBalance);
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

  /**
   * Get wallet details by ID
   */
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
}
