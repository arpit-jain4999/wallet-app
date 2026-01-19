import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ExportJobStatus } from '../interfaces/export-job.interface';

export type ExportJobDocument = ExportJob & Document;

@Schema({ timestamps: true, collection: 'export_jobs' })
export class ExportJob {
  @Prop({ required: true, unique: true })
  jobId: string;

  @Prop({ required: true })
  walletId: string;

  @Prop({ required: true, enum: ExportJobStatus, default: ExportJobStatus.PENDING })
  status: ExportJobStatus;

  @Prop({ required: true, type: Number, default: 0, min: 0, max: 100 })
  progress: number;

  @Prop({ type: Number })
  totalRecords?: number;

  @Prop({ type: Number, default: 0 })
  processedRecords?: number;

  @Prop({ type: String })
  downloadUrl?: string;

  @Prop({ type: String })
  error?: string;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ExportJobSchema = SchemaFactory.createForClass(ExportJob);

// Compound index for efficient queries
ExportJobSchema.index({ walletId: 1, status: 1 });
// TTL index: Auto-delete documents older than 24 hours
ExportJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
