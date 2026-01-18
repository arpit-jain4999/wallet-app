/**
 * UI Text Constants
 * Centralized location for all user-facing text strings
 */

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Wallet errors
  WALLET_NOT_FOUND: 'Wallet not found',
  NO_WALLET_CONFIGURED: 'No wallet configured. Please create a wallet first.',
  WALLET_CREATION_FAILED: 'Failed to create wallet. Please try again.',
  
  // Transaction errors
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  INVALID_AMOUNT: 'Please enter a valid amount',
  AMOUNT_REQUIRED: 'Amount is required',
  AMOUNT_POSITIVE: 'Amount must be greater than 0',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  
  // Data fetching errors
  FETCH_FAILED: 'Failed to fetch data. Please try again.',
  FETCH_TRANSACTIONS_FAILED: 'Failed to load transactions',
  FETCH_SUMMARY_FAILED: 'Failed to load wallet summary',
  
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  
  // Validation errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  INVALID_DATE_RANGE: 'Invalid date range: "From" date cannot be greater than "To" date',
  REQUIRED_FIELD: 'This field is required',
  
  // Export errors
  EXPORT_FAILED: 'Failed to export CSV. Please try again.',
  
  // Generic errors
  SOMETHING_WRONG: 'Something went wrong',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  WALLET_CREATED: 'Wallet created successfully!',
  TRANSACTION_SUCCESS: 'Transaction completed successfully!',
  EXPORT_SUCCESS: 'CSV exported successfully!',
  DATA_LOADED: 'Data loaded successfully',
} as const;

/**
 * Loading Messages
 */
export const LOADING_MESSAGES = {
  LOADING: 'Loading...',
  CREATING_WALLET: 'Creating wallet...',
  PROCESSING_TRANSACTION: 'Processing transaction...',
  FETCHING_DATA: 'Fetching data...',
  FETCHING_TRANSACTIONS: 'Loading transactions...',
  FETCHING_SUMMARY: 'Loading summary...',
  EXPORTING: 'Exporting...',
  PLEASE_WAIT: 'Please wait...',
} as const;

/**
 * Placeholder Text
 */
export const PLACEHOLDERS = {
  // Input placeholders
  WALLET_NAME: 'Enter wallet name',
  INITIAL_BALANCE: 'Enter initial balance (optional)',
  AMOUNT: 'Enter amount',
  DESCRIPTION: 'Enter description (optional)',
  SEARCH: 'Search...',
  SEARCH_TRANSACTIONS: 'Search transactions...',
  SELECT_TYPE: 'Select transaction type',
  SELECT_DATE: 'Select date',
  
  // Dropdown placeholders
  ALL_TYPES: 'All types',
  SELECT_PAGE_SIZE: 'Select rows per page',
} as const;

/**
 * Button Labels
 */
export const BUTTON_LABELS = {
  CREATE_WALLET: 'Create Wallet',
  SUBMIT: 'Submit',
  CANCEL: 'Cancel',
  SAVE: 'Save',
  DELETE: 'Delete',
  EDIT: 'Edit',
  CLOSE: 'Close',
  RETRY: 'Retry',
  BACK: 'Back',
  NEXT: 'Next',
  PREVIOUS: 'Previous',
  EXPORT_CSV: 'Export CSV',
  APPLY_FILTERS: 'Apply Filters',
  CLEAR_FILTERS: 'Clear Filters',
  CREDIT: 'Credit',
  DEBIT: 'Debit',
  NEW_TRANSACTION: 'New Transaction',
} as const;

/**
 * Page Titles
 */
export const PAGE_TITLES = {
  WALLET_OVERVIEW: 'Wallet Overview',
  TRANSACTIONS: 'Transactions',
  TRANSACTION_HISTORY: 'Transaction History',
  CREATE_WALLET: 'Create Wallet',
  WALLET_DETAILS: 'Wallet Details',
} as const;

/**
 * Section Titles
 */
export const SECTION_TITLES = {
  WALLET_SUMMARY: 'Wallet Summary',
  RECENT_TRANSACTIONS: 'Recent Transactions',
  ALL_TRANSACTIONS: 'All Transactions',
  FILTERS: 'Filters',
  TRANSACTION_TYPE: 'Transaction Type',
  DATE_RANGE: 'Date Range',
  NEW_TRANSACTION: 'New Transaction',
} as const;

/**
 * Empty State Messages
 */
export const EMPTY_STATE = {
  NO_TRANSACTIONS: 'No transactions found',
  NO_TRANSACTIONS_DESC: 'Start by making your first transaction.',
  NO_RESULTS: 'No results found',
  NO_RESULTS_DESC: 'Try adjusting your search or filters.',
  NO_DATA: 'No data available',
  NO_DATA_DESC: 'There is no data to display at this time.',
} as const;

/**
 * Form Labels
 */
export const FORM_LABELS = {
  WALLET_NAME: 'Wallet Name',
  INITIAL_BALANCE: 'Initial Balance',
  AMOUNT: 'Amount',
  DESCRIPTION: 'Description',
  TRANSACTION_TYPE: 'Transaction Type',
  DATE: 'Date',
  FROM_DATE: 'From',
  TO_DATE: 'To',
  SEARCH: 'Search',
} as const;

/**
 * Table Headers
 */
export const TABLE_HEADERS = {
  DATE: 'Date',
  TYPE: 'Type',
  AMOUNT: 'Amount',
  BALANCE: 'Balance',
  DESCRIPTION: 'Description',
  ACTIONS: 'Actions',
  ID: 'ID',
} as const;

/**
 * Summary Labels
 */
export const SUMMARY_LABELS = {
  SUMMARY: 'Summary',
  AVAILABLE_BALANCE: 'Available Balance',
  TOTAL_BALANCE: 'Total balance remaining',
  TOTAL_CREDITS: 'Total credits',
  TOTAL_DEBITS: 'Total debits',
  TOTAL_TRANSACTIONS: 'Total Transactions',
  NET_CHANGE: 'Net Change',
} as const;

/**
 * Pagination Text
 */
export const PAGINATION_TEXT = {
  ROWS_PER_PAGE: 'Rows per page:',
  PAGE_OF: 'Page {current} of {total}',
  SHOWING: 'Showing {from} to {to} of {total} results',
} as const;

/**
 * Navigation Labels
 */
export const NAV_LABELS = {
  HOME: 'Home',
  WALLET: 'Wallet',
  TRANSACTIONS: 'Transactions',
  SETTINGS: 'Settings',
  LOGOUT: 'Logout',
} as const;

/**
 * Confirmation Messages
 */
export const CONFIRMATIONS = {
  DELETE_TRANSACTION: 'Are you sure you want to delete this transaction?',
  DELETE_WALLET: 'Are you sure you want to delete this wallet?',
  CLEAR_FILTERS: 'Are you sure you want to clear all filters?',
} as const;

/**
 * Helper function to replace placeholders in text
 * @example formatText(PAGINATION_TEXT.PAGE_OF, { current: 1, total: 10 })
 */
export function formatText(
  text: string,
  replacements: Record<string, string | number>
): string {
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    text
  );
}

/**
 * Type exports for better intellisense
 */
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
export type SuccessMessage = typeof SUCCESS_MESSAGES[keyof typeof SUCCESS_MESSAGES];
export type LoadingMessage = typeof LOADING_MESSAGES[keyof typeof LOADING_MESSAGES];
export type Placeholder = typeof PLACEHOLDERS[keyof typeof PLACEHOLDERS];
export type ButtonLabel = typeof BUTTON_LABELS[keyof typeof BUTTON_LABELS];
