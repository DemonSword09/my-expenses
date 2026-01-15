// src/db/repositories/PayeeRepo.ts
import { all, run, first } from '../sqlite';
import type { Payee } from '../models';
import { uuidSync } from '../../utils/uuid';

export const PayeeRepo = {
    async listAll(): Promise<Payee[]> {
        const rows = await all<Payee>('SELECT * FROM payees ORDER BY name COLLATE NOCASE ASC');
        return rows;
    },

    async update(id: string, name: string): Promise<void> {
        await run('UPDATE payees SET name = ? WHERE id = ?', [name, id]);
    },

    async delete(id: string): Promise<void> {
        // Note: This does not cascade delete transactions or set null.
        // It assumes the caller handles data integrity or the DB has no foreign key constraints enforcing it.
        // Based on TransactionRepo, transactions have payeeId.
        // We should probably set payeeId to null for transactions with this payee.

        // First, unlink transactions
        await run('UPDATE transactions SET payeeId = NULL, updatedAt = ? WHERE payeeId = ?', [Date.now(), id]);

        // Then delete payee
        await run('DELETE FROM payees WHERE id = ?', [id]);
    },

    async create(name: string): Promise<Payee> {
        const id = uuidSync();
        await run('INSERT INTO payees (id, name) VALUES (?, ?)', [id, name]);
        return { id, name };
    },

    async findByName(name: string): Promise<Payee | null> {
        const r = await first<Payee>('SELECT * FROM payees WHERE name = ? COLLATE NOCASE LIMIT 1', [name]);
        return r ?? null;
    },

    async findById(id: string): Promise<Payee | null> {
        return await first<Payee>('SELECT * FROM payees WHERE id = ?', [id]) || null;
    }
};
