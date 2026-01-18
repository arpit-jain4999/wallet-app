/**
 * Tests for money utility functions
 */
import {
  toMinorUnits,
  fromMinorUnits,
  validateAmount,
  formatMoney,
} from '../money.util';

describe('Money Utilities', () => {
  describe('toMinorUnits', () => {
    it('should convert major units to minor units', () => {
      expect(toMinorUnits(10)).toBe(100000);
      expect(toMinorUnits(1.5)).toBe(15000);
      expect(toMinorUnits(0.0001)).toBe(1);
    });

    it('should handle zero', () => {
      expect(toMinorUnits(0)).toBe(0);
    });

    it('should handle negative amounts', () => {
      expect(toMinorUnits(-10)).toBe(-100000);
      expect(toMinorUnits(-5.5)).toBe(-55000);
    });

    it('should handle very small decimals', () => {
      expect(toMinorUnits(0.0001)).toBe(1);
      expect(toMinorUnits(0.9999)).toBe(9999);
    });

    it('should round correctly for precision beyond 4 decimals', () => {
      expect(toMinorUnits(10.123456)).toBe(101235); // Rounds to 10.1235
    });
  });

  describe('fromMinorUnits', () => {
    it('should convert minor units to major units', () => {
      expect(fromMinorUnits(100000)).toBe(10);
      expect(fromMinorUnits(15000)).toBe(1.5);
      expect(fromMinorUnits(1)).toBe(0.0001);
    });

    it('should handle zero', () => {
      expect(fromMinorUnits(0)).toBe(0);
    });

    it('should handle negative amounts', () => {
      expect(fromMinorUnits(-100000)).toBe(-10);
      expect(fromMinorUnits(-55000)).toBe(-5.5);
    });

    it('should preserve 4 decimal precision', () => {
      expect(fromMinorUnits(12345)).toBe(1.2345);
      expect(fromMinorUnits(9999)).toBe(0.9999);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      const result = validateAmount(10.5);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject zero', () => {
      const result = validateAmount(0);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be greater than 0');
    });

    it('should reject negative amounts', () => {
      const result = validateAmount(-10);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be greater than 0');
    });

    it('should reject NaN', () => {
      const result = validateAmount(NaN);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Amount must be a valid number');
    });

    it('should handle decimal precision validation', () => {
      const result = validateAmount('10.12345'); // More than 4 decimals
      expect(result.valid).toBe(false);
      expect(result.error).toContain('decimal places');
    });

    it('should accept valid amounts with 4 decimals', () => {
      const result = validateAmount(99999.9999);
      expect(result.valid).toBe(true);
    });
  });

  describe('roundtrip conversion', () => {
    it('should maintain precision through roundtrip', () => {
      const original = 123.4567;
      const minorUnits = toMinorUnits(original);
      const backToMajor = fromMinorUnits(minorUnits);
      
      // Should round to 4 decimals
      expect(backToMajor).toBe(123.4567);
    });

    it('should handle edge case amounts', () => {
      const amounts = [0, 0.0001, 1, 10.5, 99.9999, 1000.1234];
      
      amounts.forEach(amount => {
        const roundtrip = fromMinorUnits(toMinorUnits(amount));
        expect(roundtrip).toBeCloseTo(amount, 4);
      });
    });
  });
});
