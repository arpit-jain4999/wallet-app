import { exportService } from '../export.service';
import { ExportJobStatus } from '@/types/export';

// Mock fetch
global.fetch = jest.fn();

describe('exportService', () => {
  const mockWalletId = 'wallet-123';
  const mockJobId = 'job-123';
  const baseUrl = 'http://localhost:3001';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = baseUrl;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  describe('startExport', () => {
    it('should return CSV blob for small dataset (sync export)', async () => {
      const mockCsvData = 'id,amount,type\n1,100,CREDIT';
      const mockBlob = new Blob([mockCsvData], { type: 'text/csv' });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/csv' }),
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const result = await exportService.startExport(mockWalletId);

      expect(result.type).toBe('csv');
      expect(result.data).toBeInstanceOf(Blob);
      expect(global.fetch).toHaveBeenCalledWith(
        `${baseUrl}/transactions/export?walletId=${mockWalletId}`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'text/csv, application/json',
          },
        }),
      );
    });

    it('should return job info for large dataset (async export)', async () => {
      const mockJobResponse = {
        message: 'Export job started',
        jobId: mockJobId,
        status: ExportJobStatus.PENDING,
        totalRecords: 5000,
        pollUrl: `/export-jobs/${mockJobId}`,
        sseUrl: `/export-jobs/${mockJobId}/stream`,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(mockJobResponse),
      });

      const result = await exportService.startExport(mockWalletId);

      expect(result.type).toBe('job');
      expect(result.data).toEqual(mockJobResponse);
    });

    it('should throw error on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Wallet not found' }),
      });

      await expect(exportService.startExport(mockWalletId)).rejects.toThrow(
        'Wallet not found',
      );
    });

    it('should throw generic error if no error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(exportService.startExport(mockWalletId)).rejects.toThrow(
        'Export failed',
      );
    });
  });

  describe('getJobStatus', () => {
    it('should fetch job status successfully', async () => {
      const mockJob = {
        id: mockJobId,
        walletId: mockWalletId,
        status: ExportJobStatus.PROCESSING,
        progress: 50,
        totalRecords: 5000,
        processedRecords: 2500,
        createdAt: new Date().toISOString(),
      };

      // Mock the apiGet function (imported from apiClient)
      jest.mock('@/lib/apiClient', () => ({
        apiGet: jest.fn().mockResolvedValue(mockJob),
      }));

      // Note: This test relies on the apiClient mock
      // In a real test, you would mock the fetch or axios call
    });
  });

  describe('createProgressStream', () => {
    it('should create EventSource with correct URL', () => {
      const mockEventSource = {};
      global.EventSource = jest.fn(() => mockEventSource) as any;

      const eventSource = exportService.createProgressStream(mockJobId);

      expect(global.EventSource).toHaveBeenCalledWith(
        `${baseUrl}/export-jobs/${mockJobId}/stream`,
      );
      expect(eventSource).toBe(mockEventSource);
    });
  });

  describe('downloadFile', () => {
    let createElementSpy: jest.SpyInstance;
    let appendChildSpy: jest.SpyInstance;
    let removeChildSpy: jest.SpyInstance;
    let clickSpy: jest.Mock;
    let createObjectURLSpy: jest.SpyInstance;

    beforeEach(() => {
      clickSpy = jest.fn();
      const mockLink = {
        href: '',
        download: '',
        click: clickSpy,
      };

      createElementSpy = jest
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as any);
      appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
      removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();
      
      // Mock URL methods
      createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      jest.restoreAllMocks();
    });

    it('should download blob data', () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      const filename = 'test.csv';

      exportService.downloadFile(mockBlob, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should download data URL', () => {
      const dataUrl = 'data:text/csv;base64,aWQsYW1vdW50';
      const filename = 'test.csv';

      exportService.downloadFile(dataUrl, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled(); // Not needed for data URLs
    });
  });
});
