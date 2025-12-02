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
  categoryId?: UUID | null;
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

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  template_json: string; // JSON string of Partial<Transaction>
  is_recurring: 0 | 1;
  recurring_rule_id?: string | null;
  created_at: number;
  updated_at: number;
  // joined fields
  next_date?: number | null;
  human_readable?: string | null;
  cron_expression?: string | null;
  timezone?: string | null;
}

export interface RecurringRule {
  id: string;
  cron_expression: string;
  timezone?: string | null;
  human_readable?: string | null;
  template_json: string;
  next_date: number; // epoch ms UTC
  end_date?: number | null;
  enabled: 0 | 1;
  created_at: number;
  updated_at: number;
}
