/**
 * Application-wide constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// Search
export const SEARCH = {
  DEBOUNCE_MS: 300,
  MIN_SEARCH_LENGTH: 0,
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy, HH:mm',
  ISO: 'yyyy-MM-dd',
} as const;

// Money
export const MONEY = {
  DECIMAL_PLACES: 4,
  MINOR_UNIT_MULTIPLIER: 10000, // For 4 decimal places
  CURRENCY_SYMBOL: '$',
} as const;

// UI
export const UI = {
  TOAST_DURATION: 3000,
  LOADING_DELAY: 100, // Delay before showing loader
  ANIMATION_DURATION: 200,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_ID: 'walletId',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  WALLET_NOT_FOUND: 'Wallet not found.',
  INSUFFICIENT_BALANCE: 'Insufficient balance.',
  INVALID_AMOUNT: 'Invalid amount.',
  INVALID_DATE_RANGE: 'Invalid date range: "from" date cannot be greater than "to" date.',
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_CSV_EXPORT: true,
  ENABLE_FILTERS: true,
  ENABLE_SEARCH: true,
  ENABLE_SORTING: true,
} as const;
