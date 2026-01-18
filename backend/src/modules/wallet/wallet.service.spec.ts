import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { WalletRepository } from './wallet.repo';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

describe('WalletService', () => {
  let service: WalletService;

  const mockRepository = {
    createWallet: jest.fn(),
    findWalletById: jest.fn(),
    updateBalanceAtomic: jest.fn(),
    createTransaction: jest.fn(),
    findTransactions: jest.fn(),
    findAllTransactions: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: WalletRepository,
          useValue: mockRepository,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupWallet', () => {
    it('should create a wallet and return walletId', async () => {
      const mockWallet = {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        name: 'Test Wallet',
        balanceMinorUnits: 100000, // 10.0000
        walletId: 'test-wallet-id',
        createdAt: new Date(),
      };

      mockRepository.createWallet.mockResolvedValue(mockWallet);
      mockRepository.createTransaction.mockResolvedValue({
        _id: { toString: () => 'tx-123' },
      });

      const result = await service.setupWallet('Test Wallet', 10);

      expect(result.id).toBeDefined(); // walletId is auto-generated
      expect(result.balance).toBe(10);
      expect(result.name).toBe('Test Wallet');
      expect(mockRepository.createWallet).toHaveBeenCalledWith(
        'Test Wallet',
        100000,
        expect.any(String),
      );
    });

    it('should create initial transaction if balance > 0', async () => {
      const mockWallet = {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        name: 'Test Wallet',
        balanceMinorUnits: 100000,
        walletId: 'test-wallet-id',
        createdAt: new Date(),
      };

      mockRepository.createWallet.mockResolvedValue(mockWallet);
      mockRepository.createTransaction.mockResolvedValue({
        _id: { toString: () => 'tx-123' },
      });

      await service.setupWallet('Test Wallet', 10);

      expect(mockRepository.createTransaction).toHaveBeenCalledWith(
        expect.any(String),
        100000,
        100000,
        'CREDIT',
        'Setup',
      );
    });
  });

  describe('getWallet', () => {
    it('should return wallet details', async () => {
      const mockWallet = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Wallet',
        balanceMinorUnits: 100000,
        walletId: 'test-wallet-id',
        updatedAt: new Date(),
      };

      mockRepository.findWalletById.mockResolvedValue(mockWallet);

      const result = await service.getWallet('test-wallet-id');

      expect(result.id).toBe('test-wallet-id');
      expect(result.balance).toBe(10);
      expect(result.name).toBe('Test Wallet');
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockRepository.findWalletById.mockResolvedValue(null);

      await expect(service.getWallet('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('transact', () => {
    const mockWallet = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Wallet',
      balanceMinorUnits: 100000, // 10.0000
      walletId: 'test-wallet-id',
    };

    it('should credit amount and increment balance', async () => {
      const updatedWallet = {
        ...mockWallet,
        balanceMinorUnits: 150000, // 15.0000
      };
      const mockTransaction = {
        _id: { toString: () => 'transaction-id' },
      };

      mockRepository.findWalletById.mockResolvedValue(mockWallet);
      mockRepository.updateBalanceAtomic.mockResolvedValue(updatedWallet);
      mockRepository.createTransaction.mockResolvedValue(mockTransaction);

      const result = await service.transact('test-wallet-id', 5, 'Credit');

      expect(result.balance).toBe(15);
      expect(result.transactionId).toBe('transaction-id');
      expect(mockRepository.updateBalanceAtomic).toHaveBeenCalledWith(
        'test-wallet-id',
        50000,
      );
      expect(mockRepository.createTransaction).toHaveBeenCalledWith(
        'test-wallet-id',
        50000,
        150000,
        'CREDIT',
        'Credit',
      );
    });

    it('should debit amount and decrement balance', async () => {
      const updatedWallet = {
        ...mockWallet,
        balanceMinorUnits: 50000, // 5.0000
      };
      const mockTransaction = {
        _id: 'transaction-id',
        toString: () => 'transaction-id',
      };

      mockRepository.findWalletById.mockResolvedValue(mockWallet);
      mockRepository.updateBalanceAtomic.mockResolvedValue(updatedWallet);
      mockRepository.createTransaction.mockResolvedValue(mockTransaction);

      const result = await service.transact('test-wallet-id', -5, 'Debit');

      expect(result.balance).toBe(5);
      expect(result.transactionId).toBe('transaction-id');
      expect(mockRepository.updateBalanceAtomic).toHaveBeenCalledWith(
        'test-wallet-id',
        -50000,
        { balanceMinorUnits: { $gte: 50000 } },
      );
    });

    it('should throw ConflictException on insufficient funds', async () => {
      mockRepository.findWalletById.mockResolvedValue(mockWallet);
      mockRepository.updateBalanceAtomic.mockResolvedValue(null);

      await expect(
        service.transact('test-wallet-id', -20, 'Debit'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockRepository.findWalletById.mockResolvedValue(null);

      await expect(service.transact('invalid-id', 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransactions', () => {
    it('should return transactions with pagination', async () => {
      const mockTransactions = [
        {
          _id: 'tx1',
          walletId: 'test-wallet-id',
          amountMinorUnits: 10000,
          balanceMinorUnits: 100000,
          type: 'CREDIT',
          date: new Date(),
          description: 'Test',
        },
      ];

      const mockWallet = {
        _id: '507f1f77bcf86cd799439011',
        walletId: 'test-wallet-id',
      };

      mockRepository.findWalletById.mockResolvedValue(mockWallet);
      mockRepository.findTransactions.mockResolvedValue({
        items: mockTransactions,
        total: 1,
      });

      const result = await service.getTransactions('test-wallet-id', 0, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].amount).toBe(1);
      expect(result.items[0].balance).toBe(10);
      expect(result.items[0].type).toBe('CREDIT');
      expect(result.total).toBe(1);
    });
  });
});
