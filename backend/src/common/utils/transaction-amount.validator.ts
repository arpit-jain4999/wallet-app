import { BadRequestException } from '@nestjs/common';
import { validateAmount } from './money.util';

/**
 * Transaction Amount Validator
 * 
 * Utility class for validating transaction amounts with consistent error handling.
 * Can be used as a static class or instantiated.
 */
export class TransactionAmountValidator {
  /**
   * Validates a transaction amount and throws BadRequestException if invalid
   * 
   * @param amount - Transaction amount to validate
   * @throws {BadRequestException} If amount is invalid
   * 
   * @example
   * ```ts
   * TransactionAmountValidator.validate(10.5); // OK
   * TransactionAmountValidator.validate(0); // Throws BadRequestException
   * ```
   */
  static validate(amount: number | string): void {
    const validation = validateAmount(typeof amount === 'number' ? Math.abs(amount) : amount);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }
  }

  /**
   * Validates a transaction amount and returns validation result
   * 
   * @param amount - Transaction amount to validate
   * @returns Validation result with valid flag and optional error message
   * 
   * @example
   * ```ts
   * const result = TransactionAmountValidator.validateSafe(10.5);
   * if (!result.valid) {
   *   console.error(result.error);
   * }
   * ```
   */
  static validateSafe(amount: number | string): {
    valid: boolean;
    error?: string;
  } {
    return validateAmount(typeof amount === 'number' ? Math.abs(amount) : amount);
  }
}
