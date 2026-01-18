/**
 * Tests for useWallet hook
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from '../useWallet';
import { walletService } from '@/services/wallet.service';
import * as storage from '@/lib/storage';
import { toast } from 'sonner';

jest.mock('@/services/wallet.service');
jest.mock('@/lib/storage');
jest.mock('sonner');

// Mock lib/errors module before importing
jest.mock('@/lib/errors', () => {
  class MockApiException extends Error {
    constructor(message: string, public statusCode: number) {
      super(message);
      this.name = 'ApiException';
    }
  }
  class MockNetworkError extends Error {}
  class MockValidationError extends Error {}
  
  return {
    ApiException: MockApiException,
    NetworkError: MockNetworkError,
    ValidationError: MockValidationError,
  };
});

describe('useWallet Hook', () => {
  const mockWallet = {
    id: 'wallet-123',
    name: 'Test Wallet',
    balance: 100.50,
    date: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.getWalletId as jest.Mock).mockReturnValue(null);
  });

  it('should initialize with no wallet', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.wallet).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should load wallet from localStorage on mount', async () => {
    (storage.getWalletId as jest.Mock).mockReturnValue('wallet-123');
    (walletService.getWallet as jest.Mock).mockResolvedValue(mockWallet);

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.wallet).toEqual(mockWallet);
      expect(result.current.loading).toBe(false);
    });

    expect(walletService.getWallet).toHaveBeenCalledWith('wallet-123');
  });

  it('should create wallet successfully', async () => {
    const setupResponse = {
      id: 'wallet-123',
      name: 'New Wallet',
      balance: 50,
      date: new Date(),
    };

    (walletService.setupWallet as jest.Mock).mockResolvedValue(setupResponse);
    (storage.setWalletId as jest.Mock).mockImplementation();

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.createWallet({ name: 'New Wallet', balance: 50 });
    });

    expect(walletService.setupWallet).toHaveBeenCalledWith({
      name: 'New Wallet',
      balance: 50,
    });
    expect(storage.setWalletId).toHaveBeenCalledWith('wallet-123');
    expect(result.current.wallet).toMatchObject({
      id: 'wallet-123',
      name: 'New Wallet',
      balance: 50,
    });
    expect(toast.success).toHaveBeenCalledWith('Wallet created successfully');
  });

  it('should execute transaction successfully', async () => {
    (storage.getWalletId as jest.Mock).mockReturnValue('wallet-123');
    (walletService.getWallet as jest.Mock).mockResolvedValue(mockWallet);
    (walletService.transact as jest.Mock).mockResolvedValue({
      balance: 120.50,
      transactionId: 'tx-123',
    });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.wallet).toBeTruthy();
    });

    await act(async () => {
      await result.current.executeTransaction({
        amount: 20,
        description: 'Test transaction',
      });
    });

    expect(walletService.transact).toHaveBeenCalledWith('wallet-123', {
      amount: 20,
      description: 'Test transaction',
    });
    expect(result.current.wallet?.balance).toBe(120.50);
    expect(toast.success).toHaveBeenCalledWith('Transaction completed successfully');
  });

  it('should handle create wallet error', async () => {
    const error = new Error('Failed to create');
    (walletService.setupWallet as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useWallet());

    let caughtError: any;
    await act(async () => {
      try {
        await result.current.createWallet({ name: 'Test', balance: 50 });
      } catch (e) {
        caughtError = e;
      }
    });

    // Error was caught and rethrown
    expect(caughtError).toBeDefined();
    // Service was called
    expect(walletService.setupWallet).toHaveBeenCalledWith({ name: 'Test', balance: 50 });
  });

  it('should reset wallet', async () => {
    (storage.getWalletId as jest.Mock).mockReturnValue('wallet-123');
    (walletService.getWallet as jest.Mock).mockResolvedValue(mockWallet);
    (storage.clearWalletId as jest.Mock).mockImplementation();

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.wallet).toBeTruthy();
    });

    act(() => {
      result.current.resetWallet();
    });

    expect(storage.clearWalletId).toHaveBeenCalled();
    expect(result.current.wallet).toBeNull();
  });
});
