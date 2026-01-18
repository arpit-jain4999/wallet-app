import { parentPort, workerData } from 'worker_threads';

/**
 * CSV Generation Worker Thread
 * Generates CSV from data without blocking the main event loop
 */

interface WorkerData {
  data: Record<string, any>[];
  jobId?: string;
}

interface WorkerMessage {
  type: 'progress' | 'result' | 'error';
  progress?: number;
  result?: string;
  error?: string;
}

function generateCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const csvRows: string[] = [headers.join(',')];

  const batchSize = 100; // Process in small batches to report progress
  const totalRows = rows.length;

  for (let i = 0; i < totalRows; i += batchSize) {
    const batch = rows.slice(i, Math.min(i + batchSize, totalRows));

    for (const row of batch) {
      const values = headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        // Escape commas and quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    // Report progress
    const progress = Math.floor(((i + batch.length) / totalRows) * 100);
    if (parentPort) {
      parentPort.postMessage({
        type: 'progress',
        progress,
      } as WorkerMessage);
    }
  }

  return csvRows.join('\n');
}

// Main worker execution
if (parentPort) {
  try {
    const { data } = workerData as WorkerData;

    // Generate CSV with progress updates
    const csv = generateCSV(data);

    // Send result back to main thread
    parentPort.postMessage({
      type: 'result',
      result: csv,
    } as WorkerMessage);
  } catch (error) {
    // Send error back to main thread
    if (parentPort) {
      parentPort.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as WorkerMessage);
    }
  }
}
