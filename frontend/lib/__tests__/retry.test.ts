/**
 * Tests for retry utility
 */
import { retryWithBackoff, isRetryableError, retryIfRetryable } from '../retry';
import { NetworkError, ServerError, ValidationError } from '../errors';

describe('Retry Utils', () => {
  describe('retryWithBackoff', () => {
    it('should return result on first successful attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 10 });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max attempts', async () => {
      const error = new Error('persistent failure');
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(
        retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 10 })
      ).rejects.toThrow('persistent failure');
      
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      const onRetry = jest.fn();
      
      await retryWithBackoff(fn, { maxAttempts: 3, initialDelay: 10, onRetry });
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should use exponential backoff', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryWithBackoff(fn, { 
        maxAttempts: 3, 
        initialDelay: 100,
        backoffMultiplier: 2 
      });
      const endTime = Date.now();
      
      // Should wait at least 100ms + 200ms = 300ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(250);
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      expect(isRetryableError(new NetworkError())).toBe(true);
      expect(isRetryableError(new Error('fetch failed'))).toBe(true);
    });

    it('should identify server errors as retryable', () => {
      const serverError = new ServerError();
      expect(isRetryableError(serverError)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      expect(isRetryableError(new Error('timeout occurred'))).toBe(true);
      expect(isRetryableError(new Error('request aborted'))).toBe(true);
    });

    it('should not retry validation errors', () => {
      expect(isRetryableError(new ValidationError('invalid input'))).toBe(false);
    });

    it('should retry on 5xx status codes', () => {
      expect(isRetryableError({ statusCode: 500 })).toBe(true);
      expect(isRetryableError({ statusCode: 502 })).toBe(true);
      expect(isRetryableError({ statusCode: 503 })).toBe(true);
    });

    it('should retry on 429 (rate limit)', () => {
      expect(isRetryableError({ statusCode: 429 })).toBe(true);
    });

    it('should not retry on 4xx errors (except 429)', () => {
      expect(isRetryableError({ statusCode: 400 })).toBe(false);
      expect(isRetryableError({ statusCode: 404 })).toBe(false);
    });
  });

  describe('retryIfRetryable', () => {
    it('should retry retryable errors', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new NetworkError())
        .mockResolvedValue('success');
      
      const result = await retryIfRetryable(fn, { maxAttempts: 3, initialDelay: 10 });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const error = new ValidationError('bad request');
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(
        retryIfRetryable(fn, { maxAttempts: 3, initialDelay: 10 })
      ).rejects.toThrow('bad request');
      
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
