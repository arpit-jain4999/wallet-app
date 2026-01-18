'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Wallet } from '@/types/wallet';
import { CreateWalletRequest } from '@/types/wallet';
import { TransactionRequest } from '@/types/transaction';

interface WalletContextType {
  wallet: Wallet | null;
  loading: boolean;
  error: string | null;
  createWallet: (data: CreateWalletRequest) => Promise<any>;
  executeTransaction: (data: TransactionRequest) => Promise<any>;
  resetWallet: () => void;
  loadWallet: (walletId: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const walletData = useWallet();

  return (
    <WalletContext.Provider value={walletData}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
