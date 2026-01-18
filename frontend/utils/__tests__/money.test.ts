/**
 * Tests for utility functions
 */
import { formatMoney } from '../money';

describe('Money Utils', () => {
  describe('formatMoney', () => {
    it('should format positive numbers correctly', () => {
      expect(formatMoney(100.1234)).toBe('100.1234');
      expect(formatMoney(0.5)).toBe('0.5');
      expect(formatMoney(1234567.89)).toBe('1234567.89');
    });

    it('should format zero correctly', () => {
      expect(formatMoney(0)).toBe('0');
    });

    it('should handle negative numbers', () => {
      expect(formatMoney(-50.25)).toBe('-50.25');
    });

    it('should handle very small numbers', () => {
      expect(formatMoney(0.0001)).toBe('0.0001');
    });
  });
});
