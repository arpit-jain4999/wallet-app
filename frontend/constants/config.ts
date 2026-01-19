/**
 * Configuration Constants
 * Application-wide configuration values
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://wallet-app-production-02e5.up.railway.app',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Pagination Configuration
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_VISIBLE_PAGES: 7,
  MIN_PAGE: 1,
} as const;

/**
 * Search Configuration
 */
export const SEARCH_CONFIG = {
  DEBOUNCE_MS: 300,
  MIN_SEARCH_LENGTH: 0,
  MAX_SEARCH_LENGTH: 100,
} as const;

/**
 * Money Configuration
 */
export const MONEY_CONFIG = {
  DECIMAL_PLACES: 4,
  PRECISION_MULTIPLIER: 10000,
  MAX_AMOUNT: 999999999.9999,
  MIN_AMOUNT: 0.0001,
  DEFAULT_CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
} as const;

/**
 * Date Configuration
 */
export const DATE_CONFIG = {
  DEFAULT_FORMAT: 'MMM dd, yyyy',
  LONG_FORMAT: 'MMMM dd, yyyy, hh:mm a',
  SHORT_FORMAT: 'MM/dd/yyyy',
  TIME_FORMAT: 'hh:mm a',
  ISO_FORMAT: 'yyyy-MM-dd',
} as const;

/**
 * Animation Configuration
 */
export const ANIMATION_CONFIG = {
  DURATION_FAST: 150,
  DURATION_NORMAL: 300,
  DURATION_SLOW: 500,
  EASING: 'ease-in-out',
} as const;

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
  WALLET_NAME_MIN_LENGTH: 1,
  WALLET_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  AMOUNT_DECIMAL_PLACES: 4,
} as const;

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  WALLET_ID: 'walletId',
  THEME: 'theme',
  USER_PREFERENCES: 'userPreferences',
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  TOAST_DURATION: 3000, // 3 seconds
  LOADER_DELAY: 200, // Show loader after 200ms
  MOBILE_BREAKPOINT: 768, // px
  TABLET_BREAKPOINT: 1024, // px
} as const;

/**
 * Transaction Configuration
 */
export const TRANSACTION_CONFIG = {
  RECENT_LIMIT: 10,
  DEFAULT_SORT_BY: 'date',
  DEFAULT_SORT_ORDER: 'desc',
  TYPES: ['CREDIT', 'DEBIT'] as const,
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  ENABLE_EXPORT: true,
  ENABLE_FILTERS: true,
  ENABLE_SEARCH: true,
  ENABLE_SORTING: true,
  ENABLE_PAGINATION: true,
  ENABLE_MOBILE_NAV: true,
} as const;

/**
 * Route Paths
 */
export const ROUTES = {
  HOME: '/',
  TRANSACTIONS: '/transactions',
  SETTINGS: '/settings',
  WALLET: '/wallet',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Type exports
 */
export type Route = typeof ROUTES[keyof typeof ROUTES];
export type TransactionType = typeof TRANSACTION_CONFIG.TYPES[number];
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
