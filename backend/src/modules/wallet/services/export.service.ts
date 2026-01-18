import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { ITransactionRepository } from '../interfaces/transaction-repository.interface';
import { IWalletRepository } from '../interfaces/wallet-repository.interface';
import { ExportJobRepository } from '../repositories/export-job.repository';
import { fromMinorUnits } from '../../../common/utils/money.util';
import { generateCSV } from '../../../common/utils/csv.util';
import { generateCSVWithWorker } from '../../../common/utils/csv-worker.util';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EXPORT_CONFIG } from '../../../config/constants';
import { ExportJob, ExportJobStatus } from '../interfaces/export-job.interface';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

/**
 * Export Service
 * Handles CSV export operations with batch processing for large datasets
 */
@Injectable()
export class ExportService {
  // Event emitter for SSE support
  public readonly eventEmitter: EventEmitter = new EventEmitter();

  constructor(
    @Inject('IWalletRepository')
    private readonly walletRepo: IWalletRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepo: ITransactionRepository,
    private readonly exportJobRepo: ExportJobRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    // Clean up old jobs periodically
    this.startJobCleanup();
  }

  /**
   * Check if wallet should use async export based on transaction count
   */
  async shouldUseAsyncExport(walletId: string): Promise<boolean> {
    const summary = await this.transactionRepo.getTransactionSummary(walletId);
    return summary.totalTransactions > EXPORT_CONFIG.SYNC_THRESHOLD;
  }

  /**
   * Export transactions synchronously (for small datasets)
   * Use this for datasets under SYNC_THRESHOLD
   */
  async exportTransactionsSync(walletId: string): Promise<string> {
    this.logger.log(`Synchronous export for wallet: ${walletId}`, 'ExportService');

    // Ensure wallet exists
    const wallet = await this.walletRepo.findWalletById(walletId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Get transaction count
    const summary = await this.transactionRepo.getTransactionSummary(walletId);
    
    if (summary.totalTransactions > EXPORT_CONFIG.SYNC_THRESHOLD) {
      throw new BadRequestException(
        `Too many transactions (${summary.totalTransactions}). Use async export instead.`,
      );
    }

    // Fetch all transactions
    const transactions = await this.transactionRepo.findAllTransactions(walletId);

    // Transform and generate CSV using worker thread
    const data = transactions.map((tx) => ({
      id: tx._id.toString(),
      walletId: tx.walletId,
      amount: fromMinorUnits(tx.amountMinorUnits),
      balance: fromMinorUnits(tx.balanceMinorUnits),
      description: tx.description || '',
      date: tx.date.toISOString(),
      type: tx.type,
    }));

    // Use worker thread for CSV generation (non-blocking)
    return generateCSVWithWorker({ data });
  }

  /**
   * Start async export job (for large datasets)
   * Returns job ID for tracking
   */
  async startAsyncExport(walletId: string): Promise<ExportJob> {
    this.logger.log(`Starting async export for wallet: ${walletId}`, 'ExportService');

    // Ensure wallet exists
    const wallet = await this.walletRepo.findWalletById(walletId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Get transaction count
    const summary = await this.transactionRepo.getTransactionSummary(walletId);
    
    if (summary.totalTransactions > EXPORT_CONFIG.MAX_RECORDS) {
      throw new BadRequestException(
        `Too many transactions (${summary.totalTransactions}). Maximum allowed: ${EXPORT_CONFIG.MAX_RECORDS}`,
      );
    }

    // Create job in database
    const jobId = uuidv4();
    const job = await this.exportJobRepo.createJob(walletId, jobId, summary.totalTransactions);

    // Process in background (don't await)
    this.processExportJob(job.id).catch((error) => {
      this.logger.error(`Export job ${job.id} failed: ${error.message}`, 'ExportService');
    });

    return job;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ExportJob> {
    const job = await this.exportJobRepo.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }
    return job;
  }

  /**
   * Process export job in background with batch processing
   * @private
   */
  private async processExportJob(jobId: string): Promise<void> {
    let job = await this.exportJobRepo.getJob(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }

    try {
      // Update status to processing
      job = await this.exportJobRepo.updateJob(jobId, {
        status: ExportJobStatus.PROCESSING,
        progress: 0,
      });
      this.emitJobUpdate(job);

      const { walletId, totalRecords } = job;
      const batchSize = EXPORT_CONFIG.BATCH_SIZE;
      const allData: any[] = [];

      // Process in batches
      for (let skip = 0; skip < totalRecords!; skip += batchSize) {
        const limit = Math.min(batchSize, totalRecords! - skip);

        this.logger.log(
          `Processing batch: skip=${skip}, limit=${limit} for job ${jobId}`,
          'ExportService',
        );

        // Fetch batch
        const { items } = await this.transactionRepo.findTransactions(
          walletId,
          skip,
          limit,
          'date',
          'desc',
        );

        // Transform batch
        const batchData = items.map((tx) => ({
          id: tx._id.toString(),
          walletId: tx.walletId,
          amount: fromMinorUnits(tx.amountMinorUnits),
          balance: fromMinorUnits(tx.balanceMinorUnits),
          description: tx.description || '',
          date: tx.date.toISOString(),
          type: tx.type,
        }));

        allData.push(...batchData);

        // Update progress
        const processedRecords = skip + limit;
        const progress = Math.floor((processedRecords / totalRecords!) * 100);
        job = await this.exportJobRepo.updateJob(jobId, {
          processedRecords,
          progress,
        });
        this.emitJobUpdate(job);

        // Small delay to prevent blocking event loop
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Generate CSV using worker thread (non-blocking)
      this.logger.log(`Generating CSV for job ${jobId} using worker thread`, 'ExportService');
      const csv = await generateCSVWithWorker({
        data: allData,
        onProgress: (progress) => {
          // CSV generation progress (separate from data fetching progress)
          // Update job progress if needed
          const csvProgress = Math.min(95, Math.floor((job.processedRecords! / totalRecords!) * 90 + progress * 0.1));
          this.exportJobRepo.updateJob(jobId, { progress: csvProgress }).then((updatedJob) => {
            job = updatedJob;
            this.emitJobUpdate(job);
          }).catch((err) => {
            this.logger.error(`Failed to update job progress: ${err.message}`, 'ExportService');
          });
        },
      });

      // In production: Upload to S3/Cloud Storage and get URL
      // For now, encode as data URL (can be improved with cloud storage)
      const csvData = Buffer.from(csv).toString('base64');
      const downloadUrl = `data:text/csv;base64,${csvData}`;

      // Update job as completed
      job = await this.exportJobRepo.updateJob(jobId, {
        status: ExportJobStatus.COMPLETED,
        progress: 100,
        downloadUrl,
        completedAt: new Date(),
      });
      this.emitJobUpdate(job);

      this.logger.log(`Export job ${jobId} completed successfully`, 'ExportService');
    } catch (error) {
      this.logger.error(`Export job ${jobId} failed: ${error.message}`, 'ExportService');
      
      try {
        job = await this.exportJobRepo.updateJob(jobId, {
          status: ExportJobStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        this.emitJobUpdate(job);
      } catch (updateError) {
        this.logger.error(`Failed to update failed job: ${updateError}`, 'ExportService');
      }

      throw error;
    }
  }

  /**
   * Emit job update event (for SSE)
   */
  private emitJobUpdate(job: ExportJob): void {
    this.eventEmitter.emit('export.progress', job);
  }

  /**
   * Clean up old jobs periodically
   * Jobs older than 24 hours are automatically deleted by MongoDB TTL index
   * This method is kept for manual cleanup if needed
   */
  private startJobCleanup(): void {
    // MongoDB TTL index handles automatic cleanup
    // This periodic cleanup is optional and can be disabled
    setInterval(async () => {
      try {
        const deletedCount = await this.exportJobRepo.cleanupExpiredJobs();
        if (deletedCount > 0) {
          this.logger.log(`Cleaned up ${deletedCount} expired export jobs`, 'ExportService');
        }
      } catch (error) {
        this.logger.error(`Job cleanup failed: ${error}`, 'ExportService');
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Get all active jobs for monitoring
   */
  async getAllJobs(): Promise<ExportJob[]> {
    return this.exportJobRepo.getAllJobs();
  }

  /**
   * Get all jobs for a specific wallet
   */
  async getJobsByWalletId(walletId: string): Promise<ExportJob[]> {
    return this.exportJobRepo.getJobsByWalletId(walletId);
  }
}
