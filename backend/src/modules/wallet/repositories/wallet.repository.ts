import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
  ): Promise<WalletDocument> {
    const wallet = new this.walletModel({
      name,
      balanceMinorUnits,
      walletId,
    });
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
  ): Promise<WalletDocument | null> {
    const update: any = {
      $inc: { balanceMinorUnits: amountMinorUnits },
    };

    const result = await this.walletModel
      .findOneAndUpdate(
        condition ? { walletId, ...condition } : { walletId },
        update,
        { new: true },
      )
      .exec();

    return result;
  }
}
