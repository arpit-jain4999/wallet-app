export type TransactionType = 'CREDIT' | 'DEBIT';

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  balance: number;
  description?: string;
  date: string | Date;
  type: TransactionType;
}

export interface TransactionRequest {
  amount: number;
  description?: string;
}

