/**
 * Money Utility Functions
 * 
 * Handles money formatting, parsing, and validation with 4 decimal precision.
 * Uses integer storage (multiply by 10000) to avoid floating point issues.
 * 
 * @module utils/money
 */

const PRECISION_MULTIPLIER = 10000; // 4 decimal places
const MAX_DECIMALS = 4;

/**
 * Convert major units (dollars) to minor units (cents * 100)
 * 
 * @param amount - Amount in major units (e.g., 10.50)
 * @returns Amount in minor units (e.g., 105000)
 * 
 * @example
 * toMinorUnits(10.5) // returns 105000
 * toMinorUnits(0.0001) // returns 1
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * PRECISION_MULTIPLIER);
}

/**
 * Convert minor units to major units
 * 
 * @param minorUnits - Amount in minor units (e.g., 105000)
 * @returns Amount in major units (e.g., 10.50)
 * 
 * @example
 * fromMinorUnits(105000) // returns 10.5
 * fromMinorUnits(1) // returns 0.0001
 */
export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / PRECISION_MULTIPLIER;
}

/**
 * Format a number as money string (removes trailing zeros)
 * 
 * @param amount - Amount to format
 * @returns Formatted money string
 * 
 * @example
 * formatMoney(10) // returns "10"
 * formatMoney(10.5) // returns "10.5"
 * formatMoney(10.1234) // returns "10.1234"
 * formatMoney(10.1000) // returns "10.1"
 */
export function formatMoney(amount: number): string {
  return amount.toFixed(MAX_DECIMALS).replace(/\.?0+$/, '');
}

/**
 * Validate an amount string or number
 * 
 * @param amount - Amount to validate (string or number)
 * @returns Validation result with error message if invalid
 * 
 * @example
 * validateAmount("10.50") // returns { valid: true }
 * validateAmount("10.12345") // returns { valid: false, error: "..." }
 * validateAmount("-10") // returns { valid: false, error: "..." }
 */
export function validateAmount(amount: string | number): {
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
    if (decimals.length > MAX_DECIMALS) {
      return {
        valid: false,
        error: `Amount can have at most ${MAX_DECIMALS} decimal places`,
      };
    }
  }

  return { valid: true };
}
