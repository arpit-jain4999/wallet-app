import { ReactNode } from 'react';

export type SortOrder = 'asc' | 'desc';

export type SortState<T> = {
  field: keyof T | string;
  order: SortOrder;
};

export type SearchState = {
  query: string;
};

export type PageState = {
  pageIndex: number; // 1-based
  pageSize: number;
};

export type FilterState = {
  type?: 'CREDIT' | 'DEBIT';
  dateRange?: {
    from?: Date | string;
    to?: Date | string;
  };
  // extensible: add more filters here
};

export type GridState<T> = {
  paging: PageState;
  sort?: SortState<T>;
  search?: SearchState;
  filters?: FilterState;
};

export type GridQuery<T> = {
  paging: PageState;
  sort?: SortState<T>;
  search?: SearchState;
  filters?: FilterState;
};

export type GridResult<T> = {
  rows: T[];
  totalRows: number; // total matching rows on server
};

export type ColumnDef<T> = {
  id: string; // stable id for UI + sorting
  header: string | ReactNode;

  // How to read value for sorting/searching, if needed
  field?: keyof T | string;

  // Cell renderer (preferred)
  renderCell: (row: T) => ReactNode;

  // Optional UI props
  width?: number | string;
  align?: 'left' | 'center' | 'right';

  // Capabilities
  sortable?: boolean;
  searchable?: boolean;

  // Optional override for sort field (if different from field/id)
  sortField?: string;
};

export type GridHeaderConfig = {
  title?: string;
  subtitle?: string;

  // Right side actions (e.g. Export CSV button)
  actions?: ReactNode;

  // Optional: extra toolbar row under title
  toolbar?: ReactNode;
};

export type FetchGridPage<T> = (params: {
  query: GridQuery<T>;

  // Helps server know what fields are searchable
  searchableFields?: string[];

  // Abort support
  signal?: AbortSignal;
}) => Promise<GridResult<T>>;

export type PaginationOptions = {
  pageSizeOptions?: number[]; // default [10, 20, 50]
  showPageSizeSelector?: boolean; // default true
};

export type SearchOptions = {
  enabled?: boolean;
  placeholder?: string; // default "Search..."
  debounceMs?: number; // default 300
};

export type EmptyStateConfig = {
  title?: string; // default "No data"
  description?: string; // default "Try adjusting your search or filters."
  icon?: ReactNode;
};

export type ErrorStateConfig = {
  title?: string; // default "Something went wrong"
  description?: string; // default from error message
  retryLabel?: string; // default "Retry"
};

export type FilterOptions = {
  enabled?: boolean;
  type?: {
    enabled?: boolean;
    label?: string;
  };
  dateRange?: {
    enabled?: boolean;
    label?: string;
  };
};

export type DataGridProps<T> = {
  columns: ColumnDef<T>[];
  fetchPage: FetchGridPage<T>;

  header?: GridHeaderConfig;

  // State
  initialState?: Partial<GridState<T>>;

  // UX
  search?: SearchOptions;
  pagination?: PaginationOptions;
  filters?: FilterOptions;

  // Row behaviors
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;

  // UI states
  emptyState?: EmptyStateConfig;

  className?: string;
};
