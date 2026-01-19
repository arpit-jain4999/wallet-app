'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GridState,
  GridQuery,
  GridResult,
  FetchGridPage,
  SortOrder,
  FilterState,
} from '@/components/ui/data-grid/types';

/**
 * Custom hook for managing data grid state and operations
 * 
 * Provides server-side pagination, sorting, filtering, and search with debouncing.
 * Handles request cancellation, loading states, and error handling automatically.
 * 
 * Features:
 * - Server-side pagination with configurable page size
 * - Multi-column sorting with cycle (none -> asc -> desc)
 * - Debounced search (default 300ms) to reduce API calls
 * - Filtering support (type, date range, etc.)
 * - Automatic request cancellation on state changes
 * - Loading and error states
 * 
 * @template T - Type of data rows in the grid
 * 
 * @param {Object} args - Hook configuration
 * @param {FetchGridPage<T>} args.fetchPage - Function to fetch page data from server
 * @param {Partial<GridState<T>>} [args.initialState] - Initial grid state (pagination, sort, filters)
 * @param {string[]} [args.searchableFields] - Fields to search in (if search enabled)
 * @param {number} [args.debounceMs=300] - Search debounce delay in milliseconds
 * 
 * @returns {Object} Data grid hook return value
 * @returns {T[]} rows - Current page data rows
 * @returns {number} totalRows - Total number of rows across all pages
 * @returns {boolean} isLoading - True if data is being fetched
 * @returns {Error | null} error - Error object if fetch failed, null otherwise
 * @returns {GridState<T>} state - Current grid state (pagination, sort, filters)
 * @returns {Function} setPage - Change current page (1-indexed)
 * @returns {Function} setPageSize - Change page size (resets to page 1)
 * @returns {Function} setSearchQuery - Update search query (debounced)
 * @returns {string} searchQuery - Current search input value
 * @returns {Function} setSort - Cycle sort for a field (none -> asc -> desc -> none)
 * @returns {Function} setFilters - Update filters (resets to page 1)
 * @returns {Function} refetch - Manually refetch current page data
 * 
 * @example
 * ```tsx
 * const { rows, totalRows, isLoading, setPage, setPageSize, setSort } = useDataGrid({
 *   fetchPage: transactionsService.fetchTransactionsPage,
 *   initialState: { paging: { pageIndex: 1, pageSize: 25 } },
 *   searchableFields: ['description'],
 *   debounceMs: 300
 * });
 * 
 * // Change page
 * setPage(2);
 * 
 * // Sort by date
 * setSort('date');
 * ```
 */
export function useDataGrid<T>(args: {
  fetchPage: FetchGridPage<T>;
  initialState?: Partial<GridState<T>>;
  searchableFields?: string[];
  debounceMs?: number;
}) {
  const { fetchPage, initialState, searchableFields, debounceMs = 300 } = args;

  const [gridState, setGridState] = useState<GridState<T>>({
    paging: {
      pageIndex: 1,
      pageSize: 10,
      ...initialState?.paging,
    },
    sort: initialState?.sort,
    search: initialState?.search,
    filters: initialState?.filters,
  });

  const [data, setData] = useState<T[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track search input separately for debouncing
  const [searchInput, setSearchInput] = useState(
    initialState?.search?.query || ''
  );

  // Refresh counter to force refetch
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Store fetchPage in a ref to avoid infinite loops from dependency changes
  const fetchPageRef = useRef(fetchPage);
  const searchableFieldsRef = useRef(searchableFields);

  // Update refs when they change (but don't trigger effect)
  useEffect(() => {
    fetchPageRef.current = fetchPage;
    searchableFieldsRef.current = searchableFields;
  }, [fetchPage, searchableFields]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setGridState((prev) => ({
        ...prev,
        search: searchInput.trim()
          ? { query: searchInput.trim() }
          : undefined,
        paging: { ...prev.paging, pageIndex: 1 }, // Reset to first page on search
      }));
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchInput, debounceMs]);

  // Fetch data when grid state changes
  useEffect(() => {
    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const query: GridQuery<T> = {
          paging: gridState.paging,
          sort: gridState.sort,
          search: gridState.search,
          filters: gridState.filters,
        };

        const result = await fetchPageRef.current({
          query,
          searchableFields: searchableFieldsRef.current,
          signal: abortController.signal,
        });

        // Only update if request wasn't aborted
        if (!abortController.signal.aborted) {
          if (result && Array.isArray(result.rows)) {
            setData(result.rows);
            setTotalRows(result.totalRows ?? 0);
          } else {
            setData([]);
            setTotalRows(0);
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          const error =
            err instanceof Error
              ? err
              : new Error('Failed to load data');
          setError(error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      abortController.abort();
    };
  }, [gridState, refreshCounter]);

  const setPage = useCallback((pageIndex: number) => {
    setGridState((prev) => ({
      ...prev,
      paging: { ...prev.paging, pageIndex },
    }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setGridState((prev) => ({
      ...prev,
      paging: { pageIndex: 1, pageSize }, // Reset to first page
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchInput(query);
  }, []);

  const setSort = useCallback((field: keyof T | string) => {
    setGridState((prev) => {
      const currentSort = prev.sort;
      
      // Cycle: none -> asc -> desc
      if (!currentSort || currentSort.field !== field) {
        return {
          ...prev,
          sort: { field, order: 'asc' },
        };
      }

      if (currentSort.order === 'asc') {
        return {
          ...prev,
          sort: { field, order: 'desc' },
        };
      }

      // desc -> none (remove sort)
      return {
        ...prev,
        sort: undefined,
      };
    });
  }, []);

  const setFilters = useCallback((filters: FilterState) => {
    setGridState((prev) => ({
      ...prev,
      filters,
      paging: { ...prev.paging, pageIndex: 1 }, // Reset to first page on filter change
    }));
  }, []);

  const refetch = useCallback(() => {
    // Increment refresh counter to trigger useEffect
    setRefreshCounter((prev) => prev + 1);
  }, []);

  return {
    // Data
    rows: data,
    totalRows,
    isLoading,
    error,

    // State
    state: gridState,

    // Actions
    setPage,
    setPageSize,
    setSearchQuery,
    searchQuery: searchInput,
    setSort,
    setFilters,
    refetch,
  };
}
