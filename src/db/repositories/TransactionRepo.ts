import { all, run, first } from '../sqlite';
import type { Transaction, Payee, TransactionDetail } from '../models';
import { uuidSync } from '../../utils/uuid';
import { TransactionDAO, TransactionRow } from '../../db/dao/TransactionDAO'; // Import DAO
import { TransactionService } from '../../services/TransactionService';

// Removed TransactionRow interface as it is imported

interface TransactionDetailRow extends TransactionRow {
  payee_name: string | null;
  category_label: string | null;
  parent_category_label: string | null;
  parent_category_id: string | null;
  category_icon: string | null;
  category_color: number | null;
}

// Constants for SQL queries to ensure column ordering matches valid placeholders
const INSERT_COLS = `id, amount, comment, accountId, payeeId, categoryId, status, cr_amount, transaction_type, createdAt, updatedAt, deleted, recurring_rule_id`;

function mapRowToTransaction(r: TransactionRow): Transaction {
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
    deleted: (r.deleted === 1) ? 1 : 0, // Normalize to literal type if needed, or keeping usage of existing number
    recurring_rule_id: r.recurring_rule_id,
  } as Transaction;
}

function mapRowToDetail(r: TransactionDetailRow): TransactionDetail {
  return {
    ...mapRowToTransaction(r),
    payee_name: r.payee_name ?? null,
    category_label: r.category_label ?? null,
    category_parent_label: r.parent_category_label ?? null,
    category_parent_id: r.parent_category_id ?? null,
    category_icon: r.category_icon ?? null,
    category_color: r.category_color ?? null,
  };
}

// ... inside findWithFiltersDetails ...

let sql = `
      SELECT t.*, 
             p.name as payee_name, 
             c.label as category_label, 
             c.icon as category_icon,
             c.color as category_color,
             parent.label as parent_category_label,
             parent.id as parent_category_id
      FROM transactions t
      LEFT JOIN payees p ON t.payeeId = p.id
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN categories parent ON c.parentId = parent.id
      WHERE t.deleted = 0
    `;


// Cache cache moved to Service or managed by AccountRepo properly? 
// For now, Service handles logic.

// ensureDefaultAccount moved to TransactionService

export const TransactionRepo = {
  async create(partial: Partial<Transaction>): Promise<Transaction> {
    return await TransactionService.createTransaction(partial);
  },

  async createMany(partials: Partial<Transaction>[]): Promise<void> {
    // We bypass Service for bulk to avoid loop overhead, but basic defaults needed.
    // Assuming 'ensureDefaultAccount' called explicitly before.
    // Map partials to full objects.
    const now = Date.now();
    // note: we assume AccountId is set on all of them by caller (useCsvImport)

    // We need to form full Transaction objects.
    const fullTransactions: Transaction[] = partials.map(p => ({
      id: p.id!, // Assumed set
      amount: Math.abs(p.amount ?? 0),
      comment: p.comment ?? null,
      accountId: p.accountId!, // Assumed set
      payeeId: p.payeeId ?? null,
      categoryId: p.categoryId ?? null,
      status: p.status ?? null,
      cr_amount: p.cr_amount ?? null,
      transaction_type: p.transaction_type ?? 'EXPENSE',
      createdAt: p.createdAt ?? now,
      updatedAt: p.updatedAt ?? now,
      deleted: 0,
      recurring_rule_id: p.recurring_rule_id ?? null,
    }));

    await TransactionDAO.insertBatch(fullTransactions);
  },

  async listAll(): Promise<Transaction[]> {
    const rows = await TransactionDAO.findAll();
    return rows.map(mapRowToTransaction);
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
    const rows = await all<TransactionDetailRow>(sql);
    return rows.map(mapRowToDetail);
  },

  async findById(id: string): Promise<Transaction | null> {
    const r = await TransactionDAO.findById(id);
    if (!r) return null;
    return mapRowToTransaction(r);
  },

  async update(id: string, patch: Partial<Transaction>): Promise<Transaction | null> {
    const now = Date.now();
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = { ...existing, ...patch, updatedAt: now };

    // Ensure amount is always absolute (unsigned behavior enforcement)
    if (merged.amount) merged.amount = Math.abs(merged.amount);

    await TransactionDAO.update(id, merged);
    return merged;
  },

  async delete(id: string): Promise<void> {
    // Soft delete usually, but here strict delete was implemented. 
    // Plan implied data loss is ok, but DELETE keeps clean DB. 
    // The previous code had a mix of 'deleted' flag usage and hard DELETE.
    // listAll checks deleted=0, but delete() did hard delete in original code?
    // Checking previous Step 14: delete() did `DELETE FROM transactions`
    await TransactionDAO.delete(id);
  },

  async deleteMultiple(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await TransactionDAO.deleteMultiple(ids);
  },

  async clone(id: string): Promise<Transaction | null> {
    return await TransactionService.cloneTransaction(id);
  },

  // Payee Helpers
  // Note: This logic is tightly coupled here but acceptable for repo pattern
  async addPayee(partial: Partial<Payee>): Promise<Payee> {
    return await TransactionService.addPayee(partial as any);
  },

  // Analytic Helpers
  async getLastByCategory(categoryId: string): Promise<Transaction | null> {
    const r = await first<TransactionRow>(
      `SELECT * FROM transactions WHERE categoryId = ? AND transaction_type = 'EXPENSE' AND deleted = 0 ORDER BY createdAt DESC LIMIT 1`,
      [categoryId],
    );
    return r ? mapRowToTransaction(r) : null;
  },

  async getLastByPayee(payeeId: string): Promise<Transaction | null> {
    const r = await first<TransactionRow>(
      `SELECT * FROM transactions WHERE payeeId = ? AND transaction_type = 'EXPENSE' AND deleted = 0 ORDER BY createdAt DESC LIMIT 1`,
      [payeeId],
    );
    return r ? mapRowToTransaction(r) : null;
  },

  async findByRecurringRule(ruleId: string): Promise<Transaction[]> {
    const rows = await all<TransactionRow>(
      'SELECT * FROM transactions WHERE recurring_rule_id = ? AND deleted = 0 ORDER BY createdAt ASC',
      [ruleId]
    );
    return rows.map(mapRowToTransaction);
  },

  async findForRulesInRange(ruleIds: string[], startMs: number, endMs: number): Promise<Transaction[]> {
    if (ruleIds.length === 0) return [];
    const rows = await TransactionDAO.findForRulesInRange(ruleIds, startMs, endMs);
    return rows.map(mapRowToTransaction);
  },

  async findLastByRecurringRule(ruleId: string): Promise<Transaction | null> {
    const r = await first<TransactionRow>(
      'SELECT * FROM transactions WHERE recurring_rule_id = ? AND deleted = 0 ORDER BY createdAt DESC LIMIT 1',
      [ruleId]
    );
    return r ? mapRowToTransaction(r) : null;
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

  // Analytics for Chat Agent
  async getCategoryStats(limit: number = 3): Promise<{ label: string; total: number }[]> {
    const rows = await all<{ label: string; total: number }>(`
      SELECT c.label, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.categoryId = c.id
      WHERE t.deleted = 0 AND t.transaction_type = 'EXPENSE'
      GROUP BY c.label
      ORDER BY total DESC
      LIMIT ?
    `, [limit]);
    return rows;
  },

  async getMostExpensiveTransaction(): Promise<Transaction | null> {
    const r = await first<TransactionRow>(`
      SELECT * FROM transactions 
      WHERE deleted = 0 AND transaction_type = 'EXPENSE'
      ORDER BY amount DESC 
      LIMIT 1
    `);
    return r ? mapRowToTransaction(r) : null;
  },

  async getTopExpenses(limit: number): Promise<Transaction[]> {
    const rows = await all<TransactionRow>(`
      SELECT * FROM transactions
      WHERE deleted = 0 AND transaction_type = 'EXPENSE'
      ORDER BY amount DESC
      LIMIT ?
    `, [limit]);
    return rows.map(mapRowToTransaction);
  },

  async getTotalForCategory(categoryId: string, startMs: number | null, endMs: number | null): Promise<number> {
    let sql = `
      SELECT SUM(amount) as total 
      FROM transactions 
      WHERE categoryId = ? AND deleted = 0 AND transaction_type = 'EXPENSE'
    `;
    const params: any[] = [categoryId];

    if (startMs !== null && endMs !== null) {
      sql += ` AND createdAt >= ? AND createdAt <= ?`;
      params.push(startMs, endMs);
    }

    const res = await first<{ total: number }>(sql, params);
    return res?.total ?? 0;
  },

  async getExpensesInRange(startMs: number, endMs: number): Promise<Transaction[]> {
    const rows = await all<TransactionRow>(`
      SELECT * FROM transactions
      WHERE createdAt >= ? AND createdAt <= ? AND deleted = 0 AND transaction_type = 'EXPENSE'
      ORDER BY createdAt DESC LIMIT 10
    `, [startMs, endMs]);
    return rows.map(mapRowToTransaction);
  },

  async searchLast(query: string): Promise<Transaction | null> {
    // Search in comment or payee name
    const like = `%${query}%`;
    const r = await first<TransactionRow>(`
      SELECT t.* 
      FROM transactions t
      LEFT JOIN payees p ON t.payeeId = p.id
      WHERE t.deleted = 0 
      AND (t.comment LIKE ? OR p.name LIKE ?)
      ORDER BY t.createdAt DESC 
      LIMIT 1
    `, [like, like]);
    return r ? mapRowToTransaction(r) : null;
  },

  async findWithFiltersDetails(filters: {
    dataset?: 'all' | 'week' | 'month' | 'custom';
    categoryId?: string;
    accountId?: string;
    payeeId?: string;
    startDate?: number;
    endDate?: number;
    query?: string;
    limit?: number;
  }): Promise<TransactionDetail[]> {
    let sql = `
      SELECT t.*, 
             p.name as payee_name, 
             c.label as category_label, 
             c.icon as category_icon,
             c.color as category_color,
             parent.label as parent_category_label,
             parent.id as parent_category_id
      FROM transactions t
      LEFT JOIN payees p ON t.payeeId = p.id
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN categories parent ON c.parentId = parent.id
      WHERE t.deleted = 0
    `;
    const params: any[] = [];

    // Helper to handle date presets
    let start = filters.startDate;
    let end = filters.endDate;
    const now = Date.now();

    if (filters.dataset === 'all') {
      start = undefined;
      end = undefined;
    } else if (filters.dataset === 'week') {
      start = now - 7 * 24 * 60 * 60 * 1000;
      end = undefined; // Week implies last 7 days from now, so no end limit needed or end=now
    } else if (filters.dataset === 'month') {
      start = now - 30 * 24 * 60 * 60 * 1000;
      end = undefined;
    }

    if (start) {
      sql += ' AND t.createdAt >= ?';
      params.push(start);
    }
    if (end) {
      sql += ' AND t.createdAt <= ?';
      params.push(end);
    }

    if (filters.categoryId) {
      sql += ' AND t.categoryId = ?';
      params.push(filters.categoryId);
    }
    if (filters.accountId) {
      sql += ' AND t.accountId = ?';
      params.push(filters.accountId);
    }
    if (filters.payeeId) {
      sql += ' AND t.payeeId = ?';
      params.push(filters.payeeId);
    }

    if (filters.query && filters.query.trim()) {
      const q = `%${filters.query.trim()}%`;
      sql += ` AND (t.comment LIKE ? OR p.name LIKE ? OR c.label LIKE ?)`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY t.createdAt DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = await all<TransactionDetailRow>(sql, params);
    return rows.map(mapRowToDetail);
  },

  async findWithFilters(filters: {
    categoryId?: string;
    categoryIds?: string[];
    accountId?: string;
    payeeId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
    orderBy?: 'date' | 'amount' | 'amount_asc';
  }): Promise<Transaction[]> {
    // Restored SQL initialization
    let sql = `SELECT * FROM transactions WHERE deleted = 0 AND transaction_type = 'EXPENSE'`;
    const params: any[] = [];

    // Category filter: prefer categoryIds (parent + children) over single categoryId
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      const placeholders = filters.categoryIds.map(() => '?').join(',');
      sql += ` AND categoryId IN (${placeholders})`;
      params.push(...filters.categoryIds);
    } else if (filters.categoryId) {
      sql += ' AND categoryId = ?';
      params.push(filters.categoryId);
    }
    if (filters.accountId) {
      sql += ' AND accountId = ?';
      params.push(filters.accountId);
    }
    if (filters.payeeId) {
      sql += ' AND payeeId = ?';
      params.push(filters.payeeId);
    }
    if (filters.startDate) {
      sql += ' AND createdAt >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ' AND createdAt <= ?';
      params.push(filters.endDate);
    }

    if (filters.orderBy === 'amount') {
      sql += ' ORDER BY amount DESC';
    } else if (filters.orderBy === 'amount_asc') {
      sql += ' ORDER BY amount ASC';
    } else {
      sql += ' ORDER BY createdAt DESC';
    }

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = await all<TransactionRow>(sql, params);
    return rows.map(mapRowToTransaction);
  },

  async getSum(filters: {
    categoryId?: string;
    categoryIds?: string[];
    accountId?: string;
    payeeId?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<number> {
    // TransactionDAO.getSum might strictly take specific fields? 
    // Let's implement direct SQL here to support categoryIds, or update DAO.
    // DAO is 'src/db/dao/TransactionDAO'. I should probably update that or inline SQL here.
    // Inline is easier for this specific new requirement without changing DAO everywhere.

    let sql = `SELECT SUM(amount) as total FROM transactions WHERE deleted = 0 AND transaction_type = 'EXPENSE'`;
    const params: any[] = [];

    // Category filter: prefer categoryIds (parent + children) over single categoryId
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      const placeholders = filters.categoryIds.map(() => '?').join(',');
      sql += ` AND categoryId IN (${placeholders})`;
      params.push(...filters.categoryIds);
    } else if (filters.categoryId) {
      sql += ' AND categoryId = ?';
      params.push(filters.categoryId);
    }
    if (filters.accountId) {
      sql += ' AND accountId = ?';
      params.push(filters.accountId);
    }
    if (filters.payeeId) {
      sql += ' AND payeeId = ?';
      params.push(filters.payeeId);
    }
    if (filters.startDate) {
      sql += ' AND createdAt >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql += ' AND createdAt <= ?';
      params.push(filters.endDate);
    }

    const res = await first<{ total: number }>(sql, params);
    return res?.total ?? 0;
  }
};
