'use client';

import { useWalletContext } from '@/contexts/WalletContext';
import { Typography } from '@/components/ui/typography';
import { formatMoney } from '@/utils/money';
import { TypographyVariant } from '@/lib/enums';

export function AppHeader() {
  const { wallet } = useWalletContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {wallet && (
          <>
            <Typography variant={TypographyVariant.H3} className="font-semibold">
              {wallet.name}
            </Typography>
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
              <Typography variant={TypographyVariant.SMALL} className="text-muted-foreground">
                Balance:
              </Typography>
              <Typography variant={TypographyVariant.H4} className="font-semibold">
                {formatMoney(wallet.balance)}
              </Typography>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
