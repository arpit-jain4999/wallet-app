'use client';

import { useState, useEffect, useCallback } from 'react';
import { transactionsService } from '@/services/transactions.service';
import { Transaction } from '@/types/transaction';
import { getWalletId } from '@/lib/storage';
import { ApiError } from '@/lib/apiClient';
import { toast } from 'sonner';

export interface UseTransactionsOptions {
  pageSize?: number;
}

export function useWalletTransactions(options: UseTransactionsOptions = {}) {
  const { pageSize: initialPageSize = 10 } = options;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState<string>('');

  const walletId = getWalletId();

  const loadTransactions = useCallback(async () => {
    if (!walletId) {
      setTransactions([]);
      // Small delay to show loader briefly before showing "no wallet" message
      setTimeout(() => {
        setInitializing(false);
      }, 100);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await transactionsService.getTransactions({
        walletId,
        skip,
        limit: pageSize,
        sortBy,
        sortOrder,
        search: search.trim() || undefined,
      });
      setTransactions(response.items);
      setTotal(response.total);
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to load transactions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  }, [walletId, skip, pageSize, sortBy, sortOrder, search]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const goToPage = useCallback((page: number) => {
    setSkip((page - 1) * pageSize);
  }, [pageSize]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setSkip(0); // Reset to first page when changing page size
  }, []);

  const changeSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setSkip(0);
  }, [sortBy, sortOrder]);

  const setSearchQuery = useCallback((query: string) => {
    setSearch(query);
    setSkip(0); // Reset to first page when searching
  }, []);

  const exportCSV = useCallback(async () => {
    if (!walletId) {
      toast.error('No wallet selected');
      return;
    }

    try {
      const blob = await transactionsService.exportTransactions(walletId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${walletId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Transactions exported successfully');
    } catch (err) {
      const errorMessage =
        err instanceof ApiError
          ? err.message
          : 'Failed to export transactions';
      toast.error(errorMessage);
    }
  }, [walletId]);

  return {
    transactions,
    loading: loading || initializing,
    initializing,
    error,
    skip,
    total,
    pageSize,
    sortBy,
    sortOrder,
    search,
    goToPage,
    changePageSize,
    changeSort,
    setSearchQuery,
    exportCSV,
    refresh: loadTransactions,
  };
}

