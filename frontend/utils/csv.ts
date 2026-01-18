/**
 * CSV Export Utilities
 * 
 * Provides utilities for exporting data to CSV format and triggering file downloads.
 * 
 * @module utils/csv
 */

/**
 * Trigger a file download in the browser
 * 
 * Creates a temporary anchor element to trigger download of a Blob object.
 * Cleans up the object URL after download.
 * 
 * @param blob - Blob containing the file data
 * @param filename - Name for the downloaded file
 * 
 * @example
 * const blob = new Blob(['data'], { type: 'text/csv' });
 * downloadCSV(blob, 'transactions.csv');
 */
export function downloadCSV(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export transactions to CSV file
 * 
 * Fetches transactions from the API and triggers CSV download.
 * Shows success/error toasts based on result.
 * 
 * @param walletId - ID of the wallet to export transactions for
 * @param fetchExport - Function that fetches and returns CSV blob from API
 * 
 * @throws Will show error toast if export fails
 * 
 * @example
 * await exportTransactionsCSV(
 *   'wallet-123',
 *   transactionsService.exportTransactions
 * );
 */
export async function exportTransactionsCSV(
  walletId: string,
  fetchExport: (walletId: string) => Promise<Blob>
): Promise<void> {
  try {
    const blob = await fetchExport(walletId);
    const filename = `transactions-${walletId}-${Date.now()}.csv`;
    downloadCSV(blob, filename);
    
    // Dynamic import to avoid SSR issues
    const { toast } = await import('sonner');
    toast.success('CSV exported successfully!');
  } catch (error) {
    const { toast } = await import('sonner');
    toast.error('Failed to export CSV');
    console.error('Export failed:', error);
  }
}
