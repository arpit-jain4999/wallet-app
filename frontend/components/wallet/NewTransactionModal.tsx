'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { validateAmount } from '@/utils/money';
import { X } from 'lucide-react';
import {
  ERROR_MESSAGES,
  BUTTON_LABELS,
  FORM_LABELS,
  PLACEHOLDERS,
  LOADING_MESSAGES,
  SECTION_TITLES,
} from '@/constants';
import { TypographyVariant, ButtonVariant } from '@/lib/enums';

interface NewTransactionModalProps {
  onSubmit: (data: { amount: number; description?: string }) => Promise<any>;
  onClose: () => void;
  loading: boolean;
}

export function NewTransactionModal({
  onSubmit,
  onClose,
  loading,
}: NewTransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || !amount.trim()) {
      setError(ERROR_MESSAGES.AMOUNT_REQUIRED);
      return;
    }

    const validation = validateAmount(amount);
    if (!validation.valid) {
      setError(validation.error || ERROR_MESSAGES.INVALID_AMOUNT);
      return;
    }

    const amountNum = parseFloat(amount);
    const transactionAmount = type === 'CREDIT' ? amountNum : -amountNum;

    try {
      await onSubmit({
        amount: transactionAmount,
        description: description || undefined,
      });
      onClose();
      setAmount('');
      setDescription('');
    } catch (err) {
      // Error is handled by the hook and shown via toast
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{SECTION_TITLES.NEW_TRANSACTION}</CardTitle>
            <CardDescription>Add funds or withdraw from your wallet</CardDescription>
          </div>
          <Button
            variant={ButtonVariant.GHOST}
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Tabs value={type} onValueChange={(v) => setType(v as 'CREDIT' | 'DEBIT')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="CREDIT">{BUTTON_LABELS.CREDIT}</TabsTrigger>
                  <TabsTrigger value="DEBIT">{BUTTON_LABELS.DEBIT}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Typography as="label" htmlFor="amount" variant={TypographyVariant.LABEL}>
                {FORM_LABELS.AMOUNT} <span className="text-destructive">*</span>
              </Typography>
              <Input
                id="amount"
                type="number"
                step="0.0001"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={PLACEHOLDERS.AMOUNT}
                disabled={loading}
              />
              {error && <Typography variant={TypographyVariant.ERROR}>{error}</Typography>}
            </div>

            <div className="space-y-2">
              <Typography as="label" htmlFor="description" variant={TypographyVariant.LABEL}>
                {FORM_LABELS.DESCRIPTION}
              </Typography>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={PLACEHOLDERS.DESCRIPTION}
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={ButtonVariant.OUTLINE}
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                {BUTTON_LABELS.CANCEL}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
                variant={type === 'DEBIT' ? 'destructive' : 'default'}
              >
                {loading
                  ? LOADING_MESSAGES.PROCESSING_TRANSACTION
                  : type === 'CREDIT'
                  ? 'Add Funds'
                  : 'Withdraw'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

