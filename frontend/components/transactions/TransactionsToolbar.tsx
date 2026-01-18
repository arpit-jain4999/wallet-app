'use client';

import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Download } from 'lucide-react';
import { TypographyVariant, ButtonVariant } from '@/lib/enums';

interface TransactionsToolbarProps {
  onExport: () => void;
  exportLoading?: boolean;
}

export function TransactionsToolbar({
  onExport,
  exportLoading = false,
}: TransactionsToolbarProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <Typography variant={TypographyVariant.H2}>Transactions</Typography>
      <Button
        variant={ButtonVariant.OUTLINE}
        onClick={onExport}
        disabled={exportLoading}
      >
        <Download className="h-4 w-4 mr-2" />
        {exportLoading ? 'Exporting...' : 'Export CSV'}
      </Button>
    </div>
  );
}

