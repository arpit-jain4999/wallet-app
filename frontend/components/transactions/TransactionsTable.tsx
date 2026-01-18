'use client';

import { Transaction } from '@/types/transaction';
import { formatMoney } from '@/utils/money';
import { formatDate } from '@/utils/date';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Loading } from '@/components/ui/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState, useEffect, useRef } from 'react';
import { TypographyVariant, ButtonVariant } from '@/lib/enums';

interface TransactionsTableProps {
  transactions: Transaction[];
  loading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  // Optional props for different use cases
  showSearch?: boolean;
  showHeader?: boolean;
  headerTitle?: string;
  headerActions?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
  // Search props
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  totalCount?: number;
}

export function TransactionsTable({
  transactions,
  loading,
  sortBy,
  sortOrder,
  onSort,
  showSearch = false,
  showHeader = false,
  headerTitle,
  headerActions,
  emptyMessage = 'No transactions found',
  className = '',
  searchQuery: externalSearchQuery,
  onSearchChange,
  totalCount,
}: TransactionsTableProps) {
  // Initialize local state from external search query if provided
  const [localSearchQuery, setLocalSearchQuery] = useState(
    externalSearchQuery !== undefined ? externalSearchQuery : ''
  );
  console.log('transactions', transactions);
  const displayCount = totalCount !== undefined ? totalCount : transactions.length;
  
  // Use ref to store the latest onSearchChange callback to avoid resetting debounce
  const onSearchChangeRef = useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Track if this is the initial mount to avoid firing debounce on mount
  const isInitialMount = useRef(true);

  // Sync external search query to local state when it changes externally (e.g., from parent)
  useEffect(() => {
    if (externalSearchQuery !== undefined && externalSearchQuery !== localSearchQuery) {
      setLocalSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery, localSearchQuery]);

  // Debounce search input for backend search
  useEffect(() => {
    // Skip debounce on initial mount (when search query is empty or matches external)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If there's an initial search query, we should still trigger it after mount
      if (localSearchQuery && onSearchChangeRef.current) {
        const timer = setTimeout(() => {
          onSearchChangeRef.current?.(localSearchQuery);
        }, 300);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (!onSearchChangeRef.current) return;
    
    const timer = setTimeout(() => {
      onSearchChangeRef.current?.(localSearchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchQuery]); // Removed onSearchChange from deps to prevent debounce reset

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1 inline" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 inline" />
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <div className={`border rounded-lg p-8 ${className}`}>
        <Loading message="Loading transactions..." />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`border rounded-lg p-8 text-center ${className}`}>
        <Typography variant={TypographyVariant.MUTED}>{emptyMessage}</Typography>
      </div>
    );
  }

  return (
    <div className={`bg-background border rounded-lg overflow-hidden relative ${className}`}>
      {/* Loading overlay when loading with existing data */}
      {loading && transactions.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loading size="md" />
        </div>
      )}
      {(showHeader || showSearch) && (
        <div className="p-4 border-b flex items-center justify-between gap-4">
          {showHeader && (
            <div className="flex items-center gap-4 flex-1">
              {headerTitle && (
                <Typography variant={TypographyVariant.H3}>
                  {headerTitle} {showSearch && totalCount !== undefined && `(${displayCount})`}
                </Typography>
              )}
              {showSearch && (
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Find a transaction"
                      value={localSearchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {showSearch && !showHeader && (
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Find a transaction"
                  value={localSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant={ButtonVariant.GHOST}
                size="sm"
                onClick={() => onSort('date')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Date
                <SortIcon field="date" />
              </Button>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>
              <Button
                variant={ButtonVariant.GHOST}
                size="sm"
                onClick={() => onSort('amount')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Amount
                <SortIcon field="amount" />
              </Button>
            </TableHead>
            <TableHead>Balance after</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx: Transaction) => (
            <TableRow key={tx.id}>
              <TableCell>
                <Typography variant={TypographyVariant.BODY_SMALL}>{formatDate(tx.date)}</Typography>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 ${
                    tx.type === 'CREDIT'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  <Typography variant={TypographyVariant.SMALL} className="font-medium">
                    {tx.type}
                  </Typography>
                </span>
              </TableCell>
              <TableCell>
                <Typography
                  variant={TypographyVariant.BODY_SMALL}
                  className={`font-medium ${
                    tx.type === 'CREDIT'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {tx.type === 'CREDIT' ? '+' : '-'}
                  {formatMoney(tx.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant={TypographyVariant.BODY_SMALL}>{formatMoney(tx.balance)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant={TypographyVariant.MUTED} className="text-sm">
                  {tx.description || '-'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
