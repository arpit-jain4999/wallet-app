'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/utils/money';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { ButtonVariant, ButtonSize } from '@/lib/enums';

interface WalletOverviewCardProps {
  walletId: string;
  name: string;
  balance: number;
  onReset: () => void;
}

export function WalletOverviewCard({
  walletId,
  name,
  balance,
  onReset,
}: WalletOverviewCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>Wallet Overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Wallet ID
          </label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
              {walletId}
            </code>
            <Button
              variant={ButtonVariant.OUTLINE}
              size={ButtonSize.ICON}
              onClick={handleCopy}
              title="Copy wallet ID"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Current Balance
          </label>
          <p className="text-3xl font-bold mt-1">{formatMoney(balance)}</p>
        </div>

        <div className="pt-2 border-t">
          <Button
            variant={ButtonVariant.GHOST}
            size={ButtonSize.SM}
            onClick={onReset}
            className="text-muted-foreground"
          >
            Reset wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

