import { IntentType } from '../../utils/IntentResolver';

// Response format types
export type ResponseFormat = 'PLAIN' | 'MARKDOWN';

// Structured chat response from handlers
export interface ChatResponse {
    text: string;
    format: ResponseFormat;
    intent: IntentType;
    metadata?: ResponseMetadata;
}

export interface ResponseMetadata {
    resultCount?: number;
    total?: number;
    filtersSummary?: string;
}

// Personality phrases for variety
const PHRASES = {
    // Success/Found data
    found: [
        'Here\'s what I found! 📊',
        'Got it! 🎯',
        'Check this out! ✨',
        'Here you go! 📋',
        'Found it! 🔍',
        'Let me show you! 👀',
    ],
    // Empty results
    empty: [
        'Hmm, nothing here 🤔',
        'Looks like a clean slate! 📭',
        'No matches found 🔍',
        'All clear here! ✨',
        'Nothing to show 📋',
    ],
    // Expense added
    added: [
        'Done! ✅',
        'Got it! ✨',
        'Added! 💰',
        'Saved! ✓',
        'Noted! 📝',
        'All set! 🎉',
    ],
    // Big amounts
    bigSpend: [
        'Whoa! 😮',
        'That\'s a big one! 💸',
        'Now that\'s spending! 🔥',
    ],
    // Small amounts
    smallSpend: [
        'Nice and light! 🍃',
        'Keeping it minimal! 👍',
        'Easy on the wallet! 💚',
    ],
    // Errors/Confusion
    confused: [
        'Hmm, I\'m not quite sure 🤔',
        'I didn\'t catch that 😅',
        'Could you clarify? 🔍',
        'Let me think... 🧠',
    ],
    // Encouragement
    encourage: [
        'Great question! ',
        'Let\'s see... ',
        'Sure thing! ',
        'On it! ',
    ],
};

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Smart commentary based on amount
function getAmountCommentary(amount: number): string {
    if (amount > 10000) return pick(PHRASES.bigSpend) + ' ';
    if (amount < 100) return pick(PHRASES.smallSpend) + ' ';
    return '';
}

// Format currency nicely
function formatMoney(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * ResponseBuilder - Creates cheerful, smart responses
 * Keeps formatting logic separate from business rules
 */
export const ResponseBuilder = {

    // === Plain Text Responses ===

    plain(text: string, intent: IntentType, metadata?: ResponseMetadata): ChatResponse {
        return { text, format: 'PLAIN', intent, metadata };
    },

    // === Markdown Responses ===

    markdown(text: string, intent: IntentType, metadata?: ResponseMetadata): ChatResponse {
        return { text, format: 'MARKDOWN', intent, metadata };
    },

    // === Smart Auto-Responses ===

    /** Sum/Total response */
    sumResponse(total: number, categoryName?: string, dateRange?: string): ChatResponse {
        const commentary = getAmountCommentary(total);
        const where = categoryName ? ` on **${categoryName}**` : '';
        const when = dateRange ? ` ${dateRange}` : '';

        const text = total === 0
            ? `${pick(PHRASES.empty)} No spending${where}${when}. Your wallet thanks you! 💚`
            : `${pick(PHRASES.found)}\n\n${commentary}💰 You spent **${formatMoney(total)}**${where}${when}`;

        return this.markdown(text, 'SUM', { total });
    },

    /** Count response */
    countResponse(count: number, categoryName?: string, dateRange?: string): ChatResponse {
        const where = categoryName ? ` for **${categoryName}**` : '';
        const when = dateRange ? ` ${dateRange}` : '';

        if (count === 0) {
            return this.plain(
                `${pick(PHRASES.empty)} No transactions${where}${when}.`,
                'COUNT',
                { resultCount: count }
            );
        }

        const emoji = count > 50 ? '📈 Busy!' : count > 20 ? '📊' : '📋';
        const commentary = count > 50
            ? 'You\'ve been busy! '
            : count === 1
                ? 'Just one! '
                : '';

        return this.markdown(
            `${pick(PHRASES.found)}\n\n${emoji} ${commentary}**${count} transaction${count !== 1 ? 's' : ''}**${where}${when}`,
            'COUNT',
            { resultCount: count }
        );
    },

    /** Average response */
    avgResponse(average: number, count: number, categoryName?: string, dateRange?: string): ChatResponse {
        const where = categoryName ? ` for **${categoryName}**` : '';
        const when = dateRange ? ` ${dateRange}` : '';

        if (count === 0) {
            return this.plain(
                `${pick(PHRASES.empty)} No data to calculate average${where}${when}.`,
                'AVG'
            );
        }

        const commentary = getAmountCommentary(average);

        return this.markdown(
            `${pick(PHRASES.found)}\n\n${commentary}📊 Average expense${where}${when}: **${formatMoney(average)}**\n\n_Based on ${count} transaction${count !== 1 ? 's' : ''}_`,
            'AVG',
            { resultCount: count }
        );
    },

    /** Max/Min response */
    extremeResponse(
        type: 'MAX' | 'MIN',
        expense: { comment: string; amount: number; date: string } | null,
        categoryName?: string,
        dateRange?: string
    ): ChatResponse {
        const where = categoryName ? ` in **${categoryName}**` : '';
        const when = dateRange ? ` ${dateRange}` : '';
        const isMax = type === 'MAX';

        if (!expense) {
            return this.plain(
                `${pick(PHRASES.empty)} No expenses found${where}${when}.`,
                type
            );
        }

        const emoji = isMax ? '🏆' : '📉';
        const label = isMax ? 'biggest' : 'smallest';
        const commentary = isMax ? getAmountCommentary(expense.amount) : '';

        return this.markdown(
            `${pick(PHRASES.found)}\n\n${commentary}${emoji} Your ${label} expense${where}${when}:\n\n**${expense.comment}** — **${formatMoney(expense.amount)}**\n📅 ${expense.date}`,
            type,
            { resultCount: 1, total: expense.amount }
        );
    },

    /** Insert/Add expense response */
    insertResponse(note: string, amount: number, categoryName?: string): ChatResponse {
        const category = categoryName ? ` under ${categoryName}` : '';
        const commentary = getAmountCommentary(amount);

        return this.markdown(
            `${pick(PHRASES.added)} ${commentary}Added **${note}** for **${formatMoney(amount)}**${category} 💸`,
            'INSERT',
            { total: amount }
        );
    },

    /** 
     * List response - Professional markdown format for chat
     * 
     * Design: Visual hierarchy using markdown only
     * - Month as header
     * - Total as H3 (visual dominance)
     * - Count in italics (pushed back)
     * - Horizontal rules as section dividers
     * - Dates as bold labels
     * - Bullet list with padded amounts
     */
    listResponse(
        items: Array<{ comment: string; amount: number; date: string }>,
        total: number,
        categoryName?: string,
        dateRange?: string,
        totalCount?: number
    ): ChatResponse {
        const actualTotal = totalCount ?? items.length;

        if (items.length === 0) {
            const where = categoryName ? ` for ${categoryName}` : '';
            const when = dateRange ? ` ${dateRange}` : '';
            return this.markdown(
                `No expenses found${where}${when}\n\nTry a different filter or time range.`,
                'LIST',
                { resultCount: 0 }
            );
        }

        const metadata: ResponseMetadata = { resultCount: actualTotal, total };

        // === HEADER (Category • Date format) ===
        // User requested Heading (H2) for Title
        let headerLine: string;
        if (categoryName && dateRange) {
            headerLine = `## **${categoryName} • ${dateRange}**`;
        } else if (categoryName) {
            headerLine = `## **${categoryName}**`;
        } else if (dateRange) {
            headerLine = `## **${dateRange}**`;
        } else {
            headerLine = `## **Recent Expenses**`;
        }

        // === SUMMARY (prominent total) ===
        // User requested Subheading (H3) for Total
        const summaryLines = [
            headerLine,
            '',
            `### Total ${formatMoney(Math.round(total))}`,
            `*${actualTotal} expense${actualTotal !== 1 ? 's' : ''}*`,
            '',
            '---',
        ];

        // === GROUP BY DATE ===
        const dateGroups: Map<string, Array<{ comment: string; amount: number }>> = new Map();
        for (const item of items) {
            const existing = dateGroups.get(item.date) || [];
            existing.push({ comment: item.comment, amount: item.amount });
            dateGroups.set(item.date, existing);
        }

        // === FORMAT EXPENSES (using borderless table for alignment) ===
        const expenseLines: string[] = [];
        for (const [date, expenses] of dateGroups) {
            expenseLines.push('');
            expenseLines.push(`**${date}**`);

            // Create a simple two-column table (no header, no visible borders in most renderers)
            for (const exp of expenses) {
                // Allow wrapping now, so only truncate extremely long spam
                const name = exp.comment.length > 100
                    ? exp.comment.substring(0, 98) + '…'
                    : exp.comment;
                // Use table row format: | name | amount |
                expenseLines.push(`| ${name} | ${formatMoney(exp.amount)} |`);
            }
        }

        // === FOOTER ===
        const remaining = actualTotal - items.length;
        const footer = remaining > 0
            ? ['', '---', '', `*${remaining} more expense${remaining !== 1 ? 's' : ''} →*`]
            : [];

        return this.markdown(
            [...summaryLines, ...expenseLines, ...footer].join('\n'),
            'LIST',
            metadata
        );
    },

    /** Error/clarification response */
    clarification(suggestions?: string[]): ChatResponse {
        let text = `${pick(PHRASES.confused)}\n\n`;

        if (suggestions && suggestions.length > 0) {
            text += 'Here are some things you can try:\n\n';
            text += suggestions.map(s => `• ${s}`).join('\n');
        } else {
            text += 'Try asking something like:\n\n' +
                '📋 "Show my expenses"\n' +
                '💰 "How much did I spend on food?"\n' +
                '🏆 "What was my biggest expense?"\n' +
                '➕ "Coffee 50"';
        }

        text += '\n\nWhat would you like to do?';

        return this.plain(text, 'UNKNOWN');
    },

    /** Welcome message */
    welcome(): ChatResponse {
        return this.markdown(
            `Hey! 👋 I'm your expense assistant.\n\n` +
            `Here's what I can do:\n` +
            `• **"Show my expenses"** - see recent spending\n` +
            `• **"Total spent on food"** - get category totals\n` +
            `• **"Highest expense last month"** - find big purchases\n` +
            `• **"Coffee 50"** - quickly add an expense\n\n` +
            `What would you like to know?`,
            'LIST'
        );
    },

    /** Context continuation response */
    continueContext(intentName: string): ChatResponse {
        return this.plain(
            `👍 I'll keep working on your ${intentName}.\n\n` +
            `You can refine it with:\n` +
            `• A category — "for food"\n` +
            `• A time range — "in December"\n` +
            `• Or start fresh — "show all expenses"`,
            'UNKNOWN'
        );
    },
};
