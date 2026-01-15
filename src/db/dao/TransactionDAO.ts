import { all, run, first } from '../../db/sqlite';
import type { Transaction } from '../../db/models';

export interface TransactionRow {
    id: string;
    amount: number;
    comment: string | null;
    accountId: string;
    payeeId: string | null;
    categoryId: string | null;
    status: string | null;
    cr_amount: number | null;
    transaction_type: string | null;
    createdAt: number;
    updatedAt: number | null;
    deleted: number;
    recurring_rule_id: string | null;
}

const INSERT_COLS = `id, amount, comment, accountId, payeeId, categoryId, status, cr_amount, transaction_type, createdAt, updatedAt, deleted, recurring_rule_id`;

export const TransactionDAO = {
    async insert(t: Transaction): Promise<void> {
        await run(
            `INSERT INTO transactions (${INSERT_COLS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                t.recurring_rule_id,
            ]
        );
    },

    async insertBatch(transactions: Transaction[]): Promise<void> {
        if (transactions.length === 0) return;

        // SQLite param limit is usually 999. 
        // 13 columns per row. 50 * 13 = 650 < 999. Safe.
        const BATCH_SIZE = 50;

        for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
            const chunk = transactions.slice(i, i + BATCH_SIZE);
            const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
            const params: any[] = [];

            chunk.forEach(t => {
                params.push(
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
                    t.recurring_rule_id
                );
            });

            await run(
                `INSERT INTO transactions (${INSERT_COLS}) VALUES ${placeholders}`,
                params
            );
        }
    },

    async findAll(): Promise<TransactionRow[]> {
        return await all<TransactionRow>('SELECT * FROM transactions WHERE deleted = 0 ORDER BY createdAt DESC');
    },

    async findById(id: string): Promise<TransactionRow | null> {
        return await first<TransactionRow>('SELECT * FROM transactions WHERE id = ? LIMIT 1', [id]);
    },

    async update(id: string, t: Transaction): Promise<void> {
        await run(
            `UPDATE transactions SET 
                amount = ?, comment = ?, accountId = ?, payeeId = ?, categoryId = ?, 
                status = ?, cr_amount = ?, transaction_type = ?, createdAt = ?, updatedAt = ?, deleted = ? 
            WHERE id = ?`,
            [
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
                id
            ]
        );
    },

    async delete(id: string): Promise<void> {
        await run('DELETE FROM transactions WHERE id = ?', [id]);
    },

    async deleteMultiple(ids: string[]): Promise<void> {
        if (ids.length === 0) return;
        const placeholders = ids.map(() => '?').join(',');
        await run(`DELETE FROM transactions WHERE id IN (${placeholders})`, ids);
    },

    // Analytics / Specialized Queries
    async findLastByPayee(payeeId: string): Promise<TransactionRow | null> {
        return await first<TransactionRow>(
            `SELECT * FROM transactions WHERE payeeId = ? AND transaction_type = 'EXPENSE' AND deleted = 0 ORDER BY createdAt DESC LIMIT 1`,
            [payeeId]
        );
    },

    async findForRulesInRange(ruleIds: string[], startMs: number, endMs: number): Promise<TransactionRow[]> {
        if (ruleIds.length === 0) return [];
        const placeholders = ruleIds.map(() => '?').join(',');
        return await all<TransactionRow>(
            `SELECT * FROM transactions 
             WHERE recurring_rule_id IN (${placeholders}) 
             AND createdAt >= ? AND createdAt <= ? 
             AND deleted = 0`,
            [...ruleIds, startMs, endMs]
        );
    },

    async getSum(filters: {
        categoryId?: string;
        accountId?: string;
        payeeId?: string;
        startDate?: number;
        endDate?: number;
    }): Promise<number> {
        let sql = `SELECT SUM(amount) as total FROM transactions WHERE deleted = 0 AND transaction_type = 'EXPENSE'`;
        const params: any[] = [];

        if (filters.categoryId) {
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
