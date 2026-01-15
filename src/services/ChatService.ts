import { TransactionRepo } from '../db/repositories/TransactionRepo';
import { CategoryRepo } from '../db/repositories/CategoryRepo';
import { PayeeRepo } from '../db/repositories/PayeeRepo';
import { AccountRepo } from '../db/repositories/AccountRepo';
import { Transaction, Category, Account, Payee } from '../db/models';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
}

// Dynamically determine host for ML Service
// If running in Expo Go or Dev Client, hostUri contains the IP of the machine.
const getMLServiceUrl = () => {
    const hostUri = Constants.expoConfig?.hostUri; // e.g., "192.168.1.5:8081"
    const host = hostUri ? hostUri.split(':')[0] : 'localhost';

    // If Android emulator (and no hostUri), use 10.0.2.2
    if (!hostUri && Platform.OS === 'android') {
        return 'http://10.0.2.2:5000/predict';
    }

    // If physical device, use the host IP from expo config
    return `http://${host}:5000/predict`;
};

const ML_API_URL = getMLServiceUrl();


interface ChatContext {
    lastIntent?: 'LIST' | 'SUM' | 'MAX' | 'INSERT';
    filters: {
        categoryId?: string;
        accountId?: string; // Payment Method
        payeeId?: string;
        startDate?: number;
        endDate?: number;
        limit?: number;
    };
}

let conversationContext: ChatContext = {
    filters: {}
};

export const ChatService = {
    async processMessage(text: string): Promise<string> {
        const lower = text.toLowerCase().trim();

        // 0. RESET CONTEXT if user says "reset" or "start over"
        if (lower === 'reset' || lower === 'start over' || lower === 'clear') {
            conversationContext = { filters: {} };
            return 'Context cleared. What can I help you with?';
        }

        // 1. ENTITY EXTRACTION (Pre-ML) across all logic
        // This is now critical to fix ML hallucinations
        const extracted = await extractEntities(text);

        // --- ML Integration ---
        try {
            console.log(`Attempting to query ML service at ${ML_API_URL} with:`, text);
            const response = await fetch(ML_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: text }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.sql) {
                    let sql = data.sql as string;
                    console.log('Received raw SQL:', sql);

                    // --- ROBUST HYBRID FIX ---
                    // The model might output:
                    // 1. Parameterized: "WHERE label = ?"
                    // 2. Specific Value: "WHERE label = 'Utilities'" (Hallucination)

                    // We handle both by blindly replacing the target (whether it's `?` or `'...'`) 
                    // with the correct entity extracted from logic.

                    if (extracted.categoryId) {
                        const cat = await CategoryRepo.findById(extracted.categoryId);
                        if (cat) {
                            const catLabel = cat.label.replace(/'/g, "''"); // escape quotes for SQL

                            // Regex explanation:
                            // ((?:c|categories)\s*\.?\s*label\s*=\s*)  -> Group 1: Match "c.label ="
                            // (?:\?|(['"])(?:[^'"]+)\2|(?=\s*;))       -> Match `?` OR quoted string OR empty space before semicolon
                            // Replace with Group 1 + 'CorrectLabel'
                            sql = sql.replace(/((?:c|categories)\s*\.?\s*label\s*=\s*)(?:\?|(['"])(?:[^'"]+)\2|(?=\s*;))/gi, `$1'${catLabel}'`);

                            // Also handle "categoryId = ?" or "categoryId = 'uuid'"
                            sql = sql.replace(/((?:t|transactions)\s*\.?\s*categoryId\s*=\s*)(?:\?|(['"])(?:[^'"]+)\2|(?=\s*;))/gi, `$1'${cat.id}'`);
                        }
                    }

                    // B. Payees
                    // Improved Heuristic: "to [Payee]" or "payee [Payee]"
                    // We also fallback to checking if the user text *contains* the extracted payee from ML if needed, but here we trust regex first.
                    const payeeMatch = text.match(/payee\s+['"]?([^'"]+)['"]?/i) || text.match(/to\s+['"]?([^'"]+)['"]?/i) || text.match(/for\s+['"]?([^'"]+)['"]?/i);

                    if (payeeMatch) {
                        const rawPayee = payeeMatch[1].trim().replace(/'/g, "''");
                        // Regex for "p.name ="
                        sql = sql.replace(/((?:p|payees)\s*\.?\s*name\s*=\s*)(?:\?|(['"])(?:[^'"]+)\2|(?=\s*;))/gi, `$1'${rawPayee}'`);
                    }

                    // C. Dates / Years
                    // Heuristic: Extract 4-digit year from text
                    const yearMatch = text.match(/\b(20\d{2})\b/);
                    if (yearMatch) {
                        const year = yearMatch[1];
                        // Regex for "STRFTIME('%Y', ...) =" 
                        // Matches: STRFTIME ( ... ) = ? OR '...' OR ;
                        sql = sql.replace(/(STRFTIME\s*\(\s*['"]%Y['"]\s*,[^)]+\)\s*=\s*)(?:\?|(['"])(?:[^'"]+)\2|(?=\s*;))/gi, `$1'${year}'`);
                    }

                    // Execute SQL
                    try {
                        const { all } = require('../db/sqlite');
                        const results = await all(sql);

                        // Case A: Single Value (SUM, COUNT)
                        if (results.length === 1 && Object.keys(results[0]).length === 1) {
                            const val = Object.values(results[0])[0];
                            return `Result: ${typeof val === 'number' ? val.toFixed(2) : val}`;
                        }

                        // Case B: List of Transactions (or similar)
                        if (results.length > 0) {
                            const first = results[0];
                            const keys = Object.keys(first);

                            // 1. Transaction List? (Has 'amount')
                            if ('amount' in first && ('createdAt' in first || 'date' in first)) {
                                const listStr = results.slice(0, 10).map((r: any) => {
                                    const dateVal = r.createdAt || r.date;
                                    const dateStr = dateVal ? new Date(dateVal).toLocaleDateString() : '';
                                    const amountStr = typeof r.amount === 'number' ? r.amount.toFixed(2) : r.amount;
                                    const label = r.comment || r.label || r.name || 'Expense';
                                    return `- ${label} (${amountStr}) on ${dateStr}`;
                                }).join('\n');

                                const total = results.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
                                return `Found ${results.length} transactions (Total: ${total.toFixed(2)}).\n${listStr}${results.length > 10 ? '\n...and more.' : ''}`;
                            }

                            // 2. Aggregation/Group By? (Has 'label' and some number value)
                            // Look for a key that looks like a value (SUM, COUNT, total, amount)
                            const valueKey = keys.find(k =>
                                k.toUpperCase().includes('SUM') ||
                                k.toUpperCase().includes('COUNT') ||
                                k.toLowerCase() === 'total' ||
                                k.toLowerCase() === 'amount'
                            );

                            if (('label' in first || 'name' in first) && valueKey) {
                                const labelKey = 'label' in first ? 'label' : 'name';
                                const listStr = results.slice(0, 10).map((r: any) => {
                                    const val = typeof r[valueKey] === 'number' ? r[valueKey].toFixed(2) : r[valueKey];
                                    return `- ${r[labelKey]}: ${val}`;
                                }).join('\n');
                                return `Top Results:\n${listStr}${results.length > 10 ? '\n...and more.' : ''}`;
                            }

                            // 3. Generic Fallback
                            const preview = results.slice(0, 5).map((r: any) => JSON.stringify(r)).join('\n');
                            return `Found ${results.length} results.\nHere is a preview:\n${preview}`;
                        } else {
                            return `No results found (ML Query).`;
                        }

                    } catch (dbErr) {
                        console.error('SQL Execution Error:', dbErr);
                        // Fall out to heuristic
                    }
                }
            } else {
                console.log('ML Service unavailable or error:', response.status);
            }
        } catch (err) {
            console.log('ML Service Connection Failed:', err);
            // Proceed to heuristic fallback
        }
        // parameters

        // 1. ENTITY EXTRACTION & DATE PARSING
        const newFilters = await extractEntities(text);

        // Context Logic
        const isRefinement = lower.startsWith('and') || lower.startsWith('what about') || lower.startsWith('how about') || lower.startsWith('also') || (Object.keys(newFilters).length > 0 && lower.split(' ').length <= 4);

        if (isRefinement) {
            conversationContext.filters = { ...conversationContext.filters, ...newFilters };
        } else if (Object.keys(newFilters).length > 0) {
            // New query, reset context but keep new filters
            conversationContext = { filters: newFilters };
            conversationContext.lastIntent = undefined; // Reset intent for new query unless inferred
        }

        const activeFilters = conversationContext.filters;

        // 2. INTENT DETECTION

        // INSERT patterns:
        // "I spend 50 on lunch"
        // "Lunch for 50"
        // "Paid 50 for lunch"
        // Regex: Find a number. 
        // We relax the boundary check to allow currency symbols or tight spacing if keywords are strong.
        let amountMatch = lower.match(/(?:^|\s|\$|₹)(\d+(?:\.\d{1,2})?)(?:\s|$)/);

        const isInsertParams = (lower.includes(' for ') || lower.includes(' on ') || lower.includes(' spent ') || lower.includes(' paid '));
        const isInsertKeyword = (lower.includes('add') || lower.includes('insert') || lower.includes('spend') || lower.includes('paid'));
        const isQueryKeyword = (lower.includes('list') || lower.includes('show') || lower.includes('what') || lower.includes('how much') || lower.includes('top'));

        // Fallback: If strong keyword "spend/paid" is there, take ANY number as amount
        if (!amountMatch && (lower.includes('spend') || lower.includes('paid'))) {
            amountMatch = lower.match(/(\d+(?:\.\d{1,2})?)/);
        }

        if (amountMatch && (isInsertParams || isInsertKeyword) && !isQueryKeyword) {
            if (lower.includes('total') || lower.includes('how much')) {
                conversationContext.lastIntent = 'SUM';
                return await handleSum(activeFilters);
            }
            conversationContext.lastIntent = 'INSERT';
            return await handleInsert(text, amountMatch[1]);
        }

        // MAX / EXPENSIVE
        if (lower.includes('most expensive') || lower.includes('highest') || lower.includes('top expense')) {
            conversationContext.lastIntent = 'MAX';
            return await handleMax(activeFilters);
        }

        // TOP STATS
        if (lower.includes('top')) {
            const match = lower.match(/top\s*(\d+)?/);
            const limit = match?.[1] ? parseInt(match[1], 10) : 5;
            activeFilters.limit = limit;

            if (lower.includes('category') || lower.includes('categories')) {
                const stats = await TransactionRepo.getCategoryStats(limit);
                return `Top ${limit} Spend Categories:\n${stats.map(s => `- ${s.label}: ${s.total.toFixed(2)}`).join('\n')}`;
            }

            conversationContext.lastIntent = 'LIST';
            return await handleList(activeFilters);
        }

        // LIST
        if (lower.includes('list') || lower.includes('show') || lower.includes('expenses')) {
            conversationContext.lastIntent = 'LIST';
            return await handleList(activeFilters);
        }

        // SUM
        if (lower.includes('total') || lower.includes('sum') || lower.includes('how much')) {
            conversationContext.lastIntent = 'SUM';
            return await handleSum(activeFilters);
        }

        // CONTEXTUAL FALLBACK
        // If we have filters but no intent, reuse last intent or default to LIST
        if (Object.keys(activeFilters).length > 0) {
            if (conversationContext.lastIntent === 'SUM') return await handleSum(activeFilters);
            if (conversationContext.lastIntent === 'MAX') return await handleMax(activeFilters);

            // Default to list
            conversationContext.lastIntent = 'LIST';
            return await handleList(activeFilters);
        }

        // Fallback
        return "I'm listening. You can ask me to list expenses, check totals, or add new ones.";
    }
};

// --- HANDLERS ---

async function handleList(filters: any) {
    // Ensure we handle "Top" logic correctly by checking limit
    // If user said "Top expenses in Dec", `filters` has date range, and we set `limit`.
    // TransactionRepo.findWithFilters orders by Date by default. 
    // We need logic: If limit is set AND intent was "top" (inferred), we ideally want sort by Amount?
    // But `handleList` is generic. 
    // Let's create `handleTopList` or modify repo?
    // For now, if "Top" usage maps to `handleList`, we rely on `limit`. 
    // BUT user complained "Top expenses" didn't work. 
    // My previous fix used `getTopExpenses` (sort by Amount). `findWithFilters` sorts by Date.
    // I need `findWithFilters` to support sort order!

    // Quick fix: fetch all matching filters, then sort in memory if limit is small, or add sort param to repo.
    // Let's modify `findWithFilters` call here since I can't easily change repo interface in this block.
    // Wait, I can query and sort in memory since numbers are small.

    let txs = await TransactionRepo.findWithFilters(filters);


    if (filters.limit) {
        txs.sort((a, b) => b.amount - a.amount);
    }

    if (txs.length === 0) {
        let criteria = [];
        if (filters.categoryId) criteria.push('this category');
        if (filters.startDate) criteria.push(`this date range`);
        if (filters.accountId) criteria.push('this payment method');
        const extras = criteria.length > 0 ? ` for ${criteria.join(', ')}` : '';

        // More detailed debug-friendly response
        let details = '';
        if (filters.startDate) details += `\n(Date: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()})`;

        return `No expenses found${extras}.${details}`;
    }

    // Summary line
    const total = txs.reduce((sum, t) => sum + t.amount, 0);
    const count = txs.length;

    const limit = filters.limit || 10;
    const shown = txs.slice(0, limit);

    let response = `Found ${count} expenses totaling ${total.toFixed(2)}.\nHere are the top ${shown.length}:`;
    shown.forEach(t => {
        response += `\n- ${t.comment || 'Expense'} (${t.amount}) on ${new Date(t.createdAt).toLocaleDateString()}`;
    });

    return response;
}

async function handleSum(filters: any) {
    const total = await TransactionRepo.getSum(filters);

    let parts = [];
    if (filters.categoryId) {
        const cat = await CategoryRepo.findById(filters.categoryId);
        if (cat) parts.push(`on ${cat.label}`);
    }
    if (filters.accountId) {
        const acc = await AccountRepo.findById(filters.accountId);
        if (acc) parts.push(`using ${acc.label}`);
    }
    if (filters.payeeId) {
        const payee = await PayeeRepo.findById(filters.payeeId);
        if (payee) parts.push(`at ${payee.name}`);
    }

    let datePart = '';
    if (filters.startDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        // Check if it looks like a whole month?
        // Rough check: start is 1st of month, end is last of month?
        // For now, simpler: "from X to Y"
        datePart = ` between ${start.toLocaleDateString()} and ${end.toLocaleDateString()}`;
    }

    const desc = parts.length > 0 ? parts.join(' ') : 'total';
    return `Total spent ${desc}${datePart}: ${total.toFixed(2)}`;
}

async function handleMax(filters: any) {
    if (Object.keys(filters).length === 0) {
        const tx = await TransactionRepo.getMostExpensiveTransaction();
        if (!tx) return 'No expenses found.';
        return `Most expensive spend: ${tx.amount} on ${tx.comment || 'Unknown'} (${new Date(tx.createdAt).toLocaleDateString()})`;
    } else {
        const all = await TransactionRepo.findWithFilters({ ...filters });
        if (all.length === 0) return 'No expenses found.';
        const max = all.sort((a, b) => b.amount - a.amount)[0];
        return `Highest expense in this context: ${max.amount} on ${max.comment || 'Unknown'} (${new Date(max.createdAt).toLocaleDateString()})`;
    }
}

async function handleInsert(text: string, amountStr: string) {
    const amount = parseFloat(amountStr);
    const lower = text.toLowerCase();

    // Improved cleanup
    // "I spend 50 on lunch" -> remove "I spend 50 on"
    // "Lunch for 50" -> remove "for 50"
    // Regex replace is safer

    // Remove amount
    let clean = lower.replace(amountStr, '');

    // Remove keywords
    clean = clean.replace(/^(i\s+)?(spend|spent|paid|add|insert)(\s+on|\s+for)?/g, '');
    clean = clean.replace(/(\s+on|\s+for|\s+at)\s*$/, ''); // trailing
    clean = clean.replace(/^\s*(on|for|at)\s+/, ''); // leading

    // Remove "today", "yesterday" if present in text but used for date?
    // Let's remove them to avoid "lunch today" as category
    clean = clean.replace(/\b(today|yesterday|tomorrow)\b/g, '').trim();

    let categoryId = null;
    let payeeId = null;

    // Check for "at" or "in" to split Note vs Payee
    // "Lunch at TechM" -> Note: Lunch, Payee: TechM
    const splitMatch = clean.match(/^(.+?)\s+(?:at|in)\s+(.+)$/);
    let notePart = clean;
    let payeePart = null;

    if (splitMatch) {
        notePart = splitMatch[1].trim();
        payeePart = splitMatch[2].trim();
    }

    // Try to find Category or Payee
    // If payeePart exists, use it.
    if (payeePart) {
        const payee = await PayeeRepo.findByName(payeePart);
        if (payee) {
            payeeId = payee.id;
            // Infer category?
            // Use notePart to find category?
            const cat = await findCategoryByName(notePart);
            if (cat) categoryId = cat.id;
            else {
                // Try last tx of Payee
                const last = await TransactionRepo.getLastByPayee(payee.id);
                if (last?.categoryId) categoryId = last.categoryId;
            }
        } else {
            const newPayee = await PayeeRepo.create(payeePart);
            payeeId = newPayee.id;
            // Still try to find category from notePart
            const cat = await findCategoryByName(notePart);
            if (cat) categoryId = cat.id;
        }
    } else {
        // No explicit payee split. Treat whole as "Note OR Category OR Payee"
        const cat = await findCategoryByName(clean);
        if (cat) {
            categoryId = cat.id;
            notePart = cat.label; // Use proper casing
        } else {
            const payee = await PayeeRepo.findByName(clean);
            if (payee) {
                payeeId = payee.id;
                const last = await TransactionRepo.getLastByPayee(payee.id);
                if (last?.categoryId) categoryId = last.categoryId;
                notePart = clean; // Use as note still?
            } else {
                // New Payee/Note? 
                // Default: Treat as Note.
                notePart = clean;
            }
        }
    }

    await TransactionRepo.create({
        amount,
        categoryId,
        payeeId,
        comment: notePart,
        createdAt: Date.now()
    });

    return `Added expense: ${notePart}${payeePart ? ` at ${payeePart}` : ''} for ${amount}`;
}

// --- PARSERS ---

async function extractEntities(text: string) {
    const filters: any = {};
    const lower = text.toLowerCase();

    // 1. DATES
    const dateRange = parseDateRange(text);
    if (dateRange) {
        filters.startDate = dateRange.start;
        filters.endDate = dateRange.end;
    }

    // 2. CATEGORIES
    const categories = await CategoryRepo.listAll();
    // Longest matches first to avoid partials (e.g. "Food" vs "Fast Food")
    categories.sort((a, b) => b.label.length - a.label.length);
    for (const cat of categories) {
        if (lower.includes(cat.label.toLowerCase())) {
            filters.categoryId = cat.id;
            break; // assume one category per query for now
        }
    }

    // 3. ACCOUNTS (Methods)
    const accounts = await AccountRepo.listAll();
    for (const acc of accounts) {
        // "using Credit Card", "via Cash"
        if (lower.includes(acc.label.toLowerCase())) {
            filters.accountId = acc.id;
            break;
        }
    }

    // 4. PAYEES (Harder, costly to list all. Maybe fuzzy match if "at [Payee]"?)

    return filters;
}

function parseDateRange(text: string): { start: number; end: number } | null {
    const now = new Date();
    const lower = text.toLowerCase();

    // "Yesterday", "Today"
    if (lower.includes('today')) {
        const start = new Date(now.setHours(0, 0, 0, 0)).getTime();
        const end = new Date(now.setHours(23, 59, 59, 999)).getTime();
        return { start, end };
    }
    if (lower.includes('yesterday')) {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        const start = new Date(d.setHours(0, 0, 0, 0)).getTime();
        const end = new Date(d.setHours(23, 59, 59, 999)).getTime();
        return { start, end };
    }

    // "January", "Jan 2023"
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    for (let i = 0; i < 12; i++) {
        if (lower.includes(months[i]) || (shortMonths[i] !== months[i] && lower.includes(` ${shortMonths[i]} `))) {
            // Found a month. Look for Year.
            const yearMatch = lower.match(/\d{4}/);
            const year = yearMatch ? parseInt(yearMatch[0]) : now.getFullYear();

            // Check for specific day "5th of January", "January 5", "Jan 5"
            // Regex look around the month?
            // Simple approach: Match "\d+ (of)? Month" or "Month \d+"
            // FIX: Restrict day number to 1-2 digits to avoid matching "December 2024" as Day 2024.
            // AND ensure it is a standalone number (boundary check) to avoid matching "December 2025" as Day 20.
            const dayMatchBefore = lower.match(new RegExp(`(\\b\\d{1,2})(?:st|nd|rd|th)?\\b\\s+(?:of\\s+)?(?:${months[i]}|${shortMonths[i]})`));
            const dayMatchAfter = lower.match(new RegExp(`(?:${months[i]}|${shortMonths[i]})\\s+(\\b\\d{1,2})(?:st|nd|rd|th)?\\b`));

            if (dayMatchBefore || dayMatchAfter) {
                const day = parseInt(dayMatchBefore ? dayMatchBefore[1] : dayMatchAfter![1]);
                const start = new Date(year, i, day).getTime();
                const end = new Date(year, i, day, 23, 59, 59).getTime(); // Single day
                return { start, end };
            }

            // Whole Month
            const start = new Date(year, i, 1).getTime();
            const end = new Date(year, i + 1, 0, 23, 59, 59).getTime();
            return { start, end };
        }
    }

    // "2023-01-05"
    const isoMatch = lower.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const d = new Date(isoMatch[0]);
        const start = d.setHours(0, 0, 0, 0);
        const end = d.setHours(23, 59, 59, 999);
        return { start, end };
    }

    return null;
}

async function findCategoryByName(name: string): Promise<Category | undefined> {
    const all = await CategoryRepo.listAll();
    return all.find((c) => c.label.toLowerCase() === name.toLowerCase());
}
