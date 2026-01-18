export interface Wallet {
  id: string;
  name: string;
  balance: number;
  date: string | Date;
}

export interface CreateWalletRequest {
  name: string;
  balance?: number;
}

