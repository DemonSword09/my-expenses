import { TransactionRepo } from '../../db/repositories/TransactionRepo';
import { CategoryRepo } from '../../db/repositories/CategoryRepo';
import { PayeeRepo } from '../../db/repositories/PayeeRepo';
import { IntentType } from '../../utils/IntentResolver';
import { formatCurrency, formatDate } from '../../utils/format-utils';
import { ResponseBuilder, ChatResponse } from './ResponseBuilder';
import { ConversationContext, PendingInsert } from './ConversationContext';
import { TransactionService } from '../TransactionService';

interface TransactionFilters {
    categoryId?: string;
    categoryIds?: string[];
    accountId?: string;
    payeeId?: string;
    startDate?: number;
    endDate?: number;
    limit?: number;
    orderBy?: 'date' | 'amount' | 'amount_asc';
}

async function findCategoryByName(name: string) {
    const categories = await CategoryRepo.listAll();
    return categories.find((c) => c.label.toLowerCase() === name.toLowerCase());
}

async function getCategoryName(categoryId: string | undefined): Promise<string | null> {
    if (!categoryId) return null;
    const categories = await CategoryRepo.listAll();
    const category = categories.find(c => c.id === categoryId);
    return category?.label || null;
}

function getDateRangeDescription(startDate?: number, endDate?: number): string {
    if (!startDate || !endDate) return '';

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.toDateString() === end.toDateString()) {
        return formatDate(startDate);
    }

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export const ActionHandlers = {

    getWelcomeMessage(): string {
        return ResponseBuilder.welcome().text;
    },

    async execute(intent: IntentType, filters: TransactionFilters): Promise<ChatResponse> {

        switch (intent) {
            case 'SUM':
                return await this.handleSum(filters);
            case 'MAX':
                return await this.handleMax(filters);
            case 'MIN':
                return await this.handleMin(filters);
            case 'COUNT':
                return await this.handleCount(filters);
            case 'AVG':
                return await this.handleAvg(filters);
            case 'LIST':
            default:
                return await this.handleList(filters);
        }
    },

    /**
     * Smart insert flow:
     * 1. Check if there's a pending insert awaiting confirmation
     * 2. If not, search for similar transactions to clone
     * 3. If found, ask for confirmation to use as template
     * 4. If not found, ask for category clarification
     */
    async handleInsert(slots: any): Promise<ChatResponse> {
        // Check for pending insert awaiting confirmation
        const pending = ConversationContext.getPendingInsert();

        if (pending?.awaitingConfirmation) {
            // This shouldn't normally happen here - confirmation is handled in ChatService
            return this.completePendingInsert();
        }

        if (!slots.amount) {
            return ResponseBuilder.clarification([
                '"Coffee 50" — add with amount',
                '"Paid 200 for groceries"',
                '"Lunch 150"',
            ]);
        }

        // Strip any surrounding quotes from note (e.g., "coffee" -> coffee)
        const note = (slots.note || '').replace(/^["']|["']$/g, '').trim();
        const amount = slots.amount;

        // 1. Search for similar transactions
        const similarTransaction = note ? await TransactionRepo.searchLast(note) : null;

        if (similarTransaction) {
            // Found a similar transaction - use as template
            const categoryName = await getCategoryName(similarTransaction.categoryId || undefined);
            const payeeName = similarTransaction.payeeId
                ? (await PayeeRepo.findById(similarTransaction.payeeId))?.name
                : null;

            // Set pending insert with template
            ConversationContext.setPendingInsert({
                amount,
                note: note || similarTransaction.comment || 'Expense',
                categoryId: similarTransaction.categoryId || undefined,
                payeeId: similarTransaction.payeeId || undefined,
                templateId: similarTransaction.id,
                awaitingConfirmation: true,
                awaitingCategory: false,
            });

            const templateDesc = payeeName
                ? `**${payeeName}** under **${categoryName || 'Uncategorized'}**`
                : `**${categoryName || 'Uncategorized'}**`;

            return ResponseBuilder.plain(
                `🔍 Found similar expense!\n\n` +
                `Last time you added "${similarTransaction.comment}" as ${templateDesc}.\n\n` +
                `Want me to add **${formatCurrency(amount)}** the same way?\n\n` +
                `• **Yes** — use this category\n` +
                `• Or tell me a different category`,
                'INSERT'
            );
        }

        // 2. Check if note matches a category name
        const category = note ? await findCategoryByName(note) : null;

        if (category) {
            // Direct category match - add immediately
            const accountId = await TransactionService.ensureDefaultAccount();
            await TransactionRepo.create({
                amount,
                categoryId: category.id,
                comment: note,
                createdAt: Date.now(),
                accountId,
            });
            return ResponseBuilder.insertResponse(note, amount, category.label);
        }

        // 3. Check if note matches a payee
        const payee = note ? await PayeeRepo.findByName(note) : null;

        if (payee) {
            const lastTransaction = await TransactionRepo.getLastByPayee(payee.id);
            if (lastTransaction?.categoryId) {
                const categoryName = await getCategoryName(lastTransaction.categoryId);

                // Found payee with previous category
                ConversationContext.setPendingInsert({
                    amount,
                    note,
                    categoryId: lastTransaction.categoryId,
                    payeeId: payee.id,
                    awaitingConfirmation: true,
                    awaitingCategory: false,
                });

                return ResponseBuilder.plain(
                    `👋 I remember **${payee.name}**!\n\n` +
                    `Last time was under **${categoryName}**.\n\n` +
                    `Add **${formatCurrency(amount)}** the same way?\n\n` +
                    `• **Yes** — same category\n` +
                    `• Or tell me a different category`,
                    'INSERT'
                );
            }
        }

        // 4. No match found - ask for category
        const allCategories = await CategoryRepo.listAll();
        const topCategories = allCategories.slice(0, 5).map(c => c.label);

        ConversationContext.setPendingInsert({
            amount,
            note: note || 'Expense',
            awaitingConfirmation: false,
            awaitingCategory: true,
        });

        return ResponseBuilder.plain(
            `📝 Adding **${formatCurrency(amount)}**` + (note ? ` for "${note}"` : '') + `\n\n` +
            `What category should this be?\n\n` +
            topCategories.map(c => `• ${c}`).join('\n') + `\n\n` +
            `_Or say "skip" to add without category_`,
            'INSERT'
        );
    },

    /**
     * Handle user response to pending insert confirmation
     */
    async handlePendingInsertResponse(text: string): Promise<ChatResponse | null> {
        const pending = ConversationContext.getPendingInsert();
        if (!pending) return null;

        const lower = text.toLowerCase().trim();

        // Check for skip/cancel
        if (['skip', 'cancel', 'no', 'nevermind', 'forget it'].includes(lower)) {
            ConversationContext.clearPendingInsert();
            return ResponseBuilder.plain(`👍 No problem! What else can I help with?`, 'UNKNOWN');
        }

        // Check for confirmation
        if (['yes', 'yep', 'yeah', 'ok', 'okay', 'sure', 'confirm', 'same'].includes(lower)) {
            return await this.completePendingInsert();
        }

        // Check if awaiting category input
        if (pending.awaitingCategory) {
            // Try to match category
            const category = await findCategoryByName(text);
            if (category) {
                ConversationContext.updatePendingInsert({
                    categoryId: category.id,
                    awaitingCategory: false,
                });
                return await this.completePendingInsert();
            }

            // Fuzzy match
            const allCategories = await CategoryRepo.listAll();
            const match = allCategories.find(c =>
                c.label.toLowerCase().includes(lower) || lower.includes(c.label.toLowerCase())
            );
            if (match) {
                ConversationContext.updatePendingInsert({
                    categoryId: match.id,
                    awaitingCategory: false,
                });
                return await this.completePendingInsert();
            }

            // No category match - complete without category
            return await this.completePendingInsert();
        }

        // Check if it's a category name (for "No, use X instead")
        const category = await findCategoryByName(text);
        if (category) {
            ConversationContext.updatePendingInsert({ categoryId: category.id });
            return await this.completePendingInsert();
        }

        return null; // Not handled
    },

    /**
     * Complete the pending insert and create the transaction
     */
    async completePendingInsert(): Promise<ChatResponse> {
        const pending = ConversationContext.getPendingInsert();
        if (!pending) {
            return ResponseBuilder.plain(`🤔 Nothing pending to add. Tell me what expense to add!`, 'UNKNOWN');
        }

        const categoryName = await getCategoryName(pending.categoryId);
        const accountId = await TransactionService.ensureDefaultAccount();

        await TransactionRepo.create({
            amount: pending.amount,
            categoryId: pending.categoryId || null,
            payeeId: pending.payeeId || null,
            comment: pending.note || 'Expense',
            createdAt: Date.now(),
            accountId,
        });

        ConversationContext.clearPendingInsert();

        return ResponseBuilder.insertResponse(
            pending.note || 'Expense',
            pending.amount,
            categoryName || undefined
        );
    },

    async handleList(filters: TransactionFilters): Promise<ChatResponse> {
        // First, get ALL transactions matching filters (for accurate total)
        const allTransactions = await TransactionRepo.findWithFilters({
            ...filters,
            orderBy: 'date',
            // No limit - we need all for total
        });

        const categoryName = await getCategoryName(filters.categoryId);
        const dateRange = getDateRangeDescription(filters.startDate, filters.endDate);

        // Calculate total from ALL matching transactions
        const total = allTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalCount = allTransactions.length;

        // Limit display to top 10
        const displayTransactions = allTransactions.slice(0, 10);
        const items = displayTransactions.map(t => ({
            comment: t.comment || 'Expense',
            amount: t.amount,
            date: formatDate(t.createdAt),
        }));

        return ResponseBuilder.listResponse(items, total, categoryName || undefined, dateRange || undefined, totalCount);
    },

    async handleSum(filters: TransactionFilters): Promise<ChatResponse> {
        const total = await TransactionRepo.getSum(filters);
        const categoryName = await getCategoryName(filters.categoryId);
        const dateRange = getDateRangeDescription(filters.startDate, filters.endDate);

        return ResponseBuilder.sumResponse(total, categoryName || undefined, dateRange || undefined);
    },

    async handleMax(filters: TransactionFilters): Promise<ChatResponse> {
        const transactions = await TransactionRepo.findWithFilters({
            ...filters,
            limit: 1,
            orderBy: 'amount',
        });

        const categoryName = await getCategoryName(filters.categoryId);
        const dateRange = getDateRangeDescription(filters.startDate, filters.endDate);

        if (transactions.length === 0) {
            return ResponseBuilder.extremeResponse('MAX', null, categoryName || undefined, dateRange || undefined);
        }

        const t = transactions[0];
        return ResponseBuilder.extremeResponse('MAX', {
            comment: t.comment || 'Expense',
            amount: t.amount,
            date: formatDate(t.createdAt),
        }, categoryName || undefined, dateRange || undefined);
    },

    async handleMin(filters: TransactionFilters): Promise<ChatResponse> {
        const transactions = await TransactionRepo.findWithFilters({
            ...filters,
            limit: 1,
            orderBy: 'amount_asc',
        });

        const categoryName = await getCategoryName(filters.categoryId);
        const dateRange = getDateRangeDescription(filters.startDate, filters.endDate);

        if (transactions.length === 0) {
            return ResponseBuilder.extremeResponse('MIN', null, categoryName || undefined, dateRange || undefined);
        }

        const t = transactions[0];
        return ResponseBuilder.extremeResponse('MIN', {
            comment: t.comment || 'Expense',
            amount: t.amount,
            date: formatDate(t.createdAt),
        }, categoryName || undefined, dateRange || undefined);
    },

    async handleCount(filters: TransactionFilters): Promise<ChatResponse> {
        const transactions = await TransactionRepo.findWithFilters(filters);
        const categoryName = await getCategoryName(filters.categoryId);
        const dateRange = getDateRangeDescription(filters.startDate, filters.endDate);

        return ResponseBuilder.countResponse(transactions.length, categoryName || undefined, dateRange || undefined);
    },

    async handleAvg(filters: TransactionFilters): Promise<ChatResponse> {
        const transactions = await TransactionRepo.findWithFilters(filters);
        const categoryName = await getCategoryName(filters.categoryId);
        const dateRange = getDateRangeDescription(filters.startDate, filters.endDate);

        if (transactions.length === 0) {
            return ResponseBuilder.avgResponse(0, 0, categoryName || undefined, dateRange || undefined);
        }

        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        const average = total / transactions.length;

        return ResponseBuilder.avgResponse(average, transactions.length, categoryName || undefined, dateRange || undefined);
    },
};
