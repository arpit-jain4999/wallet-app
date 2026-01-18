'use client';

import { DataGrid } from '@/components/ui/data-grid/DataGrid';
import { ColumnDef } from '@/components/ui/data-grid/types';
import { Transaction } from '@/types/transaction';
import { transactionsService } from '@/services/transactions.service';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { AppLoader } from '@/components/ui/AppLoader';
import { Download } from 'lucide-react';
import { getWalletId } from '@/lib/storage';
import { formatMoney } from '@/utils/money';
import { formatDate } from '@/utils/date';
import { useExport } from '@/hooks/useExport';
import { ExportProgress } from '@/components/transactions/ExportProgress';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  LOADING_MESSAGES,
  ERROR_MESSAGES,
  PAGE_TITLES,
  TABLE_HEADERS,
  PLACEHOLDERS,
  EMPTY_STATE,
  SECTION_TITLES,
} from '@/constants';
import { TypographyVariant, ButtonVariant, ButtonSize } from '@/lib/enums';

export default function TransactionsPage() {
  const walletId = getWalletId();
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  
  // Export hook with SSE support - MUST be called before any early returns
  const {
    startExport,
    cancelExport,
    isExporting,
    progress,
    currentJob,
  } = useExport(walletId || '');

  // Memoize fetchPage to prevent recreation on every render - MUST be called before any early returns
  const fetchTransactionsPage = useCallback(
    transactionsService.fetchTransactionsPage,
    []
  );

  useEffect(() => {
    // Small delay to show loader briefly before checking wallet
    const timer = setTimeout(() => {
      setInitializing(false);
      
      // Redirect to home if no wallet configured
      if (!walletId) {
        toast.error(ERROR_MESSAGES.NO_WALLET_CONFIGURED);
        router.push('/');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [walletId, router]);

  // Show full-page loader while initializing
  if (initializing) {
    return <AppLoader message={LOADING_MESSAGES.FETCHING_TRANSACTIONS} />;
  }

  // Show loader briefly while redirecting
  if (!walletId) {
    return <AppLoader />;
  }

  const columns: ColumnDef<Transaction>[] = [
    {
      id: 'date',
      header: TABLE_HEADERS.DATE,
      field: 'date',
      sortable: true,
      sortField: 'date',
      renderCell: (row) => (
        <Typography variant={TypographyVariant.BODY_SMALL}>{formatDate(row.date)}</Typography>
      ),
    },
    {
      id: 'type',
      header: TABLE_HEADERS.TYPE,
      field: 'type',
      renderCell: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 ${
            row.type === 'CREDIT'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          <Typography variant={TypographyVariant.SMALL} className="font-medium">
            {row.type}
          </Typography>
        </span>
      ),
    },
    {
      id: 'amount',
      header: TABLE_HEADERS.AMOUNT,
      field: 'amount',
      sortable: true,
      sortField: 'amount',
      align: 'right',
      renderCell: (row) => (
        <Typography
          variant={TypographyVariant.BODY_SMALL}
          className={`font-medium ${
            row.type === 'CREDIT'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {row.type === 'CREDIT' ? '+' : '-'}
          {formatMoney(row.amount)}
        </Typography>
      ),
    },
    {
      id: 'balance',
      header: TABLE_HEADERS.BALANCE,
      field: 'balance',
      align: 'right',
      renderCell: (row) => (
        <Typography variant={TypographyVariant.BODY_SMALL}>{formatMoney(row.balance)}</Typography>
      ),
    },
    {
      id: 'description',
      header: TABLE_HEADERS.DESCRIPTION,
      field: 'description',
      searchable: true,
      renderCell: (row) => (
        <Typography variant={TypographyVariant.MUTED} className="text-sm">
          {row.description || '-'}
        </Typography>
      ),
    },
  ];

  const handleExportCSV = async () => {
    if (!walletId) return;
    await startExport();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Export Progress Indicator */}
      <ExportProgress
        job={currentJob}
        progress={progress}
        isExporting={isExporting}
        onCancel={cancelExport}
      />

      <DataGrid<Transaction>
        columns={columns}
        fetchPage={fetchTransactionsPage}
        header={{
          title: PAGE_TITLES.TRANSACTIONS,
          actions: (
            <div className="flex items-center gap-2">
              <Button 
                variant={ButtonVariant.OUTLINE} 
                onClick={handleExportCSV} 
                size={ButtonSize.ICON}
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ),
        }}
        initialState={{
          paging: { pageIndex: 1, pageSize: 10 },
          sort: { field: 'date', order: 'desc' },
        }}
        search={{
          enabled: true,
          placeholder: PLACEHOLDERS.SEARCH_TRANSACTIONS,
          debounceMs: 300,
        }}
        filters={{
          enabled: true,
          type: {
            enabled: true,
            label: SECTION_TITLES.TRANSACTION_TYPE,
          },
          dateRange: {
            enabled: true,
            label: SECTION_TITLES.DATE_RANGE,
          },
        }}
        pagination={{
          pageSizeOptions: [10, 25, 50, 100],
          showPageSizeSelector: true,
        }}
        rowKey={(row) => row.id}
        emptyState={{
          title: EMPTY_STATE.NO_TRANSACTIONS,
          description: EMPTY_STATE.NO_TRANSACTIONS_DESC,
        }}
      />
    </div>
  );
}

