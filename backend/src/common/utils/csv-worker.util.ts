import { Worker } from 'worker_threads';
import { join } from 'path';

/**
 * CSV Worker Utility
 * Manages worker threads for CSV generation
 */

export interface CSVWorkerOptions {
  data: Record<string, any>[];
  onProgress?: (progress: number) => void;
  timeout?: number; // Timeout in milliseconds (default: 5 minutes)
}

export interface CSVWorkerResult {
  csv: string;
  processingTime: number;
}

/**
 * Generate CSV using a worker thread
 * @param options Worker options including data and progress callback
 * @returns Promise resolving to CSV string
 */
export async function generateCSVWithWorker(
  options: CSVWorkerOptions,
): Promise<string> {
  const { data, onProgress, timeout = 5 * 60 * 1000 } = options;

  return new Promise<string>((resolve, reject) => {
    const startTime = Date.now();
    const workerPath = join(__dirname, 'csv.worker.js');

    // Create worker thread
    const worker = new Worker(workerPath, {
      workerData: { data },
    });

    let isResolved = false;
    let timeoutId: NodeJS.Timeout | null = null;

    // Cleanup function
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // Handle worker messages
    worker.on('message', (message: { type: string; progress?: number; result?: string; error?: string }) => {
      if (isResolved) return;

      switch (message.type) {
        case 'progress':
          if (message.progress !== undefined && onProgress) {
            onProgress(message.progress);
          }
          break;

        case 'result':
          if (message.result !== undefined) {
            isResolved = true;
            cleanup();
            worker.terminate();
            resolve(message.result);
          }
          break;

        case 'error':
          isResolved = true;
          cleanup();
          worker.terminate();
          reject(new Error(message.error || 'CSV generation failed'));
          break;
      }
    });

    // Handle worker errors
    worker.on('error', (error) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      worker.terminate();
      reject(error);
    });

    // Handle worker exit
    worker.on('exit', (code) => {
      if (code !== 0 && !isResolved) {
        isResolved = true;
        cleanup();
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });

    // Timeout handling
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        worker.terminate();
        reject(new Error('CSV generation timeout'));
      }
    }, timeout);
  });
}

/**
 * Check if worker threads are available
 */
export function isWorkerThreadAvailable(): boolean {
  try {
    return typeof Worker !== 'undefined';
  } catch {
    return false;
  }
}
