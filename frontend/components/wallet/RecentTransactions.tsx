'use client';

import React, { useCallback, useImperativeHandle, forwardRef, useRef } from 'react';
import { DataGrid } from '@/components/ui/data-grid/DataGrid';
import { ColumnDef, DataGridRef } from '@/components/ui/data-grid/types';
import { Transaction } from '@/types/transaction';
import { transactionsService } from '@/services/transactions.service';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { formatMoney } from '@/utils/money';
import { formatDate } from '@/utils/date';
import {
  TABLE_HEADERS,
  SECTION_TITLES,
  PLACEHOLDERS,
  EMPTY_STATE,
} from '@/constants';
import { TypographyVariant } from '@/lib/enums';

interface RecentTransactionsProps {
  onNewTransaction: () => void;
}

export interface RecentTransactionsRef {
  refresh: () => void;
}

export const RecentTransactions = forwardRef<RecentTransactionsRef, RecentTransactionsProps>(
  function RecentTransactions(
    { onNewTransaction },
    ref,
  ) {
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

  // Create a custom fetchPage that always returns only top 10 transactions
  // Memoize to prevent recreation on every render
  const fetchTop10Transactions = useCallback(async (params: any) => {
    const result = await transactionsService.fetchTransactionsPage({
      ...params,
      query: {
        ...params.query,
        paging: { pageIndex: 1, pageSize: 10 }, // Always limit to 10
      },
    });
    // Return only 10 items regardless of pagination
    return {
      rows: result.rows.slice(0, 10),
      totalRows: Math.min(result.totalRows, 10), // Set total to 10 so pagination is hidden
    };
  }, []);

  // Ref for DataGrid to expose refetch
  const dataGridRef = useRef<DataGridRef<Transaction>>(null);

  // Expose refresh function via ref
  useImperativeHandle(ref, () => ({
    refresh: () => {
      dataGridRef.current?.refetch();
    },
  }), []);

  return (
    <DataGrid<Transaction>
      ref={dataGridRef}
      columns={columns}
      fetchPage={fetchTop10Transactions}
      header={{
        title: SECTION_TITLES.RECENT_TRANSACTIONS,
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
      pagination={{
        pageSizeOptions: [10],
        showPageSizeSelector: false, // Hide pagination for recent transactions
      }}
      rowKey={(row) => row.id}
      emptyState={{
        title: EMPTY_STATE.NO_TRANSACTIONS,
        description: EMPTY_STATE.NO_TRANSACTIONS_DESC,
      }}
    />
  );
});

