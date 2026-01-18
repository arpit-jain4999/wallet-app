/**
 * Enum definitions for backend
 */

/**
 * Transaction types
 */
export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

/**
 * Sort orders for queries
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Sort fields for transactions
 */
export enum TransactionSortField {
  DATE = 'date',
  AMOUNT = 'amountMinorUnits',
}

/**
 * Health check status
 */
export enum HealthStatus {
  OK = 'ok',
  ERROR = 'error',
}

/**
 * HTTP Status Messages
 */
export enum HttpMessage {
  WALLET_NOT_FOUND = 'Wallet not found',
  INSUFFICIENT_BALANCE = 'Insufficient balance',
  INVALID_AMOUNT = 'Invalid amount',
  INVALID_WALLET_ID = 'Invalid wallet ID',
  TRANSACTION_FAILED = 'Transaction failed',
  INTERNAL_ERROR = 'Internal server error',
}

/**
 * Validation Messages
 */
export enum ValidationMessage {
  NAME_REQUIRED = 'Name is required',
  NAME_MIN_LENGTH = 'Name must be at least 1 character',
  BALANCE_MIN = 'Balance must be at least 0',
  AMOUNT_REQUIRED = 'Amount is required',
  AMOUNT_INVALID = 'Amount must be a valid number',
  DESCRIPTION_MAX_LENGTH = 'Description cannot exceed 500 characters',
}
