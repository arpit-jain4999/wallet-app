/**
 * Tests for pagination utility functions
 */
import {
  getPageNumbers,
  calculateTotalPages,
  isValidPage,
  clampPage,
} from '../pagination';

describe('Pagination Utilities', () => {
  describe('getPageNumbers', () => {
    it('should show all pages when total is less than max visible', () => {
      const result = getPageNumbers(1, 5);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should show first page with ellipsis and last page for early pages', () => {
      const result = getPageNumbers(1, 20);
      expect(result).toEqual([1, 2, '...', 20]);
    });

    it('should show pages around current page for middle pages', () => {
      const result = getPageNumbers(10, 20);
      expect(result).toEqual([1, '...', 9, 10, 11, '...', 20]);
    });

    it('should show first page with ellipsis and last pages for late pages', () => {
      const result = getPageNumbers(20, 20);
      expect(result).toEqual([1, '...', 19, 20]);
    });

    it('should handle page 2 correctly', () => {
      const result = getPageNumbers(2, 20);
      expect(result).toEqual([1, 2, 3, '...', 20]);
    });

    it('should handle page 3 correctly', () => {
      const result = getPageNumbers(3, 20);
      expect(result).toEqual([1, 2, 3, 4, '...', 20]);
    });

    it('should handle second to last page correctly', () => {
      const result = getPageNumbers(19, 20);
      expect(result).toEqual([1, '...', 18, 19, 20]);
    });

    it('should handle third to last page correctly', () => {
      const result = getPageNumbers(18, 20);
      // When on page 18 of 20, shows [1, '...', 17, 18, 19, 20]
      expect(result).toEqual([1, '...', 17, 18, 19, 20]);
    });

    it('should respect custom maxVisible', () => {
      const result = getPageNumbers(1, 10, 5);
      expect(result).toEqual([1, 2, '...', 10]);
    });

    it('should handle single page', () => {
      const result = getPageNumbers(1, 1);
      expect(result).toEqual([1]);
    });

    it('should handle two pages', () => {
      const result = getPageNumbers(1, 2);
      expect(result).toEqual([1, 2]);
    });
  });

  describe('calculateTotalPages', () => {
    it('should calculate total pages correctly', () => {
      expect(calculateTotalPages(100, 10)).toBe(10);
      expect(calculateTotalPages(105, 10)).toBe(11);
      expect(calculateTotalPages(99, 10)).toBe(10);
    });

    it('should handle zero items', () => {
      expect(calculateTotalPages(0, 10)).toBe(0);
    });

    it('should handle single item', () => {
      expect(calculateTotalPages(1, 10)).toBe(1);
    });

    it('should handle exact multiples', () => {
      expect(calculateTotalPages(50, 25)).toBe(2);
      expect(calculateTotalPages(100, 50)).toBe(2);
    });
  });

  describe('isValidPage', () => {
    it('should return true for valid pages', () => {
      expect(isValidPage(1, 10)).toBe(true);
      expect(isValidPage(5, 10)).toBe(true);
      expect(isValidPage(10, 10)).toBe(true);
    });

    it('should return false for invalid pages', () => {
      expect(isValidPage(0, 10)).toBe(false);
      expect(isValidPage(11, 10)).toBe(false);
      expect(isValidPage(-1, 10)).toBe(false);
    });
  });

  describe('clampPage', () => {
    it('should clamp to minimum', () => {
      expect(clampPage(0, 10)).toBe(1);
      expect(clampPage(-5, 10)).toBe(1);
    });

    it('should clamp to maximum', () => {
      expect(clampPage(15, 10)).toBe(10);
      expect(clampPage(100, 10)).toBe(10);
    });

    it('should return valid pages unchanged', () => {
      expect(clampPage(5, 10)).toBe(5);
      expect(clampPage(1, 10)).toBe(1);
      expect(clampPage(10, 10)).toBe(10);
    });
  });
});
