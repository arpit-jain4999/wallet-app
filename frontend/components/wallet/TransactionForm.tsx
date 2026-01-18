'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { validateAmount } from '@/utils/money';
import {
  ERROR_MESSAGES,
  BUTTON_LABELS,
  FORM_LABELS,
  PLACEHOLDERS,
  LOADING_MESSAGES,
  SECTION_TITLES,
} from '@/constants';

interface TransactionFormProps {
  onSubmit: (data: { amount: number; description?: string }) => Promise<any>;
  loading: boolean;
}

export function TransactionForm({ onSubmit, loading }: TransactionFormProps) {
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
      setAmount('');
      setDescription('');
    } catch (err) {
      // Error is handled by the hook and shown via toast
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Transaction</CardTitle>
        <CardDescription>Add funds or withdraw from your wallet</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Tabs value={type} onValueChange={(v) => setType(v as 'CREDIT' | 'DEBIT')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="CREDIT">Credit</TabsTrigger>
                <TabsTrigger value="DEBIT">Debit</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount <span className="text-destructive">*</span>
            </label>
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
              placeholder="0.0000"
              disabled={loading}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Transaction description"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            variant={type === 'DEBIT' ? 'destructive' : 'default'}
          >
            {loading
              ? 'Processing...'
              : type === 'CREDIT'
              ? 'Add Funds'
              : 'Withdraw'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

