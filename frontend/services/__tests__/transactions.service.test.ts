/**
 * Tests for Transactions Service
 */

import { transactionsService } from '../transactions.service';
import * as apiClient from '@/lib/apiClient';
import * as storage from '@/lib/storage';
import { TransactionType } from '@/lib/enums';

// Mock dependencies
jest.mock('@/lib/apiClient');
jest.mock('@/lib/storage');

const mockApiGet = apiClient.apiGet as jest.MockedFunction<typeof apiClient.apiGet>;
const mockGetWalletId = storage.getWalletId as jest.MockedFunction<typeof storage.getWalletId>;

describe('TransactionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should fetch transactions with basic params', async () => {
      const mockResponse = {
        items: [
          {
            id: 'tx-1',
            walletId: 'wallet-123',
            amount: 100,
            balance: 100,
            description: 'Deposit',
            date: new Date('2024-01-15'),
            type: 'CREDIT' as const,
          },
        ],
        total: 1,
      };

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await transactionsService.getTransactions({
        walletId: 'wallet-123',
      });

      expect(mockApiGet).toHaveBeenCalledWith('/transactions?walletId=wallet-123');
      expect(result).toEqual(mockResponse);
    });

    it('should include pagination parameters', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.getTransactions({
        walletId: 'wallet-123',
        skip: 10,
        limit: 25,
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        '/transactions?walletId=wallet-123&skip=10&limit=25'
      );
    });

    it('should include sorting parameters', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.getTransactions({
        walletId: 'wallet-123',
        sortBy: 'date',
        sortOrder: 'desc',
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        '/transactions?walletId=wallet-123&sortBy=date&sortOrder=desc'
      );
    });

    it('should include search parameter', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.getTransactions({
        walletId: 'wallet-123',
        search: 'deposit',
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        '/transactions?walletId=wallet-123&search=deposit'
      );
    });

    it('should include all parameters', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.getTransactions({
        walletId: 'wallet-123',
        skip: 0,
        limit: 10,
        sortBy: 'amount',
        sortOrder: 'asc',
        search: 'test',
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        '/transactions?walletId=wallet-123&skip=0&limit=10&sortBy=amount&sortOrder=asc&search=test'
      );
    });

    it('should handle empty results', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      const result = await transactionsService.getTransactions({
        walletId: 'wallet-123',
      });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle API errors', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      await expect(
        transactionsService.getTransactions({ walletId: 'wallet-123' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('fetchTransactionsPage', () => {
    beforeEach(() => {
      mockGetWalletId.mockReturnValue('wallet-123');
    });

    it('should return empty result when no wallet ID', async () => {
      mockGetWalletId.mockReturnValue(null);

      const result = await transactionsService.fetchTransactionsPage({
        query: {
          paging: { pageIndex: 1, pageSize: 10 },
        },
      });

      expect(result).toEqual({ rows: [], totalRows: 0 });
      expect(mockApiGet).not.toHaveBeenCalled();
    });

    it('should fetch page with pagination', async () => {
      const mockResponse = {
        items: [
          {
            id: 'tx-1',
            walletId: 'wallet-123',
            amount: 50,
            balance: 50,
            description: 'Test',
            date: new Date(),
            type: 'CREDIT' as const,
          },
        ],
        total: 100,
      };

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await transactionsService.fetchTransactionsPage({
        query: {
          paging: { pageIndex: 2, pageSize: 25 },
        },
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('skip=25&limit=25'),
        expect.any(Object)
      );
      expect(result.rows).toHaveLength(1);
      expect(result.totalRows).toBe(100);
    });

    it('should include sort parameters', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.fetchTransactionsPage({
        query: {
          paging: { pageIndex: 1, pageSize: 10 },
          sort: { field: 'date', order: 'desc' },
        },
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=date&sortOrder=desc'),
        expect.any(Object)
      );
    });

    it('should include search query', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.fetchTransactionsPage({
        query: {
          paging: { pageIndex: 1, pageSize: 10 },
          search: { query: 'deposit' },
        },
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('search=deposit'),
        expect.any(Object)
      );
    });

    it('should include filter by transaction type', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.fetchTransactionsPage({
        query: {
          paging: { pageIndex: 1, pageSize: 10 },
          filters: { type: 'CREDIT' },
        },
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('type=CREDIT'),
        expect.any(Object)
      );
    });

    it('should include date range filters', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');

      await transactionsService.fetchTransactionsPage({
        query: {
          paging: { pageIndex: 1, pageSize: 10 },
          filters: {
            dateRange: { from: fromDate, to: toDate },
          },
        },
      });

      const call = mockApiGet.mock.calls[0][0];
      expect(call).toContain('fromDate=');
      expect(call).toContain('toDate=');
    });

    it('should handle date range as string', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.fetchTransactionsPage({
        query: {
          paging: { pageIndex: 1, pageSize: 10 },
          filters: {
            dateRange: {
              from: '2024-01-01',
              to: '2024-01-31',
            },
          },
        },
      });

      const call = mockApiGet.mock.calls[0][0];
      expect(call).toContain('fromDate=');
      expect(call).toContain('toDate=');
    });

    it('should pass abort signal', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      const abortController = new AbortController();

      await transactionsService.fetchTransactionsPage({
        query: {
          paging: { pageIndex: 1, pageSize: 10 },
        },
        signal: abortController.signal,
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.any(String),
        { signal: abortController.signal }
      );
    });

    it('should calculate correct skip for different page indices', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      // Page 1, pageSize 10 -> skip 0
      await transactionsService.fetchTransactionsPage({
        query: { paging: { pageIndex: 1, pageSize: 10 } },
      });
      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('skip=0'),
        expect.any(Object)
      );

      // Page 3, pageSize 25 -> skip 50
      await transactionsService.fetchTransactionsPage({
        query: { paging: { pageIndex: 3, pageSize: 25 } },
      });
      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('skip=50'),
        expect.any(Object)
      );
    });
  });

  // Note: Export functionality has been moved to export.service.ts
  // See export.service.test.ts for export tests

  describe('Query String Building', () => {
    it('should build correct query strings with multiple parameters', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.getTransactions({
        walletId: 'wallet-123',
        skip: 0,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc',
        search: 'test query',
      });

      const expectedUrl = '/transactions?walletId=wallet-123&skip=0&limit=10&sortBy=date&sortOrder=desc&search=test+query';
      expect(mockApiGet).toHaveBeenCalledWith(expectedUrl);
    });

    it('should handle special characters in search', async () => {
      mockApiGet.mockResolvedValue({ items: [], total: 0 });

      await transactionsService.getTransactions({
        walletId: 'wallet-123',
        search: 'test & special',
      });

      const call = mockApiGet.mock.calls[0][0];
      expect(call).toContain('search=');
    });
  });
});
