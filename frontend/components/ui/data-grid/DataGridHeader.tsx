'use client';

import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Search as SearchIcon } from 'lucide-react';
import { DataGridFilters } from './DataGridFilters';
import { FilterState, FilterOptions } from './types';
import { TypographyVariant } from '@/lib/enums';

interface DataGridHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  searchEnabled?: boolean;
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtersEnabled?: boolean;
  filterOptions?: FilterOptions;
  currentFilters?: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function DataGridHeader({
  title,
  subtitle,
  actions,
  searchEnabled,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  filtersEnabled,
  filterOptions,
  currentFilters,
  onFiltersChange,
}: DataGridHeaderProps) {
  const hasFilters = filtersEnabled && (filterOptions?.type?.enabled || filterOptions?.dateRange?.enabled);

  return (
    <div className="p-4 border-b">
      {/* Desktop Layout: Title + Search + Actions in one row */}
      <div className="hidden md:flex items-center justify-between gap-4">
        {title && (
          <div className="flex-shrink-0">
            <Typography variant={TypographyVariant.H3}>{title}</Typography>
            {subtitle && (
              <Typography variant={TypographyVariant.MUTED} className="text-sm mt-1">
                {subtitle}
              </Typography>
            )}
          </div>
        )}
        {searchEnabled && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder || 'Search...'}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasFilters && (
            <DataGridFilters
              filterOptions={filterOptions}
              currentFilters={currentFilters}
              onFiltersChange={onFiltersChange}
            />
          )}
          {actions && <>{actions}</>}
        </div>
      </div>

      {/* Mobile Layout: Title + Actions, then Search below */}
      <div className="flex md:hidden flex-col gap-4">
        {(title || actions || hasFilters) && (
          <div className="flex items-center justify-between">
            {title && (
              <div>
                <Typography variant={TypographyVariant.H3}>{title}</Typography>
                {subtitle && (
                  <Typography variant={TypographyVariant.MUTED} className="text-sm mt-1">
                    {subtitle}
                  </Typography>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              {hasFilters && (
                <DataGridFilters
                  filterOptions={filterOptions}
                  currentFilters={currentFilters}
                  onFiltersChange={onFiltersChange}
                />
              )}
              {actions && <>{actions}</>}
            </div>
          </div>
        )}
        {searchEnabled && (
          <div>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder || 'Search...'}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
