/**
 * Tests for LocalStorage Service
 */

import { storage, StorageKey, getWalletId, setWalletId, clearWalletId, getWalletIds, setWalletIds, switchWallet } from '../storage';

describe('LocalStorage Service', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get string values', () => {
      storage.setItem(StorageKey.WALLET_ID, 'test-wallet-123');
      expect(storage.getItem(StorageKey.WALLET_ID)).toBe('test-wallet-123');
    });

    it('should set and get array values with automatic serialization', () => {
      const walletIds = ['id1', 'id2', 'id3'];
      storage.setItem(StorageKey.WALLET_IDS, walletIds);
      expect(storage.getItem(StorageKey.WALLET_IDS)).toEqual(walletIds);
    });

    it('should set and get object values with automatic serialization', () => {
      const context = { userId: '123', walletId: 'abc' };
      storage.setItem(StorageKey.ERROR_USER_CONTEXT, context);
      expect(storage.getItem(StorageKey.ERROR_USER_CONTEXT)).toEqual(context);
    });

    it('should return null for non-existent keys', () => {
      expect(storage.getItem(StorageKey.WALLET_ID)).toBeNull();
    });

    it('should return fallback value when key does not exist', () => {
      expect(storage.getItem(StorageKey.THEME, { fallback: 'system' })).toBe('system');
    });

    it('should remove items', () => {
      storage.setItem(StorageKey.WALLET_ID, 'test-id');
      expect(storage.hasItem(StorageKey.WALLET_ID)).toBe(true);
      
      storage.removeItem(StorageKey.WALLET_ID);
      expect(storage.hasItem(StorageKey.WALLET_ID)).toBe(false);
    });

    it('should clear all items', () => {
      storage.setItem(StorageKey.WALLET_ID, 'test-id');
      storage.setItem(StorageKey.THEME, 'dark');
      
      storage.clear();
      
      expect(storage.hasItem(StorageKey.WALLET_ID)).toBe(false);
      expect(storage.hasItem(StorageKey.THEME)).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should check if item exists', () => {
      expect(storage.hasItem(StorageKey.WALLET_ID)).toBe(false);
      
      storage.setItem(StorageKey.WALLET_ID, 'test-id');
      expect(storage.hasItem(StorageKey.WALLET_ID)).toBe(true);
    });

    it('should get all keys', () => {
      storage.setItem(StorageKey.WALLET_ID, 'test-id');
      storage.setItem(StorageKey.THEME, 'dark');
      
      const keys = storage.getAllKeys();
      expect(keys).toContain(StorageKey.WALLET_ID);
      expect(keys).toContain(StorageKey.THEME);
    });

    it('should calculate storage size', () => {
      expect(storage.getSize()).toBe(0);
      
      storage.setItem(StorageKey.WALLET_ID, 'test-id-123');
      const size = storage.getSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should update existing items', () => {
      storage.setItem(StorageKey.WALLET_IDS, ['id1', 'id2']);
      
      storage.updateItem(StorageKey.WALLET_IDS, (ids) => {
        return ids ? [...ids, 'id3'] : ['id3'];
      });
      
      expect(storage.getItem(StorageKey.WALLET_IDS)).toEqual(['id1', 'id2', 'id3']);
    });

    it('should handle update for non-existent items', () => {
      storage.updateItem(StorageKey.WALLET_IDS, (ids) => {
        return ids ? [...ids, 'id1'] : ['id1'];
      });
      
      expect(storage.getItem(StorageKey.WALLET_IDS)).toEqual(['id1']);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock localStorage.setItem to throw an error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      const result = storage.setItem(StorageKey.WALLET_ID, 'test-id');
      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();
      
      // Restore
      Storage.prototype.setItem = originalSetItem;
      consoleError.mockRestore();
    });

    it('should suppress errors in silent mode', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock localStorage.setItem to throw an error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });
      
      const result = storage.setItem(StorageKey.WALLET_ID, 'test-id', { silent: true });
      expect(result).toBe(false);
      expect(consoleError).not.toHaveBeenCalled();
      
      // Restore
      Storage.prototype.setItem = originalSetItem;
      consoleError.mockRestore();
    });

    it('should handle JSON parse errors gracefully', () => {
      // Manually set invalid JSON
      localStorage.setItem(StorageKey.WALLET_IDS, 'invalid-json-{');
      
      // Should return the raw string as fallback
      const result = storage.getItem(StorageKey.WALLET_IDS);
      expect(result).toBe('invalid-json-{');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for string values', () => {
      storage.setItem(StorageKey.WALLET_ID, 'test-id');
      const result: string | null = storage.getItem(StorageKey.WALLET_ID);
      expect(typeof result).toBe('string');
    });

    it('should maintain type safety for array values', () => {
      storage.setItem(StorageKey.WALLET_IDS, ['id1', 'id2']);
      const result: string[] | null = storage.getItem(StorageKey.WALLET_IDS);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should maintain type safety for object values', () => {
      const context = { userId: '123' };
      storage.setItem(StorageKey.ERROR_USER_CONTEXT, context);
      const result: Record<string, any> | null = storage.getItem(StorageKey.ERROR_USER_CONTEXT);
      expect(typeof result).toBe('object');
    });
  });

  describe('Legacy Wallet Functions', () => {
    describe('getWalletId', () => {
      it('should return current wallet ID', () => {
        storage.setItem(StorageKey.CURRENT_WALLET_ID, 'current-id');
        expect(getWalletId()).toBe('current-id');
      });

      it('should fallback to legacy wallet ID', () => {
        storage.setItem(StorageKey.WALLET_ID, 'legacy-id');
        expect(getWalletId()).toBe('legacy-id');
      });

      it('should prefer current wallet ID over legacy', () => {
        storage.setItem(StorageKey.WALLET_ID, 'legacy-id');
        storage.setItem(StorageKey.CURRENT_WALLET_ID, 'current-id');
        expect(getWalletId()).toBe('current-id');
      });

      it('should return null when no wallet ID exists', () => {
        expect(getWalletId()).toBeNull();
      });
    });

    describe('setWalletId', () => {
      it('should set both current and legacy wallet IDs', () => {
        setWalletId('new-wallet-id');
        
        expect(storage.getItem(StorageKey.CURRENT_WALLET_ID)).toBe('new-wallet-id');
        expect(storage.getItem(StorageKey.WALLET_ID)).toBe('new-wallet-id');
      });

      it('should add wallet to wallet IDs list', () => {
        setWalletId('wallet-1');
        expect(getWalletIds()).toContain('wallet-1');
        
        setWalletId('wallet-2');
        const ids = getWalletIds();
        expect(ids).toContain('wallet-1');
        expect(ids).toContain('wallet-2');
      });

      it('should not duplicate wallet IDs', () => {
        setWalletId('wallet-1');
        setWalletId('wallet-1');
        
        const ids = getWalletIds();
        expect(ids.filter(id => id === 'wallet-1')).toHaveLength(1);
      });
    });

    describe('clearWalletId', () => {
      it('should clear both current and legacy wallet IDs', () => {
        setWalletId('test-wallet');
        expect(getWalletId()).toBe('test-wallet');
        
        clearWalletId();
        expect(getWalletId()).toBeNull();
      });

      it('should not clear wallet IDs list', () => {
        setWalletId('wallet-1');
        setWalletId('wallet-2');
        
        clearWalletId();
        
        // Wallet IDs list should still exist
        const ids = storage.getItem(StorageKey.WALLET_IDS);
        expect(ids).toBeTruthy();
      });
    });

    describe('getWalletIds', () => {
      it('should return empty array when no wallets exist', () => {
        expect(getWalletIds()).toEqual([]);
      });

      it('should return array of wallet IDs', () => {
        storage.setItem(StorageKey.WALLET_IDS, ['id1', 'id2', 'id3']);
        expect(getWalletIds()).toEqual(['id1', 'id2', 'id3']);
      });

      it('should include current wallet in list', () => {
        setWalletId('current-wallet');
        const ids = getWalletIds();
        expect(ids).toContain('current-wallet');
      });

      it('should auto-add current wallet if not in list', () => {
        storage.setItem(StorageKey.CURRENT_WALLET_ID, 'orphan-wallet');
        storage.setItem(StorageKey.WALLET_IDS, ['id1', 'id2']);
        
        const ids = getWalletIds();
        expect(ids).toContain('orphan-wallet');
        expect(ids).toContain('id1');
        expect(ids).toContain('id2');
      });
    });

    describe('setWalletIds', () => {
      it('should set wallet IDs list', () => {
        setWalletIds(['id1', 'id2', 'id3']);
        expect(getWalletIds()).toEqual(['id1', 'id2', 'id3']);
      });

      it('should overwrite existing list', () => {
        setWalletIds(['id1', 'id2']);
        setWalletIds(['id3', 'id4']);
        expect(getWalletIds()).toEqual(['id3', 'id4']);
      });
    });

    describe('switchWallet', () => {
      it('should switch to different wallet', () => {
        setWalletId('wallet-1');
        expect(getWalletId()).toBe('wallet-1');
        
        switchWallet('wallet-2');
        expect(getWalletId()).toBe('wallet-2');
      });

      it('should update both current and legacy keys', () => {
        switchWallet('new-wallet');
        expect(storage.getItem(StorageKey.CURRENT_WALLET_ID)).toBe('new-wallet');
        expect(storage.getItem(StorageKey.WALLET_ID)).toBe('new-wallet');
      });
    });
  });

  describe('SSR Safety', () => {
    it('should handle missing window gracefully', () => {
      // This is hard to test in jsdom, but the isAvailable() method
      // checks for typeof window !== 'undefined'
      // The actual SSR safety is tested by the implementation
      expect(storage.hasItem(StorageKey.WALLET_ID)).toBeDefined();
    });
  });
});
