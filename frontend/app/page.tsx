'use client';

import { useState, useRef } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { useWalletSummary } from '@/hooks/useWalletSummary';
import { WalletSetupCard } from '@/components/wallet/WalletSetupCard';
import { WalletSummary } from '@/components/wallet/WalletSummary';
import { RecentTransactions, RecentTransactionsRef } from '@/components/wallet/RecentTransactions';
import { NewTransactionModal } from '@/components/wallet/NewTransactionModal';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { SkeletonStats } from '@/components/ui/skeleton';
import { Copy, Check, Settings } from 'lucide-react';
import { LOADING_MESSAGES, BUTTON_LABELS } from '@/constants';
import { TypographyVariant, ButtonVariant, ButtonSize } from '@/lib/enums';

export default function HomePage() {
  const {
    wallet,
    loading,
    createWallet,
    executeTransaction,
    resetWallet,
  } = useWalletContext();

  const {
    summary,
    loading: summaryLoading,
    refresh: refreshSummary,
  } = useWalletSummary();

  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [copied, setCopied] = useState(false);
  const recentTransactionsRef = useRef<RecentTransactionsRef>(null);

  const handleTransactionSuccess = async () => {
    await refreshSummary();
    // Refresh the recent transactions table
    recentTransactionsRef.current?.refresh();
  };

  const handleCopy = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show skeleton loader while initializing or loading wallet
  if (loading && !wallet) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
          <SkeletonStats />
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-2xl">
          <WalletSetupCard
            onSubmit={createWallet}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Typography variant={TypographyVariant.H1}>{wallet.name}</Typography>
          <div className="flex items-center gap-2 mt-2">
            <Typography variant={TypographyVariant.MUTED}>Wallet ID:</Typography>
            <Typography variant={TypographyVariant.CODE} className="bg-muted px-2 py-1 rounded">
              {wallet.id}
            </Typography>
            <Button
              variant={ButtonVariant.GHOST}
              size={ButtonSize.ICON}
              onClick={handleCopy}
              className="h-6 w-6"
              title="Copy wallet ID"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={ButtonVariant.OUTLINE}
            size={ButtonSize.SM}
            onClick={() => setShowNewTransaction(true)}
          >
            {BUTTON_LABELS.NEW_TRANSACTION}
          </Button>
        </div>
      </div>

      {/* Summary Section with Skeleton */}
      {summaryLoading ? (
        <SkeletonStats />
      ) : (
        <WalletSummary
          balance={wallet.balance}
          totalCredits={summary.totalCredits}
          totalDebits={summary.totalDebits}
        />
      )}

      {/* Recent Transactions */}
      <RecentTransactions
        ref={recentTransactionsRef}
        onNewTransaction={() => setShowNewTransaction(true)}
      />

      {/* New Transaction Modal */}
      {showNewTransaction && (
        <NewTransactionModal
          onSubmit={async (data) => {
            await executeTransaction(data);
            await handleTransactionSuccess();
          }}
          onClose={() => setShowNewTransaction(false)}
          loading={loading}
        />
      )}
    </div>
  );
}

