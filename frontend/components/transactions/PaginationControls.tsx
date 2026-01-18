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
import { TypographyVariant } from '@/lib/enums';

interface PaginationControlsProps {
  skip: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading: boolean;
}

export function PaginationControls({
  skip,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
}: PaginationControlsProps) {
  const currentPage = Math.floor(skip / pageSize) + 1;
  const totalPages = Math.ceil(total / pageSize);

  // Don't show pagination if total items is less than or equal to pageSize
  if (total <= pageSize) {
    return null;
  }

  // Calculate which page numbers to show (max 7 pages visible)
  const getPageNumbers = () => {
    const maxVisible = 7;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between mt-4 gap-4">
      <div className="flex items-center gap-2">
        <Typography variant={TypographyVariant.MUTED} className="text-sm">
          Rows per page:
        </Typography>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={loading}
        >
          <SelectTrigger className="w-[80px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Typography variant={TypographyVariant.MUTED} className="text-sm">
          Page {currentPage} of {totalPages}
        </Typography>
        <div className="flex gap-1">
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
                disabled={loading || isActive}
                className="min-w-[36px]"
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

