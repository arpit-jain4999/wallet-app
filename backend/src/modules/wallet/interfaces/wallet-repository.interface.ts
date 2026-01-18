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
   */
  updateBalanceAtomic(
    walletId: string,
    amountMinorUnits: number,
    condition?: { balanceMinorUnits: { $gte: number } },
  ): Promise<WalletDocument | null>;
}
