/**
 * Application Constants
 */

export const PAGINATION_CONFIG = {
  DEFAULT_SKIP: 0,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

/**
 * Export Configuration
 */
export const EXPORT_CONFIG = {
  // Maximum records to export synchronously (below this, export immediately)
  SYNC_THRESHOLD: 1000,
  
  // Batch size for processing large exports
  BATCH_SIZE: 500,
  
  // Maximum records allowed per export
  MAX_RECORDS: 100000,
  
  // Job expiration time (in milliseconds)
  JOB_EXPIRATION: 24 * 60 * 60 * 1000, // 24 hours
};
