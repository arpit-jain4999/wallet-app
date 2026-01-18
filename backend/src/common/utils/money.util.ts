/**
 * Money utility functions for handling decimal precision (4 decimal places)
 * Uses integer storage (multiply by 10000) to avoid floating point issues
 */

const PRECISION_MULTIPLIER = 10000;

export function toMinorUnits(amount: number | string): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    throw new Error('Invalid amount');
  }
  return Math.round(num * PRECISION_MULTIPLIER);
}

export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / PRECISION_MULTIPLIER;
}

export function validateAmount(amount: number | string): {
  valid: boolean;
  error?: string;
} {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  // Check decimal places
  const str = typeof amount === 'string' ? amount : amount.toString();
  const decimalIndex = str.indexOf('.');
  if (decimalIndex !== -1) {
    const decimals = str.substring(decimalIndex + 1);
    if (decimals.length > 4) {
      return {
        valid: false,
        error: 'Amount can have at most 4 decimal places',
      };
    }
  }

  return { valid: true };
}

export function formatMoney(amount: number): string {
  return amount.toFixed(4).replace(/\.?0+$/, '');
}
