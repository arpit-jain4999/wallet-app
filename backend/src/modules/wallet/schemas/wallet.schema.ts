import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  balanceMinorUnits: number; // Stored as integer (multiplied by 10000)

  @Prop({ required: true, unique: true })
  walletId: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Indexes for performance
WalletSchema.index({ walletId: 1 }); // Already unique, but explicit index for clarity
WalletSchema.index({ createdAt: -1 }); // For sorting by creation date
