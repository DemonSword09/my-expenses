// src/db/repositories/TransactionRepo.ts
import { all, run, first } from '../sqlite';
import type { Payee, Transaction } from '../models';
import { uuidSync } from '../../utils/uuid';

const DEFAULT_ACCOUNT_LABEL = 'Default Account';
const DEFAULT_ACCOUNT_CURRENCY = 'INR';

async function ensureDefaultAccount(): Promise<string> {
  // check if any account exists
  const r = await first<any>('SELECT id FROM accounts LIMIT 1');
  if (r && r.id) return r.id;

  // create default account
  const id = uuidSync();
  await run(
    `INSERT INTO accounts (id, label, opening_balance, type, description, color, currency_code)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      DEFAULT_ACCOUNT_LABEL,
      0,
      'checking',
      'Auto-created default account',
      0,
      DEFAULT_ACCOUNT_CURRENCY,
    ],
  );
  return id;
}

export const TransactionRepo = {
  async addPayee(partial: Partial<Payee>): Promise<Payee> {
    const id = partial.id ?? uuidSync();
    const name = (partial.name ?? '').trim();
    if (!name) throw new Error('Payee name required');

    // Try to insert, but avoid duplicates by name (case-insensitive works if you configured the DB that way)
    // Use INSERT OR IGNORE to avoid unique constraint error, then SELECT the row.
    await run(`INSERT OR IGNORE INTO payees (id, name) VALUES (?, ?)`, [id, name]);

    // If the insert was ignored because a payee with the same name exists, fetch that existing row.
    // We select by name (exact match). If you want case-insensitive matching, use COLLATE NOCASE in SQL.
    const existing = await first<{ id: string; name: string }>(
      `SELECT id, name FROM payees WHERE name = ? LIMIT 1`,
      [name],
    );

    if (existing) {
      return { id: existing.id, name: existing.name } as Payee;
    }

    // If not found (unlikely), return the row we tried to insert
    return { id, name } as Payee;
  },

  async create(partial: Partial<Transaction>): Promise<Transaction> {
    const nowMs = Date.now();
    const id = partial.id ?? uuidSync();
    const accountId = partial.accountId ?? (await ensureDefaultAccount());

    const t: Transaction = {
      id,
      amount: partial.amount ?? 0,
      comment: partial.comment ?? null,
      accountId,
      payeeId: partial.payeeId ?? null,
      categoryId: partial.categoryId,
      status: partial.status ?? null,
      cr_amount: partial.cr_amount ?? null,
      transaction_type: partial.transaction_type ?? 'EXPENSE',
      createdAt: partial.createdAt ?? nowMs,
      updatedAt: partial.updatedAt ?? nowMs,
      deleted: 0,
    };

    await run(
      `INSERT INTO transactions
      (id, amount, comment, accountId, payeeId, categoryId, status, cr_amount, transaction_type, createdAt, updatedAt, deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.amount,
        t.comment,
        t.accountId,
        t.payeeId,
        t.categoryId,
        t.status,
        t.cr_amount,
        t.transaction_type,
        t.createdAt,
        t.updatedAt,
        t.deleted,
      ],
    );

    return t;
  },

  async listAll(): Promise<Transaction[]> {
    const rows = await all<any>(
      'SELECT * FROM transactions WHERE deleted = 0 ORDER BY createdAt DESC',
    );
    return rows.map((r: any) => ({
      id: r.id,
      amount: r.amount,
      comment: r.comment ?? null,
      accountId: r.accountId,
      payeeId: r.payeeId ?? null,
      categoryId: r.categoryId ?? null,
      status: r.status ?? null,
      last_modified: r.last_modified ?? null,
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
    })) as Transaction[];
  },

  async findById(id: string): Promise<Transaction | null> {
    const r = await first<any>('SELECT * FROM transactions WHERE id = ? LIMIT 1', [id]);
    if (!r) return null;
    return {
      id: r.id,
      amount: r.amount,
      comment: r.comment ?? null,
      accountId: r.accountId,
      payeeId: r.payeeId ?? null,
      categoryId: r.categoryId ?? null,
      status: r.status ?? null,
      last_modified: r.last_modified ?? null,
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
    } as Transaction;
  },
};
