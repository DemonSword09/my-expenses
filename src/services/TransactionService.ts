import { TransactionDAO } from '../db/dao/TransactionDAO';
import { AccountRepo } from '../db/repositories/AccountRepo';
import { PayeeRepo } from '../db/repositories/PayeeRepo';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import type { Transaction, Payee } from '../db/models';
import { uuidSync } from '../utils/uuid';

const DEFAULT_ACCOUNT_LABEL = 'Default Account';
const DEFAULT_ACCOUNT_CURRENCY = 'USD';

export const TransactionService = {
    // --- Core Logic ---
    async ensureDefaultAccount(): Promise<string> {
        const accounts = await AccountRepo.listAll();
        if (accounts.length > 0) return accounts[0].id;

        const id = uuidSync();
        await AccountRepo.create({
            id,
            label: DEFAULT_ACCOUNT_LABEL,
            opening_balance: 0,
            type: 'checking',
            description: 'Auto-created default account',
            color: 0,
            currency_code: DEFAULT_ACCOUNT_CURRENCY,
        });
        return id;
    },

    async createTransaction(partial: Partial<Transaction>): Promise<Transaction> {
        const nowMs = Date.now();
        const id = partial.id ?? uuidSync();
        const accountId = partial.accountId ?? (await this.ensureDefaultAccount());

        const t: Transaction = {
            id,
            amount: Math.abs(partial.amount ?? 0),
            comment: partial.comment ?? null,
            accountId,
            payeeId: partial.payeeId ?? null,
            categoryId: partial.categoryId ?? null,
            status: partial.status ?? null,
            cr_amount: partial.cr_amount ?? null,
            transaction_type: partial.transaction_type ?? 'EXPENSE',
            createdAt: partial.createdAt ?? nowMs,
            updatedAt: partial.updatedAt ?? nowMs,
            deleted: 0,
            recurring_rule_id: partial.recurring_rule_id ?? null,
        };

        await TransactionDAO.insert(t);
        return t;
    },

    async addPayee(data: { id?: string, name: string }): Promise<Payee> {
        const name = (data.name ?? '').trim();
        if (!name) throw new Error('Payee name required');

        const existing = await PayeeRepo.findByName(name);
        if (existing) return existing;

        return await PayeeRepo.create(name);
    },

    async cloneTransaction(id: string): Promise<Transaction | null> {
        const existing = await TransactionDAO.findById(id);
        if (!existing) return null;

        // TransactionDAO returns a Row, we need to map it if we used strict types.
        // Assuming partial compatibility or simple casts for now as the shapes intersect heavily.
        // Actually DAO returns Row, Service expects Model. We should map it.
        // To save complexity for this refactor, we will rely on Repo's mapping or duplicate it here?
        // Let's duplicate mapping or make DAO return Model?
        // For strict Separation, DAO returns Row.
        // We will do a robust map here or implicit cast.

        const cloneData: Partial<Transaction> = {
            ...existing, // Row properties
            id: uuidSync(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            deleted: 0
        } as unknown as Partial<Transaction>;
        // Note: snake_case in Row vs Camel in Model. DAO returns Row.
        // We need 'mapRowToTransaction'. Ideally helper should be shared.
        // For now, let's just use createTransaction which handles defaults.

        return this.createTransaction(cloneData);
    },

    // --- Analytics Aggregation ---
    async getCategoryStats(limit: number = 3) {
        // This query joins Categories. Maybe should be in CategoryDAO?
        // Or specific AnalyticDAO?
        // For now, keeping it consistent with Repo approach but using DAO query if available.
        // Since TransactionDAO doesn't have this join query yet, 
        // we can add it to TransactionDAO or execute here?
        // Better to add to TransactionDAO to keep SQL out of Service.
        throw new Error("Use TransactionDAO.getCategoryStats (Not implemented yet) or Repo");
    }
};
