'use client';

import { memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ColumnDef, SortOrder } from './types';
import { ButtonVariant } from '@/lib/enums';

/**
 * Sort icon component (memoized for performance)
 */
const SortIcon = memo(function SortIcon({
  field,
  sortField,
  sort,
}: {
  field: string;
  sortField?: string;
  sort?: { field: string | number | symbol; order: SortOrder };
}) {
  const isActive = String(sort?.field) === (sortField || field);
  if (!isActive || !sort) {
    return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
  }
  return sort.order === 'asc' ? (
    <ArrowUp className="h-4 w-4 ml-1 inline" />
  ) : (
    <ArrowDown className="h-4 w-4 ml-1 inline" />
  );
});

interface DataGridTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  sort?: { field: string | number | symbol; order: SortOrder };
  onSort: (field: string) => void;
}

export function DataGridTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  sort,
  onSort,
}: DataGridTableProps<T>) {
  return (
    <div className="overflow-x-auto" role="region" aria-label="Data table">
      <Table role="table">
        <TableHeader>
          <TableRow role="row">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                style={{
                  width: column.width,
                  textAlign: column.align || 'left',
                }}
                role="columnheader"
                aria-sort={
                  sort?.field === (column.sortField || column.field || column.id)
                    ? sort.order === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {column.sortable ? (
                  <Button
                    variant={ButtonVariant.GHOST}
                    size="sm"
                    onClick={() => onSort(String(column.sortField || column.field || column.id))}
                    className="h-auto p-0 font-medium hover:bg-transparent"
                    aria-label={`Sort by ${column.header}`}
                  >
                    {column.header}
                    <SortIcon
                      field={column.id}
                      sortField={column.sortField || (column.field as string)}
                      sort={sort}
                    />
                  </Button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody role="rowgroup">
          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
              role="row"
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  style={{
                    textAlign: column.align || 'left',
                  }}
                  role="cell"
                >
                  {column.renderCell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
