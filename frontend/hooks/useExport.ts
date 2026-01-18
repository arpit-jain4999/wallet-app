'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { exportService } from '@/services/export.service';
import { ExportJob, ExportJobStatus, ExportResponse } from '@/types/export';
import { toast } from 'sonner';
import { LOADING_MESSAGES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';

/**
 * Options for useExport hook
 */
interface UseExportOptions {
  /** Callback when export completes successfully */
  onComplete?: (downloadUrl: string) => void;
  /** Callback when export fails */
  onError?: (error: string) => void;
  /** Use Server-Sent Events for real-time progress (default: true) */
  useSSE?: boolean;
}

/**
 * Custom hook for managing CSV export operations
 * 
 * Handles both synchronous (small datasets) and asynchronous (large datasets) CSV exports
 * with real-time progress tracking via Server-Sent Events (SSE) or polling fallback.
 * 
 * Features:
 * - Automatic sync/async detection based on dataset size
 * - Real-time progress updates via SSE or polling
 * - Automatic file download on completion
 * - Toast notifications for user feedback
 * - Error handling with automatic cleanup
 * 
 * @param {string} walletId - Wallet ID to export transactions for
 * @param {UseExportOptions} [options] - Export options
 * @param {Function} [options.onComplete] - Callback when export completes
 * @param {Function} [options.onError] - Callback when export fails
 * @param {boolean} [options.useSSE=true] - Use SSE for progress updates (falls back to polling if unavailable)
 * 
 * @returns {Object} Export hook return value
 * @returns {boolean} isExporting - True if export is in progress
 * @returns {number} progress - Export progress (0-100)
 * @returns {ExportJob | null} currentJob - Current export job details
 * @returns {string | null} error - Error message if export failed, null otherwise
 * @returns {Function} startExport - Start export operation
 * @returns {Function} cancelExport - Cancel ongoing export
 * 
 * @example
 * ```tsx
 * const { isExporting, progress, startExport, cancelExport } = useExport('wallet-id-123', {
 *   onComplete: (url) => console.log('Export complete:', url),
 *   onError: (error) => console.error('Export failed:', error)
 * });
 * 
 * // Start export
 * await startExport();
 * 
 * // Cancel export
 * cancelExport();
 * ```
 */
export function useExport(walletId: string, options: UseExportOptions = {}) {
  const { onComplete, onError, useSSE = true } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clean up resources
   */
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * Track job progress with SSE
   */
  const trackJobWithSSE = useCallback((jobId: string) => {
    cleanup();

    try {
      const eventSource = exportService.createProgressStream(jobId);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const job: ExportJob = JSON.parse(event.data);
          setCurrentJob(job);
          setProgress(job.progress);

          if (job.status === ExportJobStatus.COMPLETED) {
            cleanup();
            setIsExporting(false);
            toast.success(SUCCESS_MESSAGES.EXPORT_SUCCESS);
            
            if (job.downloadUrl) {
              exportService.downloadFile(job.downloadUrl, `transactions-${walletId}-${Date.now()}.csv`);
              onComplete?.(job.downloadUrl);
            }
          } else if (job.status === ExportJobStatus.FAILED) {
            cleanup();
            setIsExporting(false);
            const errorMsg = job.error || ERROR_MESSAGES.EXPORT_FAILED;
            setError(errorMsg);
            toast.error(errorMsg);
            onError?.(errorMsg);
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = () => {
        console.warn('SSE connection error. Falling back to polling.');
        cleanup();
        trackJobWithPolling(jobId);
      };
    } catch (err) {
      console.error('Error creating SSE connection:', err);
      trackJobWithPolling(jobId);
    }
  }, [walletId, cleanup, onComplete, onError]);

  /**
   * Track job progress with polling (fallback)
   */
  const trackJobWithPolling = useCallback((jobId: string) => {
    cleanup();

    const poll = async () => {
      try {
        const job = await exportService.getJobStatus(jobId);
        setCurrentJob(job);
        setProgress(job.progress);

        if (job.status === ExportJobStatus.COMPLETED) {
          cleanup();
          setIsExporting(false);
          toast.success(SUCCESS_MESSAGES.EXPORT_SUCCESS);
          
          if (job.downloadUrl) {
            exportService.downloadFile(job.downloadUrl, `transactions-${walletId}-${Date.now()}.csv`);
            onComplete?.(job.downloadUrl);
          }
        } else if (job.status === ExportJobStatus.FAILED) {
          cleanup();
          setIsExporting(false);
          const errorMsg = job.error || ERROR_MESSAGES.EXPORT_FAILED;
          setError(errorMsg);
          toast.error(errorMsg);
          onError?.(errorMsg);
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    };

    // Initial poll
    poll();

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(poll, 2000);
  }, [walletId, cleanup, onComplete, onError]);

  /**
   * Start export
   */
  const startExport = useCallback(async () => {
    setIsExporting(true);
    setProgress(0);
    setError(null);
    setCurrentJob(null);

    try {
      toast.loading(LOADING_MESSAGES.EXPORTING, { id: 'export-loading' });

      const result = await exportService.startExport(walletId);

      toast.dismiss('export-loading');

      if (result.type === 'csv') {
        // Small dataset - CSV ready immediately
        const blob = result.data as Blob;
        exportService.downloadFile(blob, `transactions-${walletId}-${Date.now()}.csv`);
        toast.success(SUCCESS_MESSAGES.EXPORT_SUCCESS);
        setIsExporting(false);
        setProgress(100);
        onComplete?.('immediate');
      } else {
        // Large dataset - Track job progress
        const jobInfo = result.data as ExportResponse;
        toast.info(`Exporting ${jobInfo.totalRecords.toLocaleString()} transactions. This may take a moment...`);
        
        setCurrentJob({
          id: jobInfo.jobId,
          walletId,
          status: jobInfo.status,
          progress: 0,
          totalRecords: jobInfo.totalRecords,
          processedRecords: 0,
          createdAt: new Date().toISOString(),
        });

        // Track progress
        if (useSSE) {
          trackJobWithSSE(jobInfo.jobId);
        } else {
          trackJobWithPolling(jobInfo.jobId);
        }
      }
    } catch (err) {
      toast.dismiss('export-loading');
      const errorMsg = err instanceof Error ? err.message : ERROR_MESSAGES.EXPORT_FAILED;
      setError(errorMsg);
      setIsExporting(false);
      toast.error(errorMsg);
      onError?.(errorMsg);
    }
  }, [walletId, useSSE, trackJobWithSSE, trackJobWithPolling, onComplete, onError]);

  /**
   * Cancel export
   */
  const cancelExport = useCallback(() => {
    cleanup();
    setIsExporting(false);
    setProgress(0);
    setCurrentJob(null);
    toast.info('Export cancelled');
  }, [cleanup]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    startExport,
    cancelExport,
    isExporting,
    progress,
    currentJob,
    error,
  };
}
