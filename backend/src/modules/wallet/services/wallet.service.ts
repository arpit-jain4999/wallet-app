import {
  Injectable,
  NotFoundException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { IWalletRepository } from '../interfaces/wallet-repository.interface';
import {
  toMinorUnits,
  fromMinorUnits,
} from '../../../common/utils/money.util';
import { TransactionAmountValidator } from '../../../common/utils/transaction-amount.validator';
import { TransactionService } from './transaction.service';
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
    private readonly transactionService: TransactionService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}


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
   * Setup a new wallet with optional initial balance
   * 
   * Creates a new wallet with a unique UUID v4 wallet ID.
   * If initial balance is provided and > 0, creates an initial CREDIT transaction.
   * 
   * @param {string} name - Wallet owner name (required)
   * @param {number} [balance] - Initial balance (optional, defaults to 0)
   * @returns {Promise<Object>} Created wallet data
   * @returns {string} id - Wallet ID (UUID v4)
   * @returns {number} balance - Initial balance
   * @returns {string} name - Wallet owner name
   * @returns {Date} date - Creation date
   * @returns {string} [transactionId] - Initial transaction ID (if balance > 0)
   * @throws {BadRequestException} If initial balance is invalid (negative, > 4 decimal places)
   * 
   * @example
   * ```ts
   * const wallet = await walletService.setupWallet('John Doe', 100.50);
   * console.log(wallet.id); // UUID v4
   * console.log(wallet.balance); // 100.50
   * ```
   */
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

  /**
   * Get wallet details by wallet ID
   * 
   * Retrieves wallet information including current balance.
   * Converts balance from minor units to major units for API response.
   * 
   * @param {string} walletId - Wallet ID to retrieve (UUID v4)
   * @returns {Promise<Object>} Wallet data
   * @returns {string} id - Wallet ID
   * @returns {number} balance - Current balance (converted from minor units)
   * @returns {string} name - Wallet owner name
   * @returns {Date} date - Last update date
   * @throws {NotFoundException} If wallet not found
   * 
   * @example
   * ```ts
   * const wallet = await walletService.getWallet('wallet-id-uuid');
   * console.log(wallet.balance); // Current balance
   * ```
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
