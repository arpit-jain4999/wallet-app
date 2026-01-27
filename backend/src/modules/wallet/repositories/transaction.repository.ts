import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Transaction, TransactionDocument } from '../schemas/transaction.schema';
import { ITransactionRepository } from '../interfaces/transaction-repository.interface';

/**
 * MongoDB implementation of Transaction Repository
 * Handles transaction-specific data access operations
 */
@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async createTransaction(
    walletId: string,
    amountMinorUnits: number,
    balanceMinorUnits: number,
    type: 'CREDIT' | 'DEBIT',
    description?: string,
    session?: ClientSession,
  ): Promise<TransactionDocument> {
    const transaction = new this.transactionModel({
      walletId,
      amountMinorUnits,
      balanceMinorUnits,
      type,
      description,
      date: new Date(),
    });
    if (session) {
      return transaction.save({ session });
    }
    return transaction.save();
  }

  async findTransactions(
    walletId: string,
    skip: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    search?: string,
    type?: 'CREDIT' | 'DEBIT',
    fromDate?: Date,
    toDate?: Date,
  ): Promise<{ items: TransactionDocument[]; total: number }> {
    const sortField = sortBy || 'date';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortDirection };

    // Build search query
    const query: any = { walletId };
    
    // Filter by type if provided
    if (type) {
      query.type = type;
    }
    
    // Filter by date range if provided
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) {
        query.date.$gte = new Date(fromDate);
        // Set to start of day
        query.date.$gte.setHours(0, 0, 0, 0);
      }
      if (toDate) {
        query.date.$lte = new Date(toDate);
        // Set to end of day
        query.date.$lte.setHours(23, 59, 59, 999);
      }
    }
    
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      // Search in description field (only if description exists and is not null)
      const searchConditions = [
        { description: { $exists: true, $ne: null } },
        { description: searchRegex },
      ];
      
      // If we already have conditions, use $and, otherwise merge
      if (query.$and) {
        query.$and = [...query.$and, ...searchConditions];
      } else {
        query.$and = searchConditions;
      }
    }

    const [items, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(query).exec(),
    ]);

    return { items, total };
  }

  async findAllTransactions(walletId: string): Promise<TransactionDocument[]> {
    return this.transactionModel.find({ walletId }).sort({ date: -1 }).exec();
  }

  async getTransactionSummary(walletId: string): Promise<{
    totalCredits: number;
    totalDebits: number;
    totalTransactions: number;
  }> {
    const [creditResult, debitResult, totalCount] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { walletId, type: 'CREDIT' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amountMinorUnits' },
          },
        },
      ]),
      this.transactionModel.aggregate([
        { $match: { walletId, type: 'DEBIT' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amountMinorUnits' },
          },
        },
      ]),
      this.transactionModel.countDocuments({ walletId }),
    ]);

    const totalCreditsMinorUnits =
      creditResult.length > 0 ? creditResult[0].total : 0;
    const totalDebitsMinorUnits =
      debitResult.length > 0 ? debitResult[0].total : 0;

    return {
      totalCredits: totalCreditsMinorUnits,
      totalDebits: totalDebitsMinorUnits,
      totalTransactions: totalCount,
    };
  }
}
