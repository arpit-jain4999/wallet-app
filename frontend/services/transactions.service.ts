import { apiGet, apiGetBlob } from '@/lib/apiClient';
import { Transaction } from '@/types/transaction';
import {
  GridQuery,
  GridResult,
} from '@/components/ui/data-grid/types';
import { getWalletId } from '@/lib/storage';

/**
 * Parameters for getting transactions
 */
export interface GetTransactionsParams {
  walletId: string;
  skip?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Response from get transactions endpoint
 */
export interface GetTransactionsResponse {
  items: Transaction[];
  total: number;
}

/**
 * Transactions Service
 * 
 * Provides API integration for transaction operations.
 * Handles HTTP requests to backend transaction endpoints with pagination, sorting, and filtering.
 */
export const transactionsService = {
  /**
   * Get transactions with pagination and filtering
   * 
   * @param {GetTransactionsParams} params - Query parameters
   * @param {string} params.walletId - Wallet ID (required)
   * @param {number} [params.skip] - Number of records to skip (default: 0)
   * @param {number} [params.limit] - Number of records to return (default: 25)
   * @param {string} [params.sortBy] - Field to sort by ('date', 'amount')
   * @param {'asc' | 'desc'} [params.sortOrder] - Sort order (default: 'desc')
   * @param {string} [params.search] - Search query (searches in description)
   * @returns {Promise<GetTransactionsResponse>} Transactions list with total count
   * @throws {ApiException} If request fails (wallet not found, server error)
   * 
   * @example
   * ```ts
   * const result = await transactionsService.getTransactions({
   *   walletId: 'wallet-id-123',
   *   skip: 0,
   *   limit: 25,
   *   sortBy: 'date',
   *   sortOrder: 'desc'
   * });
   * console.log(result.items); // Array of transactions
   * console.log(result.total); // Total count
   * ```
   */
  async getTransactions(
    params: GetTransactionsParams,
  ): Promise<GetTransactionsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.set('walletId', params.walletId);
    if (params.skip !== undefined) {
      queryParams.set('skip', params.skip.toString());
    }
    if (params.limit !== undefined) {
      queryParams.set('limit', params.limit.toString());
    }
    if (params.sortBy) {
      queryParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.set('sortOrder', params.sortOrder);
    }
    if (params.search) {
      queryParams.set('search', params.search);
    }

    return apiGet<GetTransactionsResponse>(`/transactions?${queryParams.toString()}`);
  },

  /**
   * Fetch transactions page for DataGrid component
   * 
   * Converts DataGrid query format to API query parameters.
   * Automatically retrieves wallet ID from localStorage.
   * 
   * @template T - Type of transaction (defaults to Transaction)
   * @param {Object} params - Fetch page parameters
   * @param {GridQuery<T>} params.query - DataGrid query (paging, sort, search, filters)
   * @param {string[]} [params.searchableFields] - Fields to search in (unused, for interface compatibility)
   * @param {AbortSignal} [params.signal] - Abort signal for request cancellation
   * @returns {Promise<GridResult<Transaction>>} Grid result with rows and total count
   * 
   * @example
   * ```ts
   * const result = await transactionsService.fetchTransactionsPage({
   *   query: {
   *     paging: { pageIndex: 1, pageSize: 25 },
   *     sort: { field: 'date', order: 'desc' },
   *     search: { query: 'payment' }
   *   },
   *   signal: abortController.signal
   * });
   * ```
   */
  async fetchTransactionsPage<T = Transaction>(params: {
    query: GridQuery<T>;
    searchableFields?: string[];
    signal?: AbortSignal;
  }): Promise<GridResult<Transaction>> {
    const walletId = getWalletId();
    if (!walletId) {
      return { rows: [], totalRows: 0 };
    }

    const { query, signal } = params;
    const skip = (query.paging.pageIndex - 1) * query.paging.pageSize;
    const limit = query.paging.pageSize;

    const queryParams = new URLSearchParams();
    queryParams.set('walletId', walletId);
    queryParams.set('skip', skip.toString());
    queryParams.set('limit', limit.toString());

    if (query.sort) {
      queryParams.set('sortBy', query.sort.field as string);
      queryParams.set('sortOrder', query.sort.order);
    }

    if (query.search?.query) {
      queryParams.set('search', query.search.query);
    }

    if (query.filters?.type) {
      queryParams.set('type', query.filters.type);
    }

    if (query.filters?.dateRange?.from) {
      const fromDate = typeof query.filters.dateRange.from === 'string'
        ? new Date(query.filters.dateRange.from)
        : query.filters.dateRange.from;
      queryParams.set('fromDate', fromDate.toISOString());
    }

    if (query.filters?.dateRange?.to) {
      const toDate = typeof query.filters.dateRange.to === 'string'
        ? new Date(query.filters.dateRange.to)
        : query.filters.dateRange.to;
      queryParams.set('toDate', toDate.toISOString());
    }

    const response = await apiGet<GetTransactionsResponse>(
      `/transactions?${queryParams.toString()}`,
      { signal }
    );

    return {
      rows: response.items,
      totalRows: response.total,
    };
  },

  /**
   * Export transactions as CSV (synchronous only)
   * 
   * For large datasets, use export.service.ts which handles async exports with progress tracking.
   * This method is for backwards compatibility or small exports.
   * 
   * @param {string} walletId - Wallet ID to export transactions for
   * @returns {Promise<Blob>} CSV file blob
   * @throws {ApiException} If export fails or wallet not found
   * 
   * @example
   * ```ts
   * const blob = await transactionsService.exportTransactions('wallet-id-123');
   * const url = URL.createObjectURL(blob);
   * const a = document.createElement('a');
   * a.href = url;
   * a.download = 'transactions.csv';
   * a.click();
   * ```
   */
  async exportTransactions(walletId: string): Promise<Blob> {
    return apiGetBlob(`/transactions/export?walletId=${walletId}`);
  },
};
