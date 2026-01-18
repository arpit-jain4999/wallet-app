/**
 * Skeleton Component
 * 
 * Provides skeleton loading placeholders for better perceived performance.
 * Based on shadcn/ui skeleton component.
 */

import { cn } from '@/lib/utils';

/**
 * Skeleton component for loading states
 * 
 * @example
 * <Skeleton className="h-4 w-full" />
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

/**
 * Skeleton for card content
 */
function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for table rows
 */
function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for wallet summary stats
 */
function SkeletonStats() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for transaction list
 */
function SkeletonTransactionList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-6 w-[80px]" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for data grid
 */
function SkeletonDataGrid() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      
      {/* Search bar */}
      <Skeleton className="h-10 w-full max-w-sm" />
      
      {/* Table */}
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <SkeletonTable rows={10} />
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonStats,
  SkeletonTransactionList,
  SkeletonDataGrid,
};
