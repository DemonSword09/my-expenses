// src/db/models.ts
export type UUID = string;

export interface Account {
  id: UUID;
  label: string;
  opening_balance?: number;
  type?: string | null;
  description?: string | null;
  color?: number | null;
  currency_code?: string | null;
}

export interface Payee {
  id: UUID;
  name: string;
}

export interface Category {
  id: UUID;
  label: string;
  parentId?: UUID | null; // hierarchical
  icon?: string | null;
  color?: number | null;
  // removed createdAt / updatedAt per request
}

export interface Transaction {
  id: UUID;
  amount: number;
  // comment maps to previous notes
  comment?: string | null;
  accountId: UUID;
  payeeId?: UUID | null;
  categoryId?: UUID;
  status?: string | null;
  last_modified?: number | null;
  cr_amount?: number | null;
  transaction_type?: string | null;
  createdAt: number; // unix ms - this is the effective 'date' of the transaction
  updatedAt?: number | null; // last modified
  deleted?: 0 | 1;
}

export interface Transfer {
  id: UUID;
  transactionId: UUID;
}
