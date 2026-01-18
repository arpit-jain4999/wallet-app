'use client';

import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPageNumbers } from '@/utils/pagination';
import { TypographyVariant } from '@/lib/enums';

interface DataGridPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRows: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DataGridPagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalRows,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: DataGridPaginationProps) {
  // Don't show pagination if total rows fit in first page
  if (totalRows <= pageSizeOptions[0]) {
    return null;
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between mt-4 p-4 border-t gap-4" role="navigation" aria-label="Pagination">
      <div className="flex items-center gap-2">
        <Typography variant={TypographyVariant.MUTED} className="text-sm">
          Rows per page:
        </Typography>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={isLoading}
          aria-label="Select rows per page"
        >
          <SelectTrigger className="w-[80px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Typography variant={TypographyVariant.MUTED} className="text-sm" aria-live="polite">
          Page {currentPage} of {totalPages}
        </Typography>
        <div className="flex gap-1" role="group" aria-label="Page navigation">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-muted-foreground"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

              return (
                <Button
                  key={pageNum}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  disabled={isLoading || isActive}
                  className="min-w-[36px]"
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              );
          })}
        </div>
      </div>
    </div>
  );
}
