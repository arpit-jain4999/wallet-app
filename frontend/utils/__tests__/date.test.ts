/**
 * Tests for date utility functions
 */
import { formatDate } from '../date';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format Date objects correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan 15, 2024/);
    });

    it('should format ISO string dates', () => {
      const formatted = formatDate('2024-12-25T15:45:00Z');
      expect(formatted).toMatch(/Dec 25, 2024/);
    });

    it('should handle invalid dates gracefully', () => {
      const formatted = formatDate('invalid-date');
      expect(formatted).toBe('Invalid Date');
    });

    it('should format dates with time', () => {
      const date = new Date('2024-06-01T14:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('Jun');
    });
  });
});
