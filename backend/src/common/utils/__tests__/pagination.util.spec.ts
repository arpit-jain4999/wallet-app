/**
 * Tests for pagination utility functions
 */
import { normalizePagination } from '../pagination.util';

describe('Pagination Utilities', () => {
  describe('normalizePagination', () => {
    it('should return default values when no params provided', () => {
      const result = normalizePagination(undefined, undefined);

      expect(result.skip).toBe(0);
      expect(result.limit).toBe(10); // Default is 10, max is 100
    });

    it('should calculate skip correctly', () => {
      const result = normalizePagination(20, 10);

      expect(result.skip).toBe(20);
      expect(result.limit).toBe(10);
    });

    it('should handle first page', () => {
      const result = normalizePagination(0, 25);

      expect(result.skip).toBe(0);
      expect(result.limit).toBe(25);
    });

    it('should cap limit at maximum', () => {
      const result = normalizePagination(0, 200);

      expect(result.limit).toBe(100); // Max limit
    });

    it('should handle negative skip', () => {
      const result = normalizePagination(-10, 10);

      expect(result.skip).toBe(0);
      expect(result.limit).toBe(10);
    });

    it('should handle negative limit', () => {
      const result = normalizePagination(0, -5);

      expect(result.skip).toBe(0);
      expect(result.limit).toBe(1); // Minimum of 1
    });

    it('should handle zero limit', () => {
      const result = normalizePagination(0, 0);

      expect(result.skip).toBe(0);
      expect(result.limit).toBe(10); // Uses default limit
    });

    it('should work with typical pagination scenarios', () => {
      // Page 1, 10 per page
      expect(normalizePagination(0, 10)).toEqual({ skip: 0, limit: 10 });

      // Page 2, 10 per page
      expect(normalizePagination(10, 10)).toEqual({ skip: 10, limit: 10 });

      // Page 3, 25 per page
      expect(normalizePagination(50, 25)).toEqual({ skip: 50, limit: 25 });

      // Page 5, 50 per page
      expect(normalizePagination(200, 50)).toEqual({ skip: 200, limit: 50 });
    });
  });
});
