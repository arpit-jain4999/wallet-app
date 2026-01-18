import { apiGet, apiPost } from '@/lib/apiClient';
import { Wallet, CreateWalletRequest } from '@/types/wallet';
import { TransactionRequest } from '@/types/transaction';

/**
 * Response from wallet setup endpoint
 */
export interface SetupWalletResponse {
  id: string;
  balance: number;
  name: string;
  date: string | Date;
  transactionId?: string;
}

/**
 * Response from transaction endpoint
 */
export interface TransactionResponse {
  balance: number;
  transactionId: string;
}

/**
 * Response from wallet summary endpoint
 */
export interface WalletSummaryResponse {
  totalCredits: number;
  totalDebits: number;
  totalTransactions: number;
}

/**
 * Wallet Service
 * 
 * Provides API integration for wallet operations.
 * Handles HTTP requests to backend wallet endpoints with automatic error handling.
 */
export const walletService = {
  /**
   * Create a new wallet with optional initial balance
   * 
   * @param {CreateWalletRequest} data - Wallet creation data
   * @param {string} data.name - Wallet owner name (required)
   * @param {number} [data.balance] - Initial balance (optional, defaults to 0)
   * @returns {Promise<SetupWalletResponse>} Created wallet response with ID and balance
   * @throws {ApiException} If wallet creation fails (validation error, server error)
   * 
   * @example
   * ```ts
   * const wallet = await walletService.setupWallet({
   *   name: 'John Doe',
   *   balance: 100.50
   * });
   * console.log(wallet.id); // Wallet ID
   * ```
   */
  async setupWallet(data: CreateWalletRequest): Promise<SetupWalletResponse> {
    return apiPost<SetupWalletResponse>('/setup', data);
  },

  /**
   * Get wallet details by ID
   * 
   * @param {string} walletId - Wallet ID to retrieve
   * @returns {Promise<Wallet>} Wallet data (id, name, balance, date)
   * @throws {ApiException} If wallet not found (404) or server error
   * 
   * @example
   * ```ts
   * const wallet = await walletService.getWallet('wallet-id-123');
   * console.log(wallet.balance); // Current balance
   * ```
   */
  async getWallet(walletId: string): Promise<Wallet> {
    return apiGet<Wallet>(`/wallet/${walletId}`);
  },

  /**
   * Execute a credit or debit transaction
   * 
   * @param {string} walletId - Wallet ID to transact on
   * @param {TransactionRequest} data - Transaction data
   * @param {number} data.amount - Transaction amount (positive for CREDIT, negative for DEBIT)
   * @param {'CREDIT' | 'DEBIT'} data.type - Transaction type
   * @param {string} [data.description] - Optional transaction description
   * @returns {Promise<TransactionResponse>} Transaction response with updated balance
   * @throws {ApiException} If transaction fails (insufficient funds, validation error, wallet not found)
   * 
   * @example
   * ```ts
   * const result = await walletService.transact('wallet-id-123', {
   *   amount: 50.25,
   *   type: 'CREDIT',
   *   description: 'Payment received'
   * });
   * console.log(result.balance); // New balance after transaction
   * ```
   */
  async transact(
    walletId: string,
    data: TransactionRequest,
  ): Promise<TransactionResponse> {
    return apiPost<TransactionResponse>(`/transact/${walletId}`, data);
  },

  /**
   * Get wallet transaction summary (totals)
   * 
   * Returns aggregated statistics: total credits, total debits, and total transaction count.
   * 
   * @param {string} walletId - Wallet ID to get summary for
   * @returns {Promise<WalletSummaryResponse>} Summary with total credits, debits, and transaction count
   * @throws {ApiException} If wallet not found (404) or server error
   * 
   * @example
   * ```ts
   * const summary = await walletService.getSummary('wallet-id-123');
   * console.log(summary.totalCredits); // Total credits
   * console.log(summary.totalDebits);  // Total debits
   * console.log(summary.totalTransactions); // Total transaction count
   * ```
   */
  async getSummary(walletId: string): Promise<WalletSummaryResponse> {
    return apiGet<WalletSummaryResponse>(`/wallet/${walletId}/summary`);
  },
};

