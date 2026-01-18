/**
 * Export Job Interface
 * Defines the structure for CSV export background jobs
 */

export enum ExportJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface ExportJob {
  id: string;
  walletId: string;
  status: ExportJobStatus;
  progress: number; // 0-100
  totalRecords?: number;
  processedRecords?: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExportJobRepository {
  createJob(walletId: string): Promise<ExportJob>;
  getJob(jobId: string): Promise<ExportJob | null>;
  updateJob(jobId: string, updates: Partial<ExportJob>): Promise<ExportJob>;
  deleteJob(jobId: string): Promise<void>;
}
