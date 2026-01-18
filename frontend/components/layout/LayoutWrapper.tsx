'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { AppHeader } from './AppHeader';
import { getWalletId } from '@/lib/storage';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

// Custom event names for wallet state changes
const WALLET_STORAGE_EVENT = 'walletStorageChange';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const pathname = usePathname();

  const checkWallet = () => {
    const walletId = getWalletId();
    setHasWallet(!!walletId);
  };

  useEffect(() => {
    // Check if wallet exists in localStorage on mount
    checkWallet();

    // Listen for custom wallet storage events (fired when wallet is created/deleted)
    const handleWalletChange = () => {
      checkWallet();
    };

    window.addEventListener(WALLET_STORAGE_EVENT, handleWalletChange);

    // Also listen for storage events (for cross-tab updates)
    window.addEventListener('storage', handleWalletChange);

    return () => {
      window.removeEventListener(WALLET_STORAGE_EVENT, handleWalletChange);
      window.removeEventListener('storage', handleWalletChange);
    };
  }, []);

  // Re-check when route changes (e.g., navigation)
  useEffect(() => {
    checkWallet();
  }, [pathname]);

  // Don't render until we've checked localStorage
  if (hasWallet === null) {
    return null;
  }

  if (!hasWallet) {
    // No wallet - render only the main content without sidebar/header
    return (
      <ErrorBoundary>
        <div className="flex h-screen overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Has wallet - render full layout with sidebar and header
  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </ErrorBoundary>
  );
}
