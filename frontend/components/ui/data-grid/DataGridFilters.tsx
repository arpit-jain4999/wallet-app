'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter } from 'lucide-react';
import { toast } from 'sonner';
import { FilterState, FilterOptions } from './types';
import { TransactionType, ErrorMessage, TypographyVariant, ButtonVariant, ButtonSize } from '@/lib/enums';

interface DataGridFiltersProps {
  filterOptions?: FilterOptions;
  currentFilters?: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function DataGridFilters({
  filterOptions,
  currentFilters,
  onFiltersChange,
}: DataGridFiltersProps) {
  const hasActiveFilters =
    currentFilters?.type ||
    currentFilters?.dateRange?.from ||
    currentFilters?.dateRange?.to;

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    const newDate = value ? new Date(value) : undefined;
    const otherField = field === 'from' ? 'to' : 'from';
    const otherDate = currentFilters?.dateRange?.[otherField]
      ? typeof currentFilters.dateRange[otherField] === 'string'
        ? new Date(currentFilters.dateRange[otherField] as string)
        : currentFilters.dateRange[otherField]
      : undefined;

    // Validate: fromDate cannot be greater than toDate
    if (field === 'from' && newDate && otherDate && newDate > otherDate) {
      toast.error(ErrorMessage.INVALID_DATE_RANGE);
      return;
    }
    if (field === 'to' && newDate && otherDate && otherDate > newDate) {
      toast.error(ErrorMessage.INVALID_DATE_RANGE);
      return;
    }

    onFiltersChange({
      ...currentFilters,
      dateRange: {
        ...currentFilters?.dateRange,
        [field]: newDate,
      },
    });
  };

  const formatDateValue = (date?: Date | string) => {
    if (!date) return '';
    return typeof date === 'string'
      ? date.split('T')[0]
      : new Date(date).toISOString().split('T')[0];
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={ButtonVariant.OUTLINE} size={ButtonSize.ICON} className="relative">
          <Filter className="h-4 w-4" />
          {hasActiveFilters && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <Typography variant={TypographyVariant.H4}>Filters</Typography>

          {/* Transaction Type Filter */}
          {filterOptions?.type?.enabled && (
            <div className="space-y-2">
              <Typography variant={TypographyVariant.SMALL} className="font-medium">
                Transaction Type
              </Typography>
              <Select
                value={currentFilters?.type || TransactionType.ALL}
                onValueChange={(value) => {
                  onFiltersChange({
                    ...currentFilters,
                    type: value === TransactionType.ALL ? undefined : (value as TransactionType.CREDIT | TransactionType.DEBIT),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TransactionType.ALL}>All types</SelectItem>
                  <SelectItem value={TransactionType.CREDIT}>Credit</SelectItem>
                  <SelectItem value={TransactionType.DEBIT}>Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range Filter */}
          {filterOptions?.dateRange?.enabled && (
            <div className="space-y-2">
              <Typography variant={TypographyVariant.SMALL} className="font-medium">
                Date Range
              </Typography>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Typography variant={TypographyVariant.SMALL} className="text-muted-foreground">
                    From
                  </Typography>
                  <Input
                    type="date"
                    value={formatDateValue(currentFilters?.dateRange?.from)}
                    max={formatDateValue(currentFilters?.dateRange?.to)}
                    onChange={(e) => handleDateChange('from', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Typography variant={TypographyVariant.SMALL} className="text-muted-foreground">
                    To
                  </Typography>
                  <Input
                    type="date"
                    value={formatDateValue(currentFilters?.dateRange?.to)}
                    min={formatDateValue(currentFilters?.dateRange?.from)}
                    onChange={(e) => handleDateChange('to', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
