/**
 * Retry utility with exponential backoff
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 * 
 * @example
 * ```ts
 * const data = await retryWithBackoff(
 *   () => fetchData(),
 *   { maxAttempts: 3, onRetry: (attempt) => console.log(`Retry ${attempt}`) }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay,
      );

      // Call retry callback if provided
      onRetry?.(attempt, lastError);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (network errors, 5xx, timeouts)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return true;
    }

    // Timeout errors
    if (error.message.includes('timeout') || error.message.includes('aborted')) {
      return true;
    }
  }

  // Check for HTTP status codes
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const statusCode = (error as { statusCode: number }).statusCode;
    // Retry on 5xx server errors and 429 (rate limit)
    return statusCode >= 500 || statusCode === 429;
  }

  return false;
}

/**
 * Retry only if error is retryable
 */
export async function retryIfRetryable<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    onRetry: (attempt, error) => {
      if (!isRetryableError(error)) {
        throw error;
      }
      options.onRetry?.(attempt, error);
    },
  });
}
