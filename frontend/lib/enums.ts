/**
 * Enum definitions for frontend
 */

/**
 * Transaction types
 */
export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  ALL = 'ALL',
}

/**
 * Sort orders
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Button variants
 */
export enum ButtonVariant {
  DEFAULT = 'default',
  OUTLINE = 'outline',
  GHOST = 'ghost',
  DESTRUCTIVE = 'destructive',
  SECONDARY = 'secondary',
  LINK = 'link',
}

/**
 * Button sizes
 */
export enum ButtonSize {
  DEFAULT = 'default',
  SM = 'sm',
  LG = 'lg',
  ICON = 'icon',
}

/**
 * Typography variants
 */
export enum TypographyVariant {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  P = 'p',
  BODY = 'body',
  BODY_SMALL = 'bodySmall',
  BLOCKQUOTE = 'blockquote',
  INLINE_CODE = 'inlineCode',
  CODE = 'code',
  LEAD = 'lead',
  LARGE = 'large',
  SMALL = 'small',
  MUTED = 'muted',
  LABEL = 'label',
  CAPTION = 'caption',
  ERROR = 'error',
}

/**
 * Local storage keys
 */
export enum StorageKey {
  WALLET_ID = 'walletId',
  THEME = 'theme',
}

/**
 * API endpoints
 */
export enum ApiEndpoint {
  SETUP = '/setup',
  WALLET = '/wallet',
  TRANSACT = '/transact',
  TRANSACTIONS = '/transactions',
  TRANSACTIONS_EXPORT = '/transactions/export',
  SUMMARY = '/summary',
  HEALTH = '/health',
}

/**
 * Error messages
 */
export enum ErrorMessage {
  WALLET_NOT_FOUND = 'Wallet not found',
  NO_WALLET_CONFIGURED = 'No wallet configured. Please create a wallet first.',
  TRANSACTION_FAILED = 'Transaction failed. Please try again.',
  FETCH_FAILED = 'Failed to fetch data. Please try again.',
  NETWORK_ERROR = 'Network error. Please check your connection.',
  VALIDATION_ERROR = 'Please check your input and try again.',
  INSUFFICIENT_BALANCE = 'Insufficient balance',
  INVALID_AMOUNT = 'Please enter a valid amount',
  INVALID_DATE_RANGE = 'Invalid date range: "From" date cannot be greater than "To" date',
}

/**
 * Success messages
 */
export enum SuccessMessage {
  WALLET_CREATED = 'Wallet created successfully!',
  TRANSACTION_SUCCESS = 'Transaction completed successfully!',
  EXPORT_SUCCESS = 'CSV exported successfully!',
}

/**
 * Loading messages
 */
export enum LoadingMessage {
  LOADING = 'Loading...',
  CREATING_WALLET = 'Creating wallet...',
  PROCESSING_TRANSACTION = 'Processing transaction...',
  FETCHING_DATA = 'Fetching data...',
  EXPORTING = 'Exporting...',
}

/**
 * Table sort fields
 */
export enum TransactionSortField {
  DATE = 'date',
  AMOUNT = 'amount',
  TYPE = 'type',
  DESCRIPTION = 'description',
}

/**
 * Filter types
 */
export enum FilterType {
  TYPE = 'type',
  DATE_RANGE = 'dateRange',
  SEARCH = 'search',
}

/**
 * HTTP methods
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

/**
 * Content types
 */
export enum ContentType {
  JSON = 'application/json',
  CSV = 'text/csv',
  FORM_DATA = 'multipart/form-data',
}
