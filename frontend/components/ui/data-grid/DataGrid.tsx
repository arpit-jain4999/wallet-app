'use client';

import { useDataGrid } from '@/hooks/useDataGrid';
import { DataGridProps } from './types';
import { Loading } from '@/components/ui/loading';
import { SkeletonDataGrid } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DataGridHeader } from './DataGridHeader';
import { DataGridTable } from './DataGridTable';
import { DataGridPagination } from './DataGridPagination';
import {
  LOADING_MESSAGES,
  EMPTY_STATE,
  BUTTON_LABELS,
} from '@/constants';
import { TypographyVariant, ButtonVariant } from '@/lib/enums';

/**
 * DataGrid - A powerful, reusable data table component
 * 
 * Features:
 * - Server-side pagination
 * - Sorting
 * - Global search with debounce
 * - Filtering (type, date range)
 * - Loading states with skeletons
 * - Error handling
 * - Empty state
 * - Responsive design
 * - Customizable columns
 */
export function DataGrid<T>({
  columns,
  fetchPage,
  header,
  initialState,
  search = { enabled: false },
  pagination = { pageSizeOptions: [10, 25, 50, 100], showPageSizeSelector: true },
  filters,
  rowKey,
  onRowClick,
  emptyState,
  className,
}: DataGridProps<T>) {
  // Extract searchable fields from columns
  const searchableFields = columns
    .filter((col) => col.searchable)
    .map((col) => col.field || col.id)
    .filter((f): f is string => !!f);

  // Use the DataGrid hook for state management
  const {
    rows,
    totalRows,
    isLoading,
    error,
    state,
    setPage,
    setPageSize,
    setSearchQuery,
    searchQuery,
    setSort,
    setFilters,
    refetch,
  } = useDataGrid<T>({
    fetchPage,
    initialState,
    searchableFields,
    debounceMs: search.debounceMs || 300,
  });

  console.log('isLoading', isLoading, rows);

  const totalPages = Math.ceil(totalRows / state.paging.pageSize);
  const currentPage = state.paging.pageIndex;

  // Initial loading state - show skeleton
  if (isLoading && rows.length === 0) {
    return (
      <div className={cn(className)}>
        <SkeletonDataGrid />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('border rounded-lg p-8 text-center', className)}>
        <Typography variant={TypographyVariant.H3} className="mb-2">
          {emptyState?.title || EMPTY_STATE.NO_DATA}
        </Typography>
        <Typography variant={TypographyVariant.MUTED} className="mb-4">
          {error.message || emptyState?.description}
        </Typography>
        <Button onClick={refetch} variant={ButtonVariant.OUTLINE}>
          {BUTTON_LABELS.RETRY}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('bg-background border rounded-lg overflow-hidden relative', className)}>
      {/* Loading overlay when loading with existing data (pagination/sort/search) */}
      {isLoading && rows.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loading size="md" />
        </div>
      )}

      {/* Header Section */}
      {(header || search.enabled || filters?.enabled) && (
        <DataGridHeader
          title={header?.title}
          subtitle={header?.subtitle}
          actions={header?.actions}
          searchEnabled={search.enabled}
          searchPlaceholder={search.placeholder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filtersEnabled={filters?.enabled}
          filterOptions={filters}
          currentFilters={state.filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Toolbar Section */}
      {header?.toolbar && (
        <div className="p-4 border-b">
          {header.toolbar}
        </div>
      )}

      {/* Empty State */}
      {rows.length === 0 && !isLoading && (
        <div className="border rounded-lg p-8 text-center">
          {emptyState?.icon}
          <Typography variant={TypographyVariant.H3} className="mb-2">
            {emptyState?.title || EMPTY_STATE.NO_DATA}
          </Typography>
          <Typography variant={TypographyVariant.MUTED}>
            {emptyState?.description || EMPTY_STATE.NO_DATA_DESC}
          </Typography>
        </div>
      )}

      {/* Table Section */}
      {rows.length > 0 && (
        <>
          <DataGridTable
            columns={columns}
            rows={rows}
            rowKey={rowKey}
            onRowClick={onRowClick}
            sort={state.sort}
            onSort={setSort}
          />

          {/* Pagination Section */}
          {pagination.showPageSizeSelector !== false && (
            <DataGridPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={state.paging.pageSize}
              pageSizeOptions={pagination.pageSizeOptions || [10, 25, 50, 100]}
              totalRows={totalRows}
              isLoading={isLoading}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </>
      )}
    </div>
  );
}
