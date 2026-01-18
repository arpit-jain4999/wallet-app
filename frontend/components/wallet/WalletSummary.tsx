'use client';

import { formatMoney } from '@/utils/money';
import { Typography } from '@/components/ui/typography';
import { SUMMARY_LABELS } from '@/constants';
import { TypographyVariant } from '@/lib/enums';

interface WalletSummaryProps {
  balance: number;
  totalCredits: number;
  totalDebits: number;
}

export function WalletSummary({
  balance,
  totalCredits,
  totalDebits,
}: WalletSummaryProps) {
  return (
    <div className="bg-background border rounded-lg p-6 mb-6">
      <Typography variant={TypographyVariant.H3} className="mb-4">
        {SUMMARY_LABELS.SUMMARY}
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Typography variant={TypographyVariant.CAPTION} className="mb-1">
            {SUMMARY_LABELS.TOTAL_BALANCE}
          </Typography>
          <Typography variant={TypographyVariant.LARGE} className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {formatMoney(balance)}
          </Typography>
        </div>
        <div>
          <Typography variant={TypographyVariant.CAPTION} className="mb-1">
            {SUMMARY_LABELS.TOTAL_CREDITS}
          </Typography>
          <Typography variant={TypographyVariant.LARGE} className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400">
            {formatMoney(totalCredits)}
          </Typography>
        </div>
        <div>
          <Typography variant={TypographyVariant.CAPTION} className="mb-1">
            {SUMMARY_LABELS.TOTAL_DEBITS}
          </Typography>
          <Typography variant={TypographyVariant.LARGE} className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-600 dark:text-red-400">
            {formatMoney(totalDebits)}
          </Typography>
        </div>
      </div>
    </div>
  );
}

