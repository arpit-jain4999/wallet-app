/**
 * Tests for CSV utility functions
 */
import { generateCSV } from '../csv.util';

describe('CSV Utilities', () => {
  describe('generateCSV', () => {
    it('should generate CSV from transactions', () => {
      const transactions = [
        {
          _id: 'tx1',
          walletId: 'wallet-123',
          amount: 10.5,
          balance: 110.5,
          type: 'CREDIT',
          description: 'Test credit',
          date: new Date('2024-01-15T10:30:00Z'),
        },
        {
          _id: 'tx2',
          walletId: 'wallet-123',
          amount: 5.25,
          balance: 105.25,
          type: 'DEBIT',
          description: 'Test debit',
          date: new Date('2024-01-16T14:45:00Z'),
        },
      ];

      const csv = generateCSV(transactions);

      // Check for actual CSV columns that the util generates
      expect(csv).toContain('_id'); // Uses _id, not ID
      expect(csv).toContain('amount');
      expect(csv).toContain('type');
      expect(csv).toContain('tx1');
      expect(csv).toContain('CREDIT');
      expect(csv).toContain('10.5');
      expect(csv).toContain('110.5');
      expect(csv).toContain('Test credit');
      expect(csv).toContain('tx2');
      expect(csv).toContain('DEBIT');
      expect(csv).toContain('5.25');
    });

    it('should handle empty transactions array', () => {
      const csv = generateCSV([]);

      // Empty array returns empty string (no header)
      expect(csv).toBe('');
    });

    it('should escape commas in descriptions', () => {
      const transactions = [
        {
          _id: 'tx1',
          walletId: 'wallet-123',
          amount: 10,
          balance: 110,
          type: 'CREDIT',
          description: 'Payment for coffee, tea, and snacks',
          date: new Date('2024-01-15'),
        },
      ];

      const csv = generateCSV(transactions);

      expect(csv).toContain('"Payment for coffee, tea, and snacks"');
    });

    it('should escape quotes in descriptions', () => {
      const transactions = [
        {
          _id: 'tx1',
          walletId: 'wallet-123',
          amount: 10,
          balance: 110,
          type: 'CREDIT',
          description: 'Payment for "premium" service',
          date: new Date('2024-01-15'),
        },
      ];

      const csv = generateCSV(transactions);

      expect(csv).toContain('""premium""');
    });

    it('should handle missing descriptions', () => {
      const transactions = [
        {
          _id: 'tx1',
          walletId: 'wallet-123',
          amount: 10,
          balance: 110,
          type: 'CREDIT',
          description: undefined,
          date: new Date('2024-01-15'),
        },
      ];

      const csv = generateCSV(transactions);

      expect(csv).toContain('tx1');
      expect(csv).not.toContain('undefined');
    });

    it('should format dates correctly', () => {
      const transactions = [
        {
          _id: 'tx1',
          walletId: 'wallet-123',
          amount: 10,
          balance: 110,
          type: 'CREDIT',
          description: 'Test',
          date: new Date('2024-01-15T10:30:45Z'),
        },
      ];

      const csv = generateCSV(transactions);

      // Check that date is present in CSV
      expect(csv).toContain('tx1');
      expect(csv).toContain('2024');
    });

    it('should maintain correct row count', () => {
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        _id: `tx${i}`,
        walletId: 'wallet-123',
        amount: i * 10,
        balance: i * 10,
        type: i % 2 === 0 ? 'CREDIT' : 'DEBIT',
        description: `Transaction ${i}`,
        date: new Date(),
      }));

      const csv = generateCSV(transactions);
      const lines = csv.split('\n').filter(line => line.length > 0);

      // Header + 100 rows
      expect(lines.length).toBe(101);
    });
  });
});
