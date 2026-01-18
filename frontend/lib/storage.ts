/**
 * Central LocalStorage Service
 * 
 * Provides a type-safe, centralized interface for all localStorage operations.
 * Includes error handling, serialization, and SSR safety.
 */

/**
 * Storage keys enum for type safety
 */
export enum StorageKey {
  // Wallet related
  WALLET_ID = 'walletId',
  CURRENT_WALLET_ID = 'currentWalletId',
  WALLET_IDS = 'walletIds',
  
  // Error tracking
  ERROR_LOGS = 'error_logs',
  ERROR_USER_CONTEXT = '__ERROR_USER_CONTEXT__',
  ERROR_BREADCRUMBS = '__ERROR_BREADCRUMBS__',
  
  // UI preferences
  THEME = 'theme',
  SIDEBAR_COLLAPSED = 'sidebarCollapsed',
}

/**
 * Storage item type definitions
 */
interface StorageTypes {
  [StorageKey.WALLET_ID]: string;
  [StorageKey.CURRENT_WALLET_ID]: string;
  [StorageKey.WALLET_IDS]: string[];
  [StorageKey.ERROR_LOGS]: any[];
  [StorageKey.ERROR_USER_CONTEXT]: Record<string, any>;
  [StorageKey.ERROR_BREADCRUMBS]: any[];
  [StorageKey.THEME]: 'light' | 'dark' | 'system';
  [StorageKey.SIDEBAR_COLLAPSED]: boolean;
}

/**
 * Storage service options
 */
interface StorageOptions {
  silent?: boolean;
  fallback?: any;
}

/**
 * Central LocalStorage Service
 */
class LocalStorageService {
  /**
   * Check if localStorage is available (client-side)
   */
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  /**
   * Handle storage errors
   */
  private handleError(error: unknown, operation: string, key: string, options?: StorageOptions): void {
    if (!options?.silent) {
      console.error(`[LocalStorage] ${operation} failed for key "${key}":`, error);
    }
  }

  /**
   * Get item from localStorage with type safety
   */
  getItem<K extends StorageKey>(
    key: K,
    options?: StorageOptions
  ): StorageTypes[K] | null {
    if (!this.isAvailable()) {
      return options?.fallback ?? null;
    }

    try {
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        return options?.fallback ?? null;
      }

      try {
        return JSON.parse(item) as StorageTypes[K];
      } catch {
        return item as StorageTypes[K];
      }
    } catch (error) {
      this.handleError(error, 'getItem', key, options);
      return options?.fallback ?? null;
    }
  }

  /**
   * Set item in localStorage with automatic serialization
   */
  setItem<K extends StorageKey>(
    key: K,
    value: StorageTypes[K],
    options?: StorageOptions
  ): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const serialized = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
      
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      this.handleError(error, 'setItem', key, options);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: StorageKey, options?: StorageOptions): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      this.handleError(error, 'removeItem', key, options);
      return false;
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear(options?: StorageOptions): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      this.handleError(error, 'clear', 'all', options);
      return false;
    }
  }

  /**
   * Check if a key exists in localStorage
   */
  hasItem(key: StorageKey): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return window.localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  getAllKeys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      return Object.keys(window.localStorage);
    } catch {
      return [];
    }
  }

  /**
   * Get storage size in bytes (approximate)
   */
  getSize(): number {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      let size = 0;
      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          const value = window.localStorage.getItem(key) || '';
          size += key.length + value.length;
        }
      }
      return size * 2;
    } catch {
      return 0;
    }
  }

  /**
   * Update an existing item with a partial value
   */
  updateItem<K extends StorageKey>(
    key: K,
    updater: (current: StorageTypes[K] | null) => StorageTypes[K],
    options?: StorageOptions
  ): boolean {
    const current = this.getItem(key, options);
    const updated = updater(current);
    return this.setItem(key, updated, options);
  }
}

// Singleton instance
export const storage = new LocalStorageService();

// Legacy wallet storage functions
/**
 * Get current wallet ID
 * Checks CURRENT_WALLET_ID first, then falls back to WALLET_ID for backward compatibility
 */
export function getWalletId(): string | null {
  const current = storage.getItem(StorageKey.CURRENT_WALLET_ID);
  if (current) return current;
  
  // Backward compatibility: check legacy WALLET_ID key
  const legacy = storage.getItem(StorageKey.WALLET_ID);
  if (legacy) {
    // Migrate to CURRENT_WALLET_ID
    storage.setItem(StorageKey.CURRENT_WALLET_ID, legacy);
    storage.removeItem(StorageKey.WALLET_ID);
    return legacy;
  }
  
  return null;
}

/**
 * Set current wallet ID
 * Uses only CURRENT_WALLET_ID as single source of truth
 * Removes legacy keys for cleanup
 */
export function setWalletId(walletId: string): void {
  // Single source of truth
  storage.setItem(StorageKey.CURRENT_WALLET_ID, walletId);
  
  // Clean up legacy keys (no longer needed)
  storage.removeItem(StorageKey.WALLET_ID);
  storage.removeItem(StorageKey.WALLET_IDS);
  
  // Dispatch custom event to notify layout and other components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('walletStorageChange'));
  }
}

/**
 * Clear current wallet ID
 * Removes all wallet-related keys
 */
export function clearWalletId(): void {
  storage.removeItem(StorageKey.CURRENT_WALLET_ID);
  storage.removeItem(StorageKey.WALLET_ID); // Clean up legacy
  storage.removeItem(StorageKey.WALLET_IDS); // Clean up legacy
  
  // Dispatch custom event to notify layout and other components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('walletStorageChange'));
  }
}


export default storage;
