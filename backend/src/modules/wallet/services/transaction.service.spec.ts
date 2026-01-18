import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { IWalletRepository } from '../interfaces/wallet-repository.interface';
import { ITransactionRepository } from '../interfaces/transaction-repository.interface';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TransactionType } from '../../../common/enums';
import { toMinorUnits, fromMinorUnits } from '../../../common/utils/money.util';

describe('TransactionService', () => {
  let service: TransactionService;
  let walletRepo: jest.Mocked<IWalletRepository>;
  let transactionRepo: jest.Mocked<ITransactionRepository>;
  let mockLogger: any;

  const mockWallet = {
    _id: 'wallet-123',
    walletId: 'wallet-123',
    name: 'Test Wallet',
    balanceMinorUnits: toMinorUnits(1000),
    date: new Date(),
  };

  beforeEach(async () => {
    const mockWalletRepository = {
      findWalletById: jest.fn(),
      createWallet: jest.fn(),
      updateBalanceAtomic: jest.fn(),
    };

    const mockTransactionRepository = {
      createTransaction: jest.fn(),
      findTransactions: jest.fn(),
      findAllTransactions: jest.fn(),
      getTransactionSummary: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: 'IWalletRepository',
          useValue: mockWalletRepository,
        },
        {
          provide: 'ITransactionRepository',
          useValue: mockTransactionRepository,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    walletRepo = module.get('IWalletRepository');
    transactionRepo = module.get('ITransactionRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transact', () => {
    describe('credit transactions', () => {
      it('should process credit transaction successfully', async () => {
        const amount = 100;
        const description = 'Test credit';
        
        walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
        walletRepo.updateBalanceAtomic.mockResolvedValue({
          ...mockWallet,
          balanceMinorUnits: toMinorUnits(1100),
        } as any);
        transactionRepo.createTransaction.mockResolvedValue({
          _id: 'tx-123',
          walletId: 'wallet-123',
          amountMinorUnits: toMinorUnits(amount),
          balanceMinorUnits: toMinorUnits(1100),
          type: TransactionType.CREDIT,
          description,
          date: new Date(),
        } as any);

        const result = await service.transact('wallet-123', amount, description);

        expect(result.balance).toBe(1100);
        expect(result.transactionId).toBe('tx-123');
        expect(walletRepo.updateBalanceAtomic).toHaveBeenCalledWith(
          'wallet-123',
          toMinorUnits(amount),
        );
      });
    });

    describe('debit transactions', () => {
      it('should process debit transaction successfully', async () => {
        const amount = -100;
        const description = 'Test debit';
        
        walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
        walletRepo.updateBalanceAtomic.mockResolvedValue({
          ...mockWallet,
          balanceMinorUnits: toMinorUnits(900),
        } as any);
        transactionRepo.createTransaction.mockResolvedValue({
          _id: 'tx-123',
          walletId: 'wallet-123',
          amountMinorUnits: toMinorUnits(Math.abs(amount)),
          balanceMinorUnits: toMinorUnits(900),
          type: TransactionType.DEBIT,
          description,
          date: new Date(),
        } as any);

        const result = await service.transact('wallet-123', amount, description);

        expect(result.balance).toBe(900);
        expect(result.transactionId).toBe('tx-123');
      });

      it('should throw BadRequestException for insufficient balance', async () => {
        const amount = -2000;
        
        walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
        walletRepo.updateBalanceAtomic.mockResolvedValue(null);

        await expect(
          service.transact('wallet-123', amount, 'Test'),
        ).rejects.toThrow(BadRequestException);
      });
    });

    it('should throw NotFoundException if wallet not found', async () => {
      walletRepo.findWalletById.mockResolvedValue(null);

      await expect(service.transact('wallet-123', 100, 'Test')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for zero amount', async () => {
      await expect(service.transact('wallet-123', 0, 'Test')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const mockTransactions = [
        {
          _id: 'tx-1',
          walletId: 'wallet-123',
          amountMinorUnits: toMinorUnits(100),
          balanceMinorUnits: toMinorUnits(1100),
          type: TransactionType.CREDIT,
          description: 'Test 1',
          date: new Date(),
        },
      ];

      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.findTransactions.mockResolvedValue({
        items: mockTransactions,
        total: 1,
      } as any);

      const result = await service.getTransactions('wallet-123', 0, 10);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].amount).toBe(100);
    });

    it('should apply filters correctly', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.findTransactions.mockResolvedValue({
        items: [],
        total: 0,
      } as any);

      await service.getTransactions(
        'wallet-123',
        0,
        10,
        'date',
        'desc',
        'test',
        TransactionType.CREDIT,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      expect(transactionRepo.findTransactions).toHaveBeenCalledWith(
        'wallet-123',
        0,
        10,
        'date',
        'desc',
        'test',
        TransactionType.CREDIT,
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should validate date range', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);

      await expect(
        service.getTransactions(
          'wallet-123',
          0,
          10,
          'date',
          'desc',
          undefined,
          undefined,
          new Date('2024-12-31'),
          new Date('2024-01-01'),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransactionSummary', () => {
    it('should return transaction summary', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: toMinorUnits(5000),
        totalDebits: toMinorUnits(3000),
        totalTransactions: 100,
      });

      const result = await service.getTransactionSummary('wallet-123');

      expect(result.totalCredits).toBe(5000);
      expect(result.totalDebits).toBe(3000);
      expect(result.totalTransactions).toBe(100);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      walletRepo.findWalletById.mockResolvedValue(null);

      await expect(service.getTransactionSummary('wallet-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
