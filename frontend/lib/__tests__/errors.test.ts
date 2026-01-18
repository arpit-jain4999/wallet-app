/**
 * Tests for custom error classes
 */
import {
  ApiError,
  NetworkError,
  ValidationError,
  NotFoundError,
  ServerError,
  parseApiError,
} from '../errors';

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create error with message and status code', () => {
      const error = new ApiError('Test error', 400, 'TEST_CODE');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ApiError');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('NetworkError', () => {
    it('should create network error with default message', () => {
      const error = new NetworkError();
      
      expect(error.message).toBe('Network error. Please check your connection.');
      expect(error.name).toBe('NetworkError');
      expect(error instanceof ApiError).toBe(true);
    });

    it('should create network error with custom message', () => {
      const error = new NetworkError('Custom network error');
      
      expect(error.message).toBe('Custom network error');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with fields', () => {
      const fields = { email: ['Invalid email'], password: ['Too short'] };
      const error = new ValidationError('Validation failed', fields);
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.fields).toEqual(fields);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with default message', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create not found error with custom message', () => {
      const error = new NotFoundError('Wallet not found');
      
      expect(error.message).toBe('Wallet not found');
    });
  });

  describe('ServerError', () => {
    it('should create server error with default message', () => {
      const error = new ServerError();
      
      expect(error.message).toBe('Server error. Please try again later.');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ServerError');
    });
  });

  describe('parseApiError', () => {
    it('should return ApiError as-is', () => {
      const original = new ApiError('Test error', 400);
      const parsed = parseApiError(original);
      
      expect(parsed).toBe(original);
    });

    it('should convert Error to ApiError', () => {
      const original = new Error('Standard error');
      const parsed = parseApiError(original);
      
      expect(parsed).toBeInstanceOf(ApiError);
      expect(parsed.message).toBe('Standard error');
    });

    it('should convert string to ApiError', () => {
      const parsed = parseApiError('String error');
      
      expect(parsed).toBeInstanceOf(ApiError);
      expect(parsed.message).toBe('String error');
    });

    it('should handle unknown errors', () => {
      const parsed = parseApiError({ unknown: 'object' });
      
      expect(parsed).toBeInstanceOf(ApiError);
      expect(parsed.message).toBe('An unknown error occurred');
    });
  });
});
