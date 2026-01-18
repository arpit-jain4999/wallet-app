import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExportService } from './export.service';
import { IWalletRepository } from '../interfaces/wallet-repository.interface';
import { ITransactionRepository } from '../interfaces/transaction-repository.interface';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ExportJobStatus } from '../interfaces/export-job.interface';
import { TransactionType } from '../../../common/enums';
import { toMinorUnits } from '../../../common/utils/money.util';

describe('ExportService', () => {
  let service: ExportService;
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

  const mockTransactions = Array.from({ length: 10 }, (_, i) => ({
    _id: `tx-${i}`,
    walletId: 'wallet-123',
    amountMinorUnits: toMinorUnits(100),
    balanceMinorUnits: toMinorUnits(1000 + i * 100),
    type: i % 2 === 0 ? TransactionType.CREDIT : TransactionType.DEBIT,
    description: `Transaction ${i}`,
    date: new Date(),
  }));

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
        ExportService,
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

    service = module.get<ExportService>(ExportService);
    walletRepo = module.get('IWalletRepository');
    transactionRepo = module.get('ITransactionRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldUseAsyncExport', () => {
    it('should return false for small datasets', async () => {
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: 500,
        totalDebits: 200,
        totalTransactions: 500,
      });

      const result = await service.shouldUseAsyncExport('wallet-123');

      expect(result).toBe(false);
      expect(transactionRepo.getTransactionSummary).toHaveBeenCalledWith('wallet-123');
    });

    it('should return true for large datasets', async () => {
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: 5000,
        totalDebits: 2000,
        totalTransactions: 5000,
      });

      const result = await service.shouldUseAsyncExport('wallet-123');

      expect(result).toBe(true);
    });
  });

  describe('exportTransactionsSync', () => {
    it('should export transactions synchronously for small dataset', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: 500,
        totalDebits: 200,
        totalTransactions: 500,
      });
      transactionRepo.findAllTransactions.mockResolvedValue(mockTransactions as any);

      const result = await service.exportTransactionsSync('wallet-123');

      expect(result).toContain('id,walletId,amount,balance,description,date,type');
      expect(result).toContain('Transaction 0');
      expect(walletRepo.findWalletById).toHaveBeenCalledWith('wallet-123');
      expect(transactionRepo.findAllTransactions).toHaveBeenCalledWith('wallet-123');
    });

    it('should throw NotFoundException if wallet not found', async () => {
      walletRepo.findWalletById.mockResolvedValue(null);

      await expect(service.exportTransactionsSync('wallet-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for large dataset', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: 5000,
        totalDebits: 2000,
        totalTransactions: 5000,
      });

      await expect(service.exportTransactionsSync('wallet-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('startAsyncExport', () => {
    it('should create and start async export job', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: 5000,
        totalDebits: 2000,
        totalTransactions: 5000,
      });
      transactionRepo.findTransactions.mockResolvedValue({
        items: mockTransactions,
        total: 5000,
      } as any);

      const job = await service.startAsyncExport('wallet-123');

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.walletId).toBe('wallet-123');
      expect(job.status).toBe(ExportJobStatus.PENDING);
      expect(job.totalRecords).toBe(5000);
      expect(job.progress).toBe(0);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      walletRepo.findWalletById.mockResolvedValue(null);

      await expect(service.startAsyncExport('wallet-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if too many records', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: 150000,
        totalDebits: 50000,
        totalTransactions: 150000,
      });

      await expect(service.startAsyncExport('wallet-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: 5000,
        totalDebits: 2000,
        totalTransactions: 5000,
      });
      transactionRepo.findTransactions.mockResolvedValue({
        items: mockTransactions,
        total: 5000,
      } as any);

      const job = await service.startAsyncExport('wallet-123');
      const status = await service.getJobStatus(job.id);

      expect(status).toBeDefined();
      expect(status.id).toBe(job.id);
    });

    it('should throw NotFoundException for invalid job ID', async () => {
      await expect(service.getJobStatus('invalid-job-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processExportJob (integration)', () => {
    it('should process export job in batches', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: 5000,
        totalDebits: 2000,
        totalTransactions: 1500,
      });
      
      // Mock batch processing
      transactionRepo.findTransactions.mockResolvedValue({
        items: mockTransactions,
        total: 1500,
      } as any);

      const job = await service.startAsyncExport('wallet-123');

      // Wait for job to process (with timeout)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const status = await service.getJobStatus(job.id);
      
      // Job should be processing or completed
      expect([
        ExportJobStatus.PROCESSING,
        ExportJobStatus.COMPLETED,
      ]).toContain(status.status);
    });
  });

  describe('getAllJobs', () => {
    it('should return all active jobs', async () => {
      walletRepo.findWalletById.mockResolvedValue(mockWallet as any);
      transactionRepo.getTransactionSummary.mockResolvedValue({
        totalCredits: 5000,
        totalDebits: 2000,
        totalTransactions: 5000,
      });
      transactionRepo.findTransactions.mockResolvedValue({
        items: mockTransactions,
        total: 5000,
      } as any);

      await service.startAsyncExport('wallet-123');
      const jobs = await service.getAllJobs();

      expect(jobs).toHaveLength(1);
      expect(jobs[0].walletId).toBe('wallet-123');
    });
  });
});
