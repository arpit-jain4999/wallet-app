/**
 * Export Types
 * Type definitions for CSV export operations
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
  createdAt: string;
  completedAt?: string;
}

export interface ExportResponse {
  message: string;
  jobId: string;
  status: ExportJobStatus;
  totalRecords: number;
  pollUrl: string;
  sseUrl: string;
}
