/**
 * Constants Index
 * Central export point for all constants
 */

// Messages
export {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
  PLACEHOLDERS,
  BUTTON_LABELS,
  PAGE_TITLES,
  SECTION_TITLES,
  EMPTY_STATE,
  FORM_LABELS,
  TABLE_HEADERS,
  SUMMARY_LABELS,
  PAGINATION_TEXT,
  NAV_LABELS,
  CONFIRMATIONS,
  formatText,
} from './messages';

export type {
  ErrorMessage,
  SuccessMessage,
  LoadingMessage,
  Placeholder,
  ButtonLabel,
} from './messages';

// Configuration
export {
  API_CONFIG,
  PAGINATION_CONFIG,
  SEARCH_CONFIG,
  MONEY_CONFIG,
  DATE_CONFIG,
  ANIMATION_CONFIG,
  VALIDATION_RULES,
  STORAGE_KEYS,
  UI_CONFIG,
  TRANSACTION_CONFIG,
  FEATURES,
  ROUTES,
  HTTP_STATUS,
} from './config';

export type {
  Route,
  TransactionType,
  StorageKey,
} from './config';
