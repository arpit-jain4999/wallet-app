import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExportJob, ExportJobDocument } from '../schemas/export-job.schema';
import { ExportJob as ExportJobInterface, ExportJobStatus } from '../interfaces/export-job.interface';

/**
 * Export Job Repository
 * Handles database operations for export jobs
 */
@Injectable()
export class ExportJobRepository {
  constructor(
    @InjectModel(ExportJob.name)
    private readonly exportJobModel: Model<ExportJobDocument>,
  ) {}

  /**
   * Create a new export job
   */
  async createJob(walletId: string, jobId: string, totalRecords: number): Promise<ExportJobInterface> {
    const job = new this.exportJobModel({
      jobId,
      walletId,
      status: ExportJobStatus.PENDING,
      progress: 0,
      totalRecords,
      processedRecords: 0,
    });

    const saved = await job.save();
    return this.toInterface(saved);
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<ExportJobInterface | null> {
    const job = await this.exportJobModel.findOne({ jobId }).exec();
    return job ? this.toInterface(job) : null;
  }

  /**
   * Update job
   */
  async updateJob(jobId: string, updates: Partial<ExportJobInterface>): Promise<ExportJobInterface> {
    // Convert interface 'id' to schema 'jobId' if present
    const schemaUpdates: any = { ...updates };
    if ('id' in schemaUpdates) {
      delete schemaUpdates.id;
    }
    
    const job = await this.exportJobModel
      .findOneAndUpdate({ jobId }, { ...schemaUpdates, updatedAt: new Date() }, { new: true })
      .exec();

    if (!job) {
      throw new Error(`Export job not found: ${jobId}`);
    }

    return this.toInterface(job);
  }

  /**
   * Delete job
   */
  async deleteJob(jobId: string): Promise<void> {
    await this.exportJobModel.deleteOne({ jobId }).exec();
  }

  /**
   * Get all jobs for a wallet
   */
  async getJobsByWalletId(walletId: string): Promise<ExportJobInterface[]> {
    const jobs = await this.exportJobModel.find({ walletId }).sort({ createdAt: -1 }).exec();
    return jobs.map((job) => this.toInterface(job));
  }

  /**
   * Get all jobs (for monitoring/admin purposes)
   */
  async getAllJobs(): Promise<ExportJobInterface[]> {
    const jobs = await this.exportJobModel.find().sort({ createdAt: -1 }).limit(100).exec();
    return jobs.map((job) => this.toInterface(job));
  }

  /**
   * Clean up expired jobs (older than 24 hours)
   */
  async cleanupExpiredJobs(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.exportJobModel.deleteMany({ createdAt: { $lt: oneDayAgo } }).exec();
    return result.deletedCount || 0;
  }

  /**
   * Convert document to interface
   */
  private toInterface(doc: ExportJobDocument): ExportJobInterface {
    return {
      id: doc.jobId,
      walletId: doc.walletId,
      status: doc.status,
      progress: doc.progress,
      totalRecords: doc.totalRecords,
      processedRecords: doc.processedRecords,
      downloadUrl: doc.downloadUrl,
      error: doc.error,
      createdAt: doc.createdAt,
      completedAt: doc.completedAt,
    };
  }
}
