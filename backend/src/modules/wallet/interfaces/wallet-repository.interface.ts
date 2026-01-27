import { ClientSession } from 'mongoose';
import { WalletDocument } from '../schemas/wallet.schema';

/**
 * Wallet Repository Interface
 * Defines contract for wallet data access operations
 */
export interface IWalletRepository {
  /**
   * Create a new wallet
   */
  createWallet(
    name: string,
    balanceMinorUnits: number,
    walletId: string,
    session?: ClientSession,
  ): Promise<WalletDocument>;

  /**
   * Find wallet by wallet ID
   */
  findWalletById(walletId: string): Promise<WalletDocument | null>;

  /**
   * Find wallet by MongoDB _id
   */
  findWalletByMongoId(id: string): Promise<WalletDocument | null>;

  /**
   * Update wallet balance atomically
   * @param condition - Optional condition for atomic update (e.g., check sufficient funds)
   * @param session - Optional MongoDB session for transactions
   */
  updateBalanceAtomic(
    walletId: string,
    amountMinorUnits: number,
    condition?: { balanceMinorUnits: { $gte: number } },
    session?: ClientSession,
  ): Promise<WalletDocument | null>;
}
