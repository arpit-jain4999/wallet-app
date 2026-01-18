'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { validateAmount } from '@/utils/money';
import {
  ERROR_MESSAGES,
  BUTTON_LABELS,
  PAGE_TITLES,
  FORM_LABELS,
  PLACEHOLDERS,
  LOADING_MESSAGES,
} from '@/constants';
import { TypographyVariant } from '@/lib/enums';

interface WalletSetupCardProps {
  onSubmit: (data: { name: string; balance?: number }) => Promise<any>;
  loading: boolean;
}

export function WalletSetupCard({ onSubmit, loading }: WalletSetupCardProps) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [errors, setErrors] = useState<{ name?: string; balance?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; balance?: string } = {};

    if (!name.trim()) {
      newErrors.name = ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (balance && balance.trim()) {
      const validation = validateAmount(balance);
      if (!validation.valid) {
        newErrors.balance = validation.error;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const balanceNum = balance ? parseFloat(balance) : undefined;
    await onSubmit({ name, balance: balanceNum });
    setName('');
    setBalance('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{PAGE_TITLES.CREATE_WALLET}</CardTitle>
        <CardDescription>
          Enter your name and optional initial balance to create a new wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Typography as="label" htmlFor="name" variant={TypographyVariant.LABEL}>
              {FORM_LABELS.WALLET_NAME.replace(' Name', '')} <span className="text-destructive">*</span>
            </Typography>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder={PLACEHOLDERS.WALLET_NAME.replace('Enter wallet name', 'Enter your name')}
              disabled={loading}
            />
            {errors.name && (
              <Typography variant={TypographyVariant.ERROR}>{errors.name}</Typography>
            )}
          </div>

          <div className="space-y-2">
            <Typography as="label" htmlFor="balance" variant={TypographyVariant.LABEL}>
              {FORM_LABELS.INITIAL_BALANCE}
            </Typography>
            <Input
              id="balance"
              type="number"
              step="0.0001"
              min="0"
              value={balance}
              onChange={(e) => {
                setBalance(e.target.value);
                if (errors.balance) setErrors({ ...errors, balance: undefined });
              }}
              placeholder={PLACEHOLDERS.AMOUNT}
              disabled={loading}
            />
            {errors.balance && (
              <Typography variant={TypographyVariant.ERROR}>{errors.balance}</Typography>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? LOADING_MESSAGES.CREATING_WALLET.replace('...', '') : BUTTON_LABELS.CREATE_WALLET}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

