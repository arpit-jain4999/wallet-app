'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { walletService } from '@/services/wallet.service';
import { getWalletId } from '@/lib/storage';
import { ApiError } from '@/lib/apiClient';

interface WalletSummaryData {
  totalCredits: number;
  totalDebits: number;
  totalTransactions: number;
}

export function useWalletSummary() {
  const [summary, setSummary] = useState<WalletSummaryData>({
    totalCredits: 0,
    totalDebits: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const loadingRef = useRef(false);

  // Get walletId once on mount and listen for changes
  useEffect(() => {
    const currentWalletId = getWalletId();
    setWalletId(currentWalletId);

    // Listen for wallet storage changes
    const handleWalletChange = () => {
      const newWalletId = getWalletId();
      setWalletId(newWalletId);
    };

    window.addEventListener('walletStorageChange', handleWalletChange);
    window.addEventListener('storage', handleWalletChange);

    return () => {
      window.removeEventListener('walletStorageChange', handleWalletChange);
      window.removeEventListener('storage', handleWalletChange);
    };
  }, []);

  const loadSummary = useCallback(async () => {
    if (!walletId) {
      setSummary({
        totalCredits: 0,
        totalDebits: 0,
        totalTransactions: 0,
      });
      return;
    }

    // Prevent duplicate concurrent calls
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      // Use dedicated summary endpoint for accurate totals
      const response = await walletService.getSummary(walletId);

      setSummary({
        totalCredits: response.totalCredits,
        totalDebits: response.totalDebits,
        totalTransactions: response.totalTransactions,
      });
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load summary';
      setError(errorMessage);
      // Don't show toast for summary errors, just log
      console.error('Failed to load wallet summary:', errorMessage);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [walletId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return {
    summary,
    loading,
    error,
    refresh: loadSummary,
  };
}

