import { apiGet } from '@/lib/apiClient';
import { ExportJob, ExportResponse } from '@/types/export';

/**
 * Export Service
 * Handles CSV export operations with smart sync/async detection
 */
export const exportService = {
  /**
   * Start export (smart detection - sync or async based on dataset size)
   * Returns either CSV blob or export job info
   */
  async startExport(walletId: string): Promise<{ type: 'csv' | 'job'; data: Blob | ExportResponse }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/transactions/export?walletId=${walletId}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Export failed');
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('text/csv')) {
      // Small dataset - CSV ready immediately
      const blob = await response.blob();
      return { type: 'csv', data: blob };
    } else {
      // Large dataset - Job started
      const jobInfo = await response.json();
      return { type: 'job', data: jobInfo as ExportResponse };
    }
  },

  /**
   * Get export job status
   */
  async getJobStatus(jobId: string): Promise<ExportJob> {
    return apiGet<ExportJob>(`/export-jobs/${jobId}`);
  },

  /**
   * Create SSE connection for real-time progress updates
   */
  createProgressStream(jobId: string): EventSource {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return new EventSource(`${baseUrl}/export-jobs/${jobId}/stream`);
  },

  /**
   * Download file from data URL or blob
   */
  downloadFile(data: Blob | string, filename: string): void {
    if (typeof data === 'string') {
      // Data URL (base64)
      const link = document.createElement('a');
      link.href = data;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Blob
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  },
};
