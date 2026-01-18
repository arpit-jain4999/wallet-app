'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { walletService } from '@/services/wallet.service';
import { Wallet, CreateWalletRequest } from '@/types/wallet';
import { TransactionRequest } from '@/types/transaction';
import { getWalletId, setWalletId, clearWalletId } from '@/lib/storage';
import { ApiError } from '@/lib/apiClient';
import { toast } from 'sonner';

/**
 * Custom hook for managing wallet state and operations
 * 
 * Provides wallet CRUD operations, transaction execution with optimistic updates,
 * and automatic wallet loading from localStorage on mount.
 * 
 * Features:
 * - Automatic wallet loading from localStorage on mount
 * - Optimistic UI updates for transactions with automatic rollback on error
 * - Toast notifications for user feedback
 * - Error handling with automatic localStorage cleanup for invalid wallets
 * 
 * @returns {Object} Wallet hook return value
 * @returns {Wallet | null} wallet - Current wallet data or null if not loaded
 * @returns {boolean} loading - True if wallet operation is in progress or initializing
 * @returns {string | null} error - Error message if operation failed, null otherwise
 * @returns {Function} createWallet - Create a new wallet
 * @returns {Function} executeTransaction - Execute a credit/debit transaction
 * @returns {Function} resetWallet - Clear wallet and remove from localStorage
 * @returns {Function} loadWallet - Manually load a wallet by ID
 * 
 * @example
 * ```tsx
 * const { wallet, loading, createWallet, executeTransaction } = useWallet();
 * 
 * // Create wallet
 * await createWallet({ name: 'John Doe', balance: 100 });
 * 
 * // Execute transaction
 * await executeTransaction({ amount: 50, type: 'CREDIT', description: 'Payment' });
 * ```
 */
export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  /**
   * Load wallet by ID from API
   * @param {string} walletId - Wallet ID to load
   * @private
   */
  const loadWallet = useCallback(async (walletId: string) => {
    // Prevent duplicate concurrent calls
    if (loadingRef.current) {
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await walletService.getWallet(walletId);
      setWallet(data);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load wallet';
      setError(errorMessage);
      // If wallet not found, clear localStorage
      if (err instanceof ApiError && err.statusCode === 404) {
        clearWalletId();
      }
    } finally {
      setLoading(false);
      setInitializing(false);
      loadingRef.current = false;
    }
  }, []);

  // Load wallet on mount if walletId exists
  useEffect(() => {
    const walletId = getWalletId();
    if (walletId) {
      loadWallet(walletId);
    } else {
      // No walletId in localStorage, we're done initializing
      setInitializing(false);
    }
  }, [loadWallet]);

  /**
   * Create a new wallet with optional initial balance
   * 
   * Automatically saves wallet ID to localStorage and updates wallet state.
   * Shows success/error toast notifications.
   * 
   * @param {CreateWalletRequest} data - Wallet creation data
   * @param {string} data.name - Wallet owner name (required)
   * @param {number} [data.balance] - Initial balance (optional, defaults to 0)
   * @returns {Promise<SetupWalletResponse>} Created wallet response
   * @throws {Error} If wallet creation fails
   * 
   * @example
   * ```tsx
   * await createWallet({ name: 'John Doe', balance: 100.50 });
   * ```
   */
  const createWallet = useCallback(
    async (data: CreateWalletRequest) => {
      setLoading(true);
      setError(null);
      try {
        const response = await walletService.setupWallet(data);
        setWalletId(response.id);
        setWallet({
          id: response.id,
          name: response.name,
          balance: response.balance,
          date: response.date,
        });
        toast.success('Wallet created successfully');
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : 'Failed to create wallet';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Execute a credit or debit transaction
   * 
   * Uses optimistic updates - UI updates immediately, then syncs with server.
   * Automatically rolls back on error. Shows success/error toast notifications.
   * 
   * @param {TransactionRequest} data - Transaction data
   * @param {number} data.amount - Transaction amount (positive for CREDIT, negative for DEBIT)
   * @param {'CREDIT' | 'DEBIT'} data.type - Transaction type
   * @param {string} [data.description] - Optional transaction description
   * @returns {Promise<TransactionResponse>} Transaction response with updated balance
   * @throws {Error} If no wallet is loaded
   * @throws {ApiError} If transaction fails (insufficient funds, validation error, etc.)
   * 
   * @example
   * ```tsx
   * await executeTransaction({
   *   amount: 50.25,
   *   type: 'CREDIT',
   *   description: 'Payment received'
   * });
   * ```
   */
  const executeTransaction = useCallback(
    async (data: TransactionRequest) => {
      if (!wallet) {
        throw new Error('No wallet loaded');
      }

      // Store previous balance for rollback
      const previousBalance = wallet.balance;
      
      // Optimistic update: Update UI immediately
      const optimisticBalance = previousBalance + data.amount;
      setWallet((prev) =>
        prev ? { ...prev, balance: optimisticBalance } : null,
      );

      setLoading(true);
      setError(null);
      try {
        const response = await walletService.transact(wallet.id, data);
        // Update with actual balance from server
        setWallet((prev) =>
          prev ? { ...prev, balance: response.balance } : null,
        );
        toast.success('Transaction completed successfully');
        return response;
      } catch (err) {
        // Rollback on error
        setWallet((prev) =>
          prev ? { ...prev, balance: previousBalance } : null,
        );
        
        const errorMessage =
          err instanceof ApiError
            ? err.message
            : 'Failed to execute transaction';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [wallet],
  );

  /**
   * Reset wallet state and clear localStorage
   * 
   * Removes wallet ID from localStorage and clears wallet state.
   * Use when user logs out or wants to switch wallets.
   * 
   * @example
   * ```tsx
   * resetWallet();
   * ```
   */
  const resetWallet = useCallback(() => {
    clearWalletId();
    setWallet(null);
    setError(null);
  }, []);

  return {
    wallet,
    loading: loading || initializing,
    error,
    createWallet,
    executeTransaction,
    resetWallet,
    loadWallet,
  };
}

