import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Wallet, WalletDocument } from '../schemas/wallet.schema';
import { IWalletRepository } from '../interfaces/wallet-repository.interface';

/**
 * MongoDB implementation of Wallet Repository
 * Handles wallet-specific data access operations
 */
@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async createWallet(
    name: string,
    balanceMinorUnits: number,
    walletId: string,
    session?: ClientSession,
  ): Promise<WalletDocument> {
    const wallet = new this.walletModel({
      name,
      balanceMinorUnits,
      walletId,
    });
    if (session) {
      return wallet.save({ session });
    }
    return wallet.save();
  }

  async findWalletById(walletId: string): Promise<WalletDocument | null> {
    return this.walletModel.findOne({ walletId }).exec();
  }

  async findWalletByMongoId(id: string): Promise<WalletDocument | null> {
    return this.walletModel.findById(id).exec();
  }

  async updateBalanceAtomic(
    walletId: string,
    amountMinorUnits: number,
    condition?: { balanceMinorUnits: { $gte: number } },
    session?: ClientSession,
  ): Promise<WalletDocument | null> {
    const update: any = {
      $inc: { balanceMinorUnits: amountMinorUnits },
    };

    const options: any = { new: true, lean: false };
    if (session) {
      options.session = session;
    }

    const query = this.walletModel.findOneAndUpdate(
      condition ? { walletId, ...condition } : { walletId },
      update,
      options,
    );

    if (session) {
      query.session(session);
    }

    const result = await query.exec();
    // findOneAndUpdate with { new: true } returns the document or null
    // Type assertion needed because Mongoose types return ModifyResult
    return (result as unknown) as WalletDocument | null;
  }
}
