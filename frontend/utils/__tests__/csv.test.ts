/**
 * Tests for CSV utility functions
 */
import { downloadCSV, exportTransactionsCSV } from '../csv';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CSV Utils', () => {
  let createElementSpy: jest.SpyInstance;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let mockLink: any;

  beforeEach(() => {
    // Mock DOM methods
    mockLink = {
      click: jest.fn(),
      href: '',
      download: '',
    };

    createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();
    
    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('downloadCSV', () => {
    it('should create download link and trigger download', () => {
      const blob = new Blob(['test,data'], { type: 'text/csv' });
      const filename = 'test.csv';

      downloadCSV(blob, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockLink.download).toBe(filename);
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('exportTransactionsCSV', () => {
    it('should export transactions successfully', async () => {
      const walletId = 'wallet-123';
      const blob = new Blob(['transaction,data'], { type: 'text/csv' });
      const mockExportFn = jest.fn().mockResolvedValue(blob);

      await exportTransactionsCSV(walletId, mockExportFn);

      expect(mockExportFn).toHaveBeenCalledWith(walletId);
      // Filename includes timestamp, so just check it starts correctly
      expect(mockLink.download).toMatch(/^transactions-wallet-123-\d+\.csv$/);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle export errors', async () => {
      const walletId = 'wallet-123';
      const error = new Error('Export failed');
      const mockExportFn = jest.fn().mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Function catches errors and doesn't rethrow
      await exportTransactionsCSV(walletId, mockExportFn);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Export failed:', error);

      consoleErrorSpy.mockRestore();
    });
  });
});
