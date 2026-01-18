import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  walletId: string;

  @Prop({ required: true, type: Number })
  amountMinorUnits: number; // Stored as integer (multiplied by 10000)

  @Prop({ required: true, type: Number })
  balanceMinorUnits: number; // Balance after this transaction

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ required: true, default: Date.now })
  date: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes for performance
TransactionSchema.index({ walletId: 1, date: -1 }); // Compound index for wallet transactions sorted by date
TransactionSchema.index({ walletId: 1, type: 1 }); // For filtering by wallet and type
TransactionSchema.index({ date: -1 }); // For date range queries
