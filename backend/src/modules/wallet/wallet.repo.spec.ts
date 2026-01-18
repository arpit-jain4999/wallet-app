import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { WalletRepository } from './wallet.repo';
import { Wallet } from './schemas/wallet.schema';
import { Transaction } from './schemas/transaction.schema';
import { Model } from 'mongoose';

describe('WalletRepository', () => {
  let repository: WalletRepository;
  let walletModel: Model<Wallet>;
  let transactionModel: Model<Transaction>;

  const mockWalletModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  Object.assign(mockWalletModel, {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    exec: jest.fn(),
  });

  const mockTransactionModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  Object.assign(mockTransactionModel, {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn(),
    aggregate: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletRepository,
        {
          provide: getModelToken(Wallet.name),
          useValue: mockWalletModel,
        },
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
      ],
    }).compile();

    repository = module.get<WalletRepository>(WalletRepository);
    walletModel = module.get<Model<Wallet>>(getModelToken(Wallet.name));
    transactionModel = module.get<Model<Transaction>>(
      getModelToken(Transaction.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a wallet successfully', async () => {
      const mockWallet = {
        name: 'Test Wallet',
        balanceMinorUnits: 100000,
        walletId: 'test-wallet-id',
        save: jest.fn().mockResolvedValue({
          name: 'Test Wallet',
          balanceMinorUnits: 100000,
          walletId: 'test-wallet-id',
        }),
      };

      mockWalletModel.mockReturnValue(mockWallet);

      const result = await repository.createWallet(
        'Test Wallet',
        100000,
        'test-wallet-id',
      );

      expect(mockWalletModel).toHaveBeenCalledWith({
        name: 'Test Wallet',
        balanceMinorUnits: 100000,
        walletId: 'test-wallet-id',
      });
      expect(mockWallet.save).toHaveBeenCalled();
    });
  });

  describe('findWalletById', () => {
    it('should find wallet by id', async () => {
      const mockWallet = {
        name: 'Test Wallet',
        balanceMinorUnits: 100000,
        walletId: 'test-wallet-id',
      };

      (mockWalletModel as any).findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWallet),
      });

      const result = await repository.findWalletById('test-wallet-id');

      expect((mockWalletModel as any).findOne).toHaveBeenCalledWith({
        walletId: 'test-wallet-id',
      });
      expect(result).toEqual(mockWallet);
    });

    it('should return null if wallet not found', async () => {
      (mockWalletModel as any).findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findWalletById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('updateBalanceAtomic', () => {
    it('should update balance atomically for credit', async () => {
      const mockUpdatedWallet = {
        walletId: 'test-wallet-id',
        balanceMinorUnits: 150000,
      };

      (mockWalletModel as any).findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedWallet),
      });

      const result = await repository.updateBalanceAtomic(
        'test-wallet-id',
        50000,
      );

      expect((mockWalletModel as any).findOneAndUpdate).toHaveBeenCalledWith(
        { walletId: 'test-wallet-id' },
        { $inc: { balanceMinorUnits: 50000 } },
        { new: true },
      );
      expect(result).toEqual(mockUpdatedWallet);
    });

    it('should update balance atomically for debit with validation', async () => {
      const mockUpdatedWallet = {
        walletId: 'test-wallet-id',
        balanceMinorUnits: 50000,
      };

      const additionalQuery = { balanceMinorUnits: { $gte: 50000 } };

      (mockWalletModel as any).findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedWallet),
      });

      const result = await repository.updateBalanceAtomic(
        'test-wallet-id',
        -50000,
        additionalQuery,
      );

      expect((mockWalletModel as any).findOneAndUpdate).toHaveBeenCalledWith(
        { walletId: 'test-wallet-id', ...additionalQuery },
        { $inc: { balanceMinorUnits: -50000 } },
        { new: true },
      );
      expect(result).toEqual(mockUpdatedWallet);
    });

    it('should return null if balance insufficient', async () => {
      (mockWalletModel as any).findOneAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.updateBalanceAtomic(
        'test-wallet-id',
        -100000,
        { balanceMinorUnits: { $gte: 100000 } },
      );

      expect(result).toBeNull();
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const mockTransaction = {
        _id: 'transaction-id',
        walletId: 'test-wallet-id',
        amountMinorUnits: 50000,
        balanceMinorUnits: 150000,
        type: 'CREDIT',
        description: 'Test',
        save: jest.fn().mockResolvedValue({
          _id: 'transaction-id',
          walletId: 'test-wallet-id',
          amountMinorUnits: 50000,
          balanceMinorUnits: 150000,
          type: 'CREDIT',
          description: 'Test',
        }),
      };

      mockTransactionModel.mockReturnValue(mockTransaction);

      const result = await repository.createTransaction(
        'test-wallet-id',
        50000,
        150000,
        'CREDIT',
        'Test',
      );

      expect(mockTransactionModel).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'test-wallet-id',
          amountMinorUnits: 50000,
          balanceMinorUnits: 150000,
          type: 'CREDIT',
          description: 'Test',
        }),
      );
      expect(mockTransaction.save).toHaveBeenCalled();
    });
  });

  describe('findTransactions', () => {
    it('should find transactions with pagination', async () => {
      const mockTransactions = [
        {
          _id: 'tx1',
          walletId: 'test-wallet-id',
          amountMinorUnits: 10000,
          type: 'CREDIT',
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTransactions),
      };

      (mockTransactionModel as any).find = jest.fn().mockReturnValue(mockQuery);
      (mockTransactionModel as any).countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await repository.findTransactions(
        'test-wallet-id',
        0,
        10,
      );

      expect((mockTransactionModel as any).find).toHaveBeenCalledWith({
        walletId: 'test-wallet-id',
      });
      expect(result.items).toEqual(mockTransactions);
      expect(result.total).toBe(1);
    });

    it('should apply sorting correctly', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (mockTransactionModel as any).find = jest.fn().mockReturnValue(mockQuery);
      (mockTransactionModel as any).countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await repository.findTransactions(
        'test-wallet-id',
        0,
        10,
        'date',
        'desc',
      );

      expect(mockQuery.sort).toHaveBeenCalledWith({ date: -1 });
    });

    it('should filter by transaction type', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (mockTransactionModel as any).find = jest.fn().mockReturnValue(mockQuery);
      (mockTransactionModel as any).countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await repository.findTransactions(
        'test-wallet-id',
        0,
        10,
        undefined,
        undefined,
        undefined,
        'CREDIT',
      );

      expect((mockTransactionModel as any).find).toHaveBeenCalledWith({
        walletId: 'test-wallet-id',
        type: 'CREDIT',
      });
    });

    it('should filter by date range', async () => {
      const fromDate = new Date('2024-01-01T00:00:00.000Z');
      const toDate = new Date('2024-12-31T23:59:59.999Z');

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (mockTransactionModel as any).find = jest.fn().mockReturnValue(mockQuery);
      (mockTransactionModel as any).countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await repository.findTransactions(
        'test-wallet-id',
        0,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        fromDate,
        toDate,
      );

      // The repo adjusts dates - just check that it was called with date filters
      expect((mockTransactionModel as any).find).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: 'test-wallet-id',
          date: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          }),
        }),
      );
    });

    it('should search by description', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (mockTransactionModel as any).find = jest.fn().mockReturnValue(mockQuery);
      (mockTransactionModel as any).countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await repository.findTransactions(
        'test-wallet-id',
        0,
        10,
        undefined,
        undefined,
        'test search',
      );

      // The actual implementation uses $and with $exists, $ne, and $regex
      expect((mockTransactionModel as any).find).toHaveBeenCalledWith({
        walletId: 'test-wallet-id',
        $and: [
          { description: { $exists: true, $ne: null } },
          { description: { $regex: 'test search', $options: 'i' } },
        ],
      });
    });
  });

  describe('findAllTransactions', () => {
    it('should find all transactions for wallet', async () => {
      const mockTransactions = [
        {
          _id: 'tx1',
          walletId: 'test-wallet-id',
          amountMinorUnits: 10000,
          type: 'CREDIT',
        },
        {
          _id: 'tx2',
          walletId: 'test-wallet-id',
          amountMinorUnits: 5000,
          type: 'DEBIT',
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTransactions),
      };

      (mockTransactionModel as any).find = jest.fn().mockReturnValue(mockQuery);

      const result = await repository.findAllTransactions('test-wallet-id');

      expect((mockTransactionModel as any).find).toHaveBeenCalledWith({
        walletId: 'test-wallet-id',
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ date: -1 });
      expect(result).toEqual(mockTransactions);
    });

    it('should return empty array if no transactions', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      (mockTransactionModel as any).find = jest.fn().mockReturnValue(mockQuery);

      const result = await repository.findAllTransactions('test-wallet-id');

      expect(result).toEqual([]);
    });
  });
});
