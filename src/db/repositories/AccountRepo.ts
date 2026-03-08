import { all, first, run } from '../sqlite';
import { Account } from '../models';

export const AccountRepo = {
    async listAll(): Promise<Account[]> {
        const rows = await all<Account>('SELECT * FROM accounts ORDER BY label ASC');
        return rows;
    },

    async findByName(name: string): Promise<Account | undefined> {
        const lower = name.toLowerCase();
        const rows = await all<Account>('SELECT * FROM accounts');
        return rows.find(a => a.label.toLowerCase() === lower);
    },

    async findFuzzy(name: string): Promise<Account | undefined> {
        // Simple fuzzy match: does label contain the name?
        const lower = name.toLowerCase();
        const rows = await all<Account>('SELECT * FROM accounts');
        return rows.find(a => a.label.toLowerCase().includes(lower));
    },

    async findById(id: string): Promise<Account | null> {
        return await first<Account>('SELECT * FROM accounts WHERE id = ?', [id]) || null;
    },

    async create(account: Account): Promise<void> {
        await run(
            `INSERT INTO accounts (id, label, opening_balance, type, description, color, currency_code)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                account.id,
                account.label,
                account.opening_balance,
                account.type,
                account.description,
                account.color,
                account.currency_code
            ]
        );
    },

    async count(): Promise<number> {
        const r = await first<{ c: number }>('SELECT COUNT(*) as c FROM accounts');
        return r?.c ?? 0;
    }
};
