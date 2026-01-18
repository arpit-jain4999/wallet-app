/**
 * Tests for Wallet Service
 */

import { walletService } from '../wallet.service';
import * as apiClient from '@/lib/apiClient';

// Mock the API client
jest.mock('@/lib/apiClient');

const mockApiGet = apiClient.apiGet as jest.MockedFunction<typeof apiClient.apiGet>;
const mockApiPost = apiClient.apiPost as jest.MockedFunction<typeof apiClient.apiPost>;

describe('WalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupWallet', () => {
    it('should create a new wallet with name and balance', async () => {
      const mockResponse = {
        id: 'wallet-123',
        balance: 100,
        name: 'Test Wallet',
        date: '2024-01-15T10:00:00Z',
        transactionId: 'tx-123',
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await walletService.setupWallet({
        name: 'Test Wallet',
        balance: 100,
      });

      expect(mockApiPost).toHaveBeenCalledWith('/setup', {
        name: 'Test Wallet',
        balance: 100,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create a wallet with just name (no balance)', async () => {
      const mockResponse = {
        id: 'wallet-456',
        balance: 0,
        name: 'Empty Wallet',
        date: '2024-01-15T10:00:00Z',
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await walletService.setupWallet({
        name: 'Empty Wallet',
      });

      expect(mockApiPost).toHaveBeenCalledWith('/setup', {
        name: 'Empty Wallet',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      mockApiPost.mockRejectedValue(error);

      await expect(
        walletService.setupWallet({ name: 'Test' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('getWallet', () => {
    it('should fetch wallet by ID', async () => {
      const mockWallet = {
        id: 'wallet-123',
        balance: 250.50,
        name: 'My Wallet',
        date: new Date('2024-01-15'),
      };

      mockApiGet.mockResolvedValue(mockWallet);

      const result = await walletService.getWallet('wallet-123');

      expect(mockApiGet).toHaveBeenCalledWith('/wallet/wallet-123');
      expect(result).toEqual(mockWallet);
    });

    it('should handle wallet not found error', async () => {
      const error = new Error('Wallet not found');
      mockApiGet.mockRejectedValue(error);

      await expect(
        walletService.getWallet('non-existent')
      ).rejects.toThrow('Wallet not found');
    });
  });

  describe('transact', () => {
    it('should perform a credit transaction', async () => {
      const mockResponse = {
        balance: 150,
        transactionId: 'tx-456',
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await walletService.transact('wallet-123', {
        amount: 50,
        description: 'Deposit',
      });

      expect(mockApiPost).toHaveBeenCalledWith('/transact/wallet-123', {
        amount: 50,
        description: 'Deposit',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should perform a debit transaction', async () => {
      const mockResponse = {
        balance: 50,
        transactionId: 'tx-789',
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await walletService.transact('wallet-123', {
        amount: -50,
        description: 'Withdrawal',
      });

      expect(mockApiPost).toHaveBeenCalledWith('/transact/wallet-123', {
        amount: -50,
        description: 'Withdrawal',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle transaction without description', async () => {
      const mockResponse = {
        balance: 200,
        transactionId: 'tx-101',
      };

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await walletService.transact('wallet-123', {
        amount: 100,
      });

      expect(mockApiPost).toHaveBeenCalledWith('/transact/wallet-123', {
        amount: 100,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle insufficient balance error', async () => {
      const error = new Error('Insufficient balance');
      mockApiPost.mockRejectedValue(error);

      await expect(
        walletService.transact('wallet-123', { amount: -1000 })
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('getSummary', () => {
    it('should fetch wallet summary', async () => {
      const mockSummary = {
        totalCredits: 500,
        totalDebits: 300,
        totalTransactions: 25,
      };

      mockApiGet.mockResolvedValue(mockSummary);

      const result = await walletService.getSummary('wallet-123');

      expect(mockApiGet).toHaveBeenCalledWith('/wallet/wallet-123/summary');
      expect(result).toEqual(mockSummary);
    });

    it('should handle summary fetch error', async () => {
      const error = new Error('Failed to fetch summary');
      mockApiGet.mockRejectedValue(error);

      await expect(
        walletService.getSummary('wallet-123')
      ).rejects.toThrow('Failed to fetch summary');
    });

    it('should handle zero transactions', async () => {
      const mockSummary = {
        totalCredits: 0,
        totalDebits: 0,
        totalTransactions: 0,
      };

      mockApiGet.mockResolvedValue(mockSummary);

      const result = await walletService.getSummary('wallet-new');

      expect(result).toEqual(mockSummary);
      expect(result.totalTransactions).toBe(0);
    });
  });

  describe('API Integration', () => {
    it('should pass through API client configurations', async () => {
      mockApiGet.mockResolvedValue({ id: 'test', balance: 0, name: 'Test', date: new Date() });

      await walletService.getWallet('test');

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('/wallet/test');
    });

    it('should handle multiple concurrent requests', async () => {
      mockApiGet.mockResolvedValue({ id: 'test', balance: 0, name: 'Test', date: new Date() });

      const promises = [
        walletService.getWallet('wallet-1'),
        walletService.getWallet('wallet-2'),
        walletService.getWallet('wallet-3'),
      ];

      await Promise.all(promises);

      expect(mockApiGet).toHaveBeenCalledTimes(3);
    });
  });
});
