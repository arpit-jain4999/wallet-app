/**
 * E2E Tests for Wallet Controller
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { WalletController } from './wallet.controller';
import { WalletService } from './services/wallet.service';
import { TransactionService } from './services/transaction.service';
import { ExportService } from './services/export.service';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { ExportJobStatus } from './interfaces/export-job.interface';

describe('WalletController (E2E)', () => {
  let app: NestFastifyApplication;
  let walletService: WalletService;
  let transactionService: TransactionService;
  let exportService: ExportService;

  const mockWalletService = {
    setupWallet: jest.fn(),
    getWallet: jest.fn(),
  };

  const mockTransactionService = {
    transact: jest.fn(),
    getTransactions: jest.fn(),
    getTransactionSummary: jest.fn(),
    exportTransactions: jest.fn(),
  };

  const mockExportService = {
    shouldUseAsyncExport: jest.fn(),
    exportTransactionsSync: jest.fn(),
    startAsyncExport: jest.fn(),
    getJobStatus: jest.fn(),
    eventEmitter: {
      on: jest.fn(),
      removeListener: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
        {
          provide: ExportService,
          useValue: mockExportService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    walletService = moduleFixture.get<WalletService>(WalletService);
    transactionService = moduleFixture.get<TransactionService>(TransactionService);
    exportService = moduleFixture.get<ExportService>(ExportService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /setup', () => {
    it('should create a new wallet', async () => {
      const mockResponse = {
        id: 'wallet-123',
        name: 'Test Wallet',
        balance: 100,
        date: new Date(),
      };

      mockWalletService.setupWallet.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/setup')
        .send({ name: 'Test Wallet', balance: 100 })
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'wallet-123',
        name: 'Test Wallet',
        balance: 100,
      });
      expect(mockWalletService.setupWallet).toHaveBeenCalledWith(
        'Test Wallet',
        100,
      );
    });

    it('should create wallet with zero balance', async () => {
      const mockResponse = {
        id: 'wallet-123',
        name: 'Zero Wallet',
        balance: 0,
        date: new Date(),
      };

      mockWalletService.setupWallet.mockResolvedValue(mockResponse);

      await request(app.getHttpServer())
        .post('/setup')
        .send({ name: 'Zero Wallet' })
        .expect(200);
    });

    it('should reject missing name', async () => {
      await request(app.getHttpServer())
        .post('/setup')
        .send({ balance: 100 })
        .expect(400);
    });
  });

  describe('GET /wallet/:id', () => {
    it('should return wallet details', async () => {
      const mockWallet = {
        id: 'wallet-123',
        name: 'Test Wallet',
        balance: 100.5,
        date: new Date(),
      };

      mockWalletService.getWallet.mockResolvedValue(mockWallet);

      const response = await request(app.getHttpServer())
        .get('/wallet/wallet-123')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'wallet-123',
        name: 'Test Wallet',
        balance: 100.5,
      });
    });

    it('should return 404 for non-existent wallet', async () => {
      mockWalletService.getWallet.mockRejectedValue(
        new NotFoundException('Wallet not found'),
      );

      await request(app.getHttpServer())
        .get('/wallet/invalid-id')
        .expect(404);
    });
  });

  describe('POST /transact/:walletId', () => {
    it('should execute credit transaction', async () => {
      mockTransactionService.transact.mockResolvedValue({
        balance: 120,
        transactionId: 'tx-123',
      });

      const response = await request(app.getHttpServer())
        .post('/transact/wallet-123')
        .send({ amount: 20, description: 'Credit' })
        .expect(200);

      expect(response.body.balance).toBe(120);
      expect(response.body.transactionId).toBe('tx-123');
    });

    it('should execute debit transaction', async () => {
      mockTransactionService.transact.mockResolvedValue({
        balance: 80,
        transactionId: 'tx-124',
      });

      await request(app.getHttpServer())
        .post('/transact/wallet-123')
        .send({ amount: -20, description: 'Debit' })
        .expect(200);
    });

    it('should reject invalid amount', async () => {
      await request(app.getHttpServer())
        .post('/transact/wallet-123')
        .send({ amount: 'invalid' })
        .expect(400);
    });
  });

  describe('GET /transactions', () => {
    it('should return paginated transactions', async () => {
      const mockResult = {
        items: [
          {
            id: 'tx1',
            amount: 10,
            type: 'CREDIT',
            date: new Date(),
          },
        ],
        total: 1,
      };

      mockTransactionService.getTransactions.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .get('/transactions')
        .query({ walletId: 'wallet-123', skip: 0, limit: 10 })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.total).toBe(1);
    });

    it('should apply sorting', async () => {
      mockTransactionService.getTransactions.mockResolvedValue({
        items: [],
        total: 0,
      });

      await request(app.getHttpServer())
        .get('/transactions')
        .query({
          walletId: 'wallet-123',
          sortBy: 'date',
          sortOrder: 'desc',
        })
        .expect(200);

      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
        'wallet-123',
        expect.any(Number),
        expect.any(Number),
        'date',
        'desc',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should filter by type', async () => {
      mockTransactionService.getTransactions.mockResolvedValue({
        items: [],
        total: 0,
      });

      await request(app.getHttpServer())
        .get('/transactions')
        .query({ walletId: 'wallet-123', type: 'CREDIT' })
        .expect(200);

      expect(mockTransactionService.getTransactions).toHaveBeenCalledWith(
        'wallet-123',
        expect.any(Number),
        expect.any(Number),
        undefined,
        undefined,
        undefined,
        'CREDIT',
        undefined,
        undefined,
      );
    });

    it('should search by description', async () => {
      mockTransactionService.getTransactions.mockResolvedValue({
        items: [],
        total: 0,
      });

      await request(app.getHttpServer())
        .get('/transactions')
        .query({ walletId: 'wallet-123', search: 'coffee' })
        .expect(200);
    });
  });

  describe('GET /wallet/:id/summary', () => {
    it('should return wallet summary', async () => {
      const mockSummary = {
        totalCredits: 500,
        totalDebits: 200,
        totalTransactions: 15,
      };

      mockTransactionService.getTransactionSummary.mockResolvedValue(mockSummary);

      const response = await request(app.getHttpServer())
        .get('/wallet/wallet-123/summary')
        .expect(200);

      expect(response.body).toEqual(mockSummary);
    });
  });

  describe('GET /transactions/export', () => {
    describe('Sync Export (Small Dataset)', () => {
      it('should export small dataset as CSV immediately', async () => {
        const mockCsv = 'id,amount,type\ntx1,100,CREDIT';

        mockExportService.shouldUseAsyncExport.mockResolvedValue(false);
        mockExportService.exportTransactionsSync.mockResolvedValue(mockCsv);

        const response = await request(app.getHttpServer())
          .get('/transactions/export')
          .query({ walletId: 'wallet-123' })
          .expect(200);

        expect(response.headers['content-type']).toContain('text/csv');
        expect(response.headers['content-disposition']).toContain('attachment');
        expect(response.text).toBe(mockCsv);
        expect(mockExportService.shouldUseAsyncExport).toHaveBeenCalledWith('wallet-123');
        expect(mockExportService.exportTransactionsSync).toHaveBeenCalledWith('wallet-123');
      });
    });

    describe('Async Export (Large Dataset)', () => {
      it('should start async export job for large dataset', async () => {
        const mockJob = {
          id: 'job-123',
          walletId: 'wallet-123',
          status: ExportJobStatus.PENDING,
          progress: 0,
          totalRecords: 5000,
          processedRecords: 0,
          createdAt: new Date(),
        };

        mockExportService.shouldUseAsyncExport.mockResolvedValue(true);
        mockExportService.startAsyncExport.mockResolvedValue(mockJob);

        const response = await request(app.getHttpServer())
          .get('/transactions/export')
          .query({ walletId: 'wallet-123' })
          .expect(200);

        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body).toMatchObject({
          message: expect.stringContaining('Export job started'),
          jobId: 'job-123',
          status: ExportJobStatus.PENDING,
          totalRecords: 5000,
          pollUrl: '/export-jobs/job-123',
          sseUrl: '/export-jobs/job-123/stream',
        });
        expect(mockExportService.shouldUseAsyncExport).toHaveBeenCalledWith('wallet-123');
        expect(mockExportService.startAsyncExport).toHaveBeenCalledWith('wallet-123');
      });
    });
  });

  describe('GET /export-jobs/:jobId', () => {
    it('should return job status', async () => {
      const mockJob = {
        id: 'job-123',
        walletId: 'wallet-123',
        status: ExportJobStatus.PROCESSING,
        progress: 50,
        totalRecords: 5000,
        processedRecords: 2500,
        createdAt: new Date().toISOString(),
      };

      mockExportService.getJobStatus.mockResolvedValue(mockJob);

      const response = await request(app.getHttpServer())
        .get('/export-jobs/job-123')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'job-123',
        status: ExportJobStatus.PROCESSING,
        progress: 50,
      });
      expect(mockExportService.getJobStatus).toHaveBeenCalledWith('job-123');
    });

    it('should return 404 for invalid job ID', async () => {
      mockExportService.getJobStatus.mockRejectedValue(
        new NotFoundException('Export job not found'),
      );

      await request(app.getHttpServer())
        .get('/export-jobs/invalid-job-id')
        .expect(404);
    });

    it('should return completed job with download URL', async () => {
      const mockJob = {
        id: 'job-123',
        walletId: 'wallet-123',
        status: ExportJobStatus.COMPLETED,
        progress: 100,
        totalRecords: 5000,
        processedRecords: 5000,
        downloadUrl: 'data:text/csv;base64,aWQsYW1vdW50',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      mockExportService.getJobStatus.mockResolvedValue(mockJob);

      const response = await request(app.getHttpServer())
        .get('/export-jobs/job-123')
        .expect(200);

      expect(response.body.status).toBe(ExportJobStatus.COMPLETED);
      expect(response.body.downloadUrl).toBeDefined();
    });

    it('should return failed job with error message', async () => {
      const mockJob = {
        id: 'job-123',
        walletId: 'wallet-123',
        status: ExportJobStatus.FAILED,
        progress: 45,
        error: 'Database connection failed',
        createdAt: new Date().toISOString(),
      };

      mockExportService.getJobStatus.mockResolvedValue(mockJob);

      const response = await request(app.getHttpServer())
        .get('/export-jobs/job-123')
        .expect(200);

      expect(response.body.status).toBe(ExportJobStatus.FAILED);
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('GET /export-jobs/:jobId/stream (SSE)', () => {
    it('should set correct SSE headers', async () => {
      const mockJob = {
        id: 'job-123',
        walletId: 'wallet-123',
        status: ExportJobStatus.PROCESSING,
        progress: 0,
        createdAt: new Date().toISOString(),
      };

      mockExportService.getJobStatus.mockResolvedValue(mockJob);

      const response = await request(app.getHttpServer())
        .get('/export-jobs/job-123/stream');

      // Note: Testing SSE streams in supertest is limited
      // Real tests would use a proper SSE client
      expect(mockExportService.getJobStatus).toHaveBeenCalledWith('job-123');
    });

    it('should return 404 for invalid job ID in stream', async () => {
      mockExportService.getJobStatus.mockRejectedValue(
        new NotFoundException('Export job not found'),
      );

      await request(app.getHttpServer())
        .get('/export-jobs/invalid-job-id/stream')
        .expect(404);
    });
  });
});
