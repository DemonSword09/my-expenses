// src/db/repositories/TransactionRepo.ts

import { all, run, first } from '../sqlite';
import type { Transaction, Payee, TransactionDetail } from '../models';
import { uuidSync } from '../../utils/uuid';

const DEFAULT_ACCOUNT_LABEL = 'Default Account';
const DEFAULT_ACCOUNT_CURRENCY = 'USD';

async function ensureDefaultAccount(): Promise<string> {
  const r = await first<any>('SELECT id FROM accounts LIMIT 1');
  if (r && r.id) return r.id;

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
  // create a transaction (or used for clone)
  async create(partial: Partial<Transaction>): Promise<Transaction> {
    const nowMs = Date.now();
    const id = partial.id ?? uuidSync();
    const accountId = partial.accountId ?? (await ensureDefaultAccount());

    const t: Transaction = {
      id,
      amount: Math.abs(partial.amount ?? 0),
      comment: partial.comment ?? null,
      accountId,
      payeeId: partial.payeeId ?? null,
      categoryId: partial.categoryId ?? undefined,
      status: partial.status ?? null,
      cr_amount: partial.cr_amount ?? null,
      transaction_type: partial.transaction_type ?? 'EXPENSE',
      createdAt: partial.createdAt ?? nowMs,
      updatedAt: partial.updatedAt ?? nowMs,
      deleted: 0,
      recurring_rule_id: partial.recurring_rule_id ?? null,
    };

    await run(
      `INSERT INTO transactions
      (id, amount, comment, accountId, payeeId, categoryId, status, cr_amount, transaction_type, createdAt, updatedAt, deleted, recurring_rule_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        t.recurring_rule_id ?? null,
      ],
    );
    // const a = first('select * from transactions where id = ?', [t.id]);
    // console.log(a);

    return t;
  },

  async listAll(): Promise<Transaction[]> {
    const rows = await all<any>('SELECT * FROM transactions WHERE deleted = 0 ORDER BY createdAt DESC');
    return (rows || []).map((r: any) => ({
      id: r.id,
      amount: r.amount,
      comment: r.comment ?? null,
      accountId: r.accountId,
      payeeId: r.payeeId ?? null,
      categoryId: r.categoryId ?? null,
      status: r.status ?? null,
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
      recurring_rule_id: r.recurring_rule_id,
    })) as Transaction[];
  },

  async listWithDetails(): Promise<TransactionDetail[]> {
    const sql = `
      SELECT t.*, 
             p.name as payee_name, 
             c.label as category_label, 
             c.icon as category_icon,
             c.color as category_color,
             parent.label as parent_category_label
      FROM transactions t
      LEFT JOIN payees p ON t.payeeId = p.id
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN categories parent ON c.parentId = parent.id
      WHERE t.deleted = 0 
      ORDER BY t.createdAt DESC
    `;
    const rows = await all<any>(sql);
    return (rows || []).map((r: any) => ({
      id: r.id,
      amount: r.amount,
      comment: r.comment ?? null,
      accountId: r.accountId,
      payeeId: r.payeeId ?? null,
      categoryId: r.categoryId ?? null,
      status: r.status ?? null,
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
      recurring_rule_id: r.recurring_rule_id,
      payee_name: r.payee_name ?? null,
      category_label: r.category_label ?? null,
      category_parent_label: r.parent_category_label ?? null,
      category_icon: r.category_icon ?? null,
      category_color: r.category_color ?? null,
    }));
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
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
    } as Transaction;
  },

  async update(id: string, patch: Partial<Transaction>): Promise<Transaction | null> {
    const now = Date.now();
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...patch, updatedAt: now };
    // Ensure amount is always absolute (unsigned behavior)
    if (merged.amount) merged.amount = Math.abs(merged.amount);

    await run(
      `UPDATE transactions SET amount = ?, comment = ?, accountId = ?, payeeId = ?, categoryId = ?, status = ?, cr_amount = ?, transaction_type = ?, createdAt = ?, updatedAt = ?, deleted = ? WHERE id = ?`,
      [
        merged.amount,
        merged.comment,
        merged.accountId,
        merged.payeeId,
        merged.categoryId,
        merged.status,
        merged.cr_amount,
        merged.transaction_type,
        merged.createdAt,
        merged.updatedAt,
        merged.deleted ?? 0,
        id,
      ],
    );
    return merged as Transaction;
  },

  async delete(id: string): Promise<void> {
    await run(`DELETE FROM transactions WHERE id = ?`, [id]);
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await run(`DELETE FROM transactions WHERE id IN (${placeholders})`, ids);
  },

  // clone - creates a new transaction copying fields except id and timestamps
  async clone(id: string): Promise<Transaction | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const clone = {
      ...existing,
      id: uuidSync(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // remove deleted flag
    clone.deleted = 0;
    return this.create(clone);
  },

  // payee helpers with normalization
  async addPayee(partial: Partial<Payee>): Promise<Payee> {
    const id = partial.id ?? uuidSync();
    const name = (partial.name ?? '').trim();
    if (!name) throw new Error('Payee name required');

    const existing = await first<{ id: string; name: string }>(
      `SELECT id, name FROM payees WHERE name = ? COLLATE NOCASE LIMIT 1`,
      [name],
    );
    if (existing) return { id: existing.id, name: existing.name } as Payee;
    // Insert or ignore by generating an id; then select existing by case-insensitive name
    // Use COLLATE NOCASE for case-insensitive match
    await run(`INSERT OR IGNORE INTO payees (id, name) VALUES (?, ?)`, [id, name]);

    const final = await first<{ id: string; name: string }>(
      `SELECT id, name FROM payees WHERE name = ? COLLATE NOCASE LIMIT 1`,
      [name],
    );
    if (final) return { id: final.id, name: final.name } as Payee;

    // Should not happen unless insert failed silently and select failed
    return { id, name } as Payee;
  },

  async getLastByCategory(categoryId: string): Promise<Transaction | null> {
    const r = await first<any>(
      `SELECT * FROM transactions WHERE categoryId = ? AND transaction_type = 'EXPENSE' AND deleted = 0 ORDER BY createdAt DESC LIMIT 1`,
      [categoryId],
    );
    if (!r) return null;
    return {
      id: r.id,
      amount: r.amount,
      comment: r.comment ?? null,
      accountId: r.accountId,
      payeeId: r.payeeId ?? null,
      categoryId: r.categoryId ?? null,
      status: r.status ?? null,
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
    } as Transaction;
  },

  async getLastByPayee(payeeId: string): Promise<Transaction | null> {
    const r = await first<any>(
      `SELECT * FROM transactions WHERE payeeId = ? AND transaction_type = 'EXPENSE' AND deleted = 0 ORDER BY createdAt DESC LIMIT 1`,
      [payeeId],
    );
    if (!r) return null;
    return {
      id: r.id,
      amount: r.amount,
      comment: r.comment ?? null,
      accountId: r.accountId,
      payeeId: r.payeeId ?? null,
      categoryId: r.categoryId ?? null,
      status: r.status ?? null,
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
    } as Transaction;
  },


  async findByRecurringRule(ruleId: string): Promise<Transaction[]> {
    const rows = await all<any>(
      'SELECT * FROM transactions WHERE recurring_rule_id = ? AND deleted = 0 ORDER BY createdAt ASC',
      [ruleId]
    );
    return (rows || []).map((r: any) => ({
      id: r.id,
      amount: r.amount,
      comment: r.comment ?? null,
      accountId: r.accountId,
      payeeId: r.payeeId ?? null,
      categoryId: r.categoryId ?? null,
      status: r.status ?? null,
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
      recurring_rule_id: r.recurring_rule_id,
    })) as Transaction[];
  },

  async findForRulesInRange(ruleIds: string[], startMs: number, endMs: number): Promise<Transaction[]> {
    if (ruleIds.length === 0) return [];
    const placeholders = ruleIds.map(() => '?').join(',');
    const rows = await all<any>(
      `SELECT * FROM transactions 
       WHERE recurring_rule_id IN (${placeholders}) 
       AND createdAt >= ? AND createdAt <= ? 
       AND deleted = 0`,
      [...ruleIds, startMs, endMs]
    );
    return (rows || []).map((r: any) => ({
      id: r.id,
      amount: r.amount,
      comment: r.comment ?? null,
      accountId: r.accountId,
      payeeId: r.payeeId ?? null,
      categoryId: r.categoryId ?? null,
      status: r.status ?? null,
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
      recurring_rule_id: r.recurring_rule_id,
    })) as Transaction[];
  },

  async findLastByRecurringRule(ruleId: string): Promise<Transaction | null> {
    const r = await first<any>(
      'SELECT * FROM transactions WHERE recurring_rule_id = ? AND deleted = 0 ORDER BY createdAt DESC LIMIT 1',
      [ruleId]
    );
    if (!r) return null;
    return {
      id: r.id,
      amount: r.amount,
      comment: r.comment ?? null,
      accountId: r.accountId,
      payeeId: r.payeeId ?? null,
      categoryId: r.categoryId ?? null,
      status: r.status ?? null,
      cr_amount: r.cr_amount ?? null,
      transaction_type: r.transaction_type ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt ?? null,
      deleted: r.deleted ?? 0,
      recurring_rule_id: r.recurring_rule_id,
    } as Transaction;
  },

  async updateCategoryForMultiple(ids: string[], categoryId: string): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await run(
      `UPDATE transactions SET categoryId = ?, updatedAt = ? WHERE id IN (${placeholders})`,
      [categoryId, Date.now(), ...ids]
    );
  },

  async updatePayeeForMultiple(ids: string[], payeeId: string): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await run(
      `UPDATE transactions SET payeeId = ?, updatedAt = ? WHERE id IN (${placeholders})`,
      [payeeId, Date.now(), ...ids]
    );
  },
};
