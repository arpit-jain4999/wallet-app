import { renderHook, act, waitFor } from '@testing-library/react';
import { useExport } from '../useExport';
import { exportService } from '@/services/export.service';
import { ExportJobStatus } from '@/types/export';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/services/export.service');
jest.mock('sonner');

describe('useExport', () => {
  const mockWalletId = 'wallet-123';
  const mockJobId = 'job-123';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('startExport - sync (small dataset)', () => {
    it('should handle sync export successfully', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      const mockDownloadFile = jest.fn();

      (exportService.startExport as jest.Mock).mockResolvedValue({
        type: 'csv',
        data: mockBlob,
      });
      (exportService.downloadFile as jest.Mock) = mockDownloadFile;

      const { result } = renderHook(() => useExport(mockWalletId));

      expect(result.current.isExporting).toBe(false);
      expect(result.current.progress).toBe(0);

      await act(async () => {
        await result.current.startExport();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
        expect(result.current.progress).toBe(100);
      });

      expect(exportService.startExport).toHaveBeenCalledWith(mockWalletId);
      expect(toast.loading).toHaveBeenCalled();
      expect(toast.dismiss).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
      expect(mockDownloadFile).toHaveBeenCalledWith(
        mockBlob,
        expect.stringContaining('transactions-'),
      );
    });
  });

  describe('startExport - async (large dataset) with SSE', () => {
    it('should handle async export with SSE progress updates', async () => {
      const mockEventSource = {
        onmessage: null as any,
        onerror: null as any,
        close: jest.fn(),
      };

      const mockJob = {
        id: mockJobId,
        walletId: mockWalletId,
        status: ExportJobStatus.PENDING,
        progress: 0,
        totalRecords: 5000,
        processedRecords: 0,
        createdAt: new Date().toISOString(),
      };

      (exportService.startExport as jest.Mock).mockResolvedValue({
        type: 'job',
        data: {
          jobId: mockJobId,
          status: ExportJobStatus.PENDING,
          totalRecords: 5000,
          pollUrl: `/export-jobs/${mockJobId}`,
          sseUrl: `/export-jobs/${mockJobId}/stream`,
        },
      });

      (exportService.createProgressStream as jest.Mock).mockReturnValue(mockEventSource);

      const { result } = renderHook(() => useExport(mockWalletId, { useSSE: true }));

      await act(async () => {
        await result.current.startExport();
      });

      expect(result.current.isExporting).toBe(true);
      expect(result.current.currentJob).toBeDefined();

      // Simulate SSE progress update
      await act(async () => {
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: JSON.stringify({
              ...mockJob,
              status: ExportJobStatus.PROCESSING,
              progress: 50,
              processedRecords: 2500,
            }),
          });
        }
      });

      expect(result.current.progress).toBe(50);

      // Simulate completion
      await act(async () => {
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: JSON.stringify({
              ...mockJob,
              status: ExportJobStatus.COMPLETED,
              progress: 100,
              processedRecords: 5000,
              downloadUrl: 'data:text/csv;base64,test',
            }),
          });
        }
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
        expect(result.current.progress).toBe(100);
      });

      expect(mockEventSource.close).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should handle SSE failure and fallback to polling', async () => {
      const mockEventSource = {
        onmessage: null as any,
        onerror: null as any,
        close: jest.fn(),
      };

      (exportService.startExport as jest.Mock).mockResolvedValue({
        type: 'job',
        data: {
          jobId: mockJobId,
          status: ExportJobStatus.PENDING,
          totalRecords: 5000,
        },
      });

      (exportService.createProgressStream as jest.Mock).mockReturnValue(mockEventSource);

      (exportService.getJobStatus as jest.Mock)
        .mockResolvedValueOnce({
          id: mockJobId,
          status: ExportJobStatus.PROCESSING,
          progress: 25,
        })
        .mockResolvedValueOnce({
          id: mockJobId,
          status: ExportJobStatus.COMPLETED,
          progress: 100,
          downloadUrl: 'data:text/csv;base64,test',
        });

      const { result } = renderHook(() => useExport(mockWalletId, { useSSE: true }));

      await act(async () => {
        await result.current.startExport();
      });

      // Simulate SSE error
      await act(async () => {
        if (mockEventSource.onerror) {
          mockEventSource.onerror();
        }
      });

      // Advance timers for polling
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(exportService.getJobStatus).toHaveBeenCalled();
      });
    });
  });

  describe('startExport - async with polling', () => {
    it('should handle async export with polling', async () => {
      (exportService.startExport as jest.Mock).mockResolvedValue({
        type: 'job',
        data: {
          jobId: mockJobId,
          status: ExportJobStatus.PENDING,
          totalRecords: 5000,
        },
      });

      (exportService.getJobStatus as jest.Mock)
        .mockResolvedValueOnce({
          id: mockJobId,
          walletId: mockWalletId,
          status: ExportJobStatus.PROCESSING,
          progress: 50,
          processedRecords: 2500,
          totalRecords: 5000,
          createdAt: new Date().toISOString(),
        })
        .mockResolvedValueOnce({
          id: mockJobId,
          walletId: mockWalletId,
          status: ExportJobStatus.COMPLETED,
          progress: 100,
          processedRecords: 5000,
          totalRecords: 5000,
          downloadUrl: 'data:text/csv;base64,test',
          createdAt: new Date().toISOString(),
        });

      const { result } = renderHook(() => useExport(mockWalletId, { useSSE: false }));

      await act(async () => {
        await result.current.startExport();
      });

      expect(result.current.isExporting).toBe(true);

      // First poll
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.progress).toBe(50);
      });

      // Second poll (completion)
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
        expect(result.current.progress).toBe(100);
      });

      expect(exportService.getJobStatus).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle export error', async () => {
      const errorMessage = 'Network error';
      (exportService.startExport as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const onError = jest.fn();
      const { result } = renderHook(() => useExport(mockWalletId, { onError }));

      await act(async () => {
        await result.current.startExport();
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });

      expect(toast.error).toHaveBeenCalledWith(errorMessage);
      expect(onError).toHaveBeenCalledWith(errorMessage);
    });

    it('should handle job failure', async () => {
      const mockEventSource = {
        onmessage: null as any,
        onerror: null as any,
        close: jest.fn(),
      };

      (exportService.startExport as jest.Mock).mockResolvedValue({
        type: 'job',
        data: {
          jobId: mockJobId,
          status: ExportJobStatus.PENDING,
          totalRecords: 5000,
        },
      });

      (exportService.createProgressStream as jest.Mock).mockReturnValue(mockEventSource);

      const onError = jest.fn();
      const { result } = renderHook(() => useExport(mockWalletId, { onError }));

      await act(async () => {
        await result.current.startExport();
      });

      // Simulate job failure
      await act(async () => {
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: JSON.stringify({
              id: mockJobId,
              status: ExportJobStatus.FAILED,
              error: 'Export failed',
            }),
          });
        }
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
        expect(result.current.error).toBe('Export failed');
      });

      expect(toast.error).toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('cancelExport', () => {
    it('should cancel export and clean up resources', async () => {
      const mockEventSource = {
        onmessage: null as any,
        onerror: null as any,
        close: jest.fn(),
      };

      (exportService.startExport as jest.Mock).mockResolvedValue({
        type: 'job',
        data: {
          jobId: mockJobId,
          status: ExportJobStatus.PENDING,
          totalRecords: 5000,
        },
      });

      (exportService.createProgressStream as jest.Mock).mockReturnValue(mockEventSource);

      const { result } = renderHook(() => useExport(mockWalletId));

      await act(async () => {
        await result.current.startExport();
      });

      expect(result.current.isExporting).toBe(true);

      await act(async () => {
        result.current.cancelExport();
      });

      expect(result.current.isExporting).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.currentJob).toBeNull();
      expect(mockEventSource.close).toHaveBeenCalled();
      expect(toast.info).toHaveBeenCalledWith('Export cancelled');
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up resources on unmount', async () => {
      const mockEventSource = {
        onmessage: null as any,
        onerror: null as any,
        close: jest.fn(),
      };

      (exportService.startExport as jest.Mock).mockResolvedValue({
        type: 'job',
        data: {
          jobId: mockJobId,
          status: ExportJobStatus.PENDING,
          totalRecords: 5000,
        },
      });

      (exportService.createProgressStream as jest.Mock).mockReturnValue(mockEventSource);

      const { result, unmount } = renderHook(() => useExport(mockWalletId));

      await act(async () => {
        await result.current.startExport();
      });

      unmount();

      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('should call onComplete callback on successful export', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      const onComplete = jest.fn();

      (exportService.startExport as jest.Mock).mockResolvedValue({
        type: 'csv',
        data: mockBlob,
      });
      (exportService.downloadFile as jest.Mock) = jest.fn();

      const { result } = renderHook(() => useExport(mockWalletId, { onComplete }));

      await act(async () => {
        await result.current.startExport();
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith('immediate');
      });
    });
  });
});
